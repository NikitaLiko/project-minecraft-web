'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';

interface Stats {
  totalUsers: number;
  bannedUsers: number;
  activeToday: number;
  newThisWeek: number;
}

interface RecentUser {
  id: number;
  username: string;
  email: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
}

interface ServerStatus {
  system: {
    cpu: number;
    memory: number;
    memoryUsed: number;
    memoryTotal: number;
  };
  server: {
    online: boolean;
    ping: number;
    ip: string | null;
  };
}

export default function AdminPage() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchServerStatus();
    fetchConfig(); // Fetch maintenance state
    const interval = setInterval(fetchServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      setMaintenanceMode(data.maintenanceMode);
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleMaintenance() {
    try {
      const newState = !maintenanceMode;
      setMaintenanceMode(newState); // Optimistic UI

      const savedSettings = localStorage.getItem('warborn_settings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};

      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceMode: newState,
          serverIp: settings.serverIp || 'pl1.hoxen.one',
          serverPort: settings.serverPort || 25567
        })
      });
    } catch (e) {
      setMaintenanceMode(!maintenanceMode); // Revert
      alert('Failed to update maintenance mode');
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentUsers(data.recentUsers);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchServerStatus() {
    try {
      const savedSettings = localStorage.getItem('warborn_settings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};

      const res = await fetch('/api/admin/server-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverIp: settings.serverIp || '',
          serverPort: settings.serverPort || '25565',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setServerStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch server status:', error);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em] animate-pulse text-muted-foreground">{t.common.loading}...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-display">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card/50 border border-primary/20 p-6 relative group overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary" />
          <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary" />

          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 relative z-10">{t.admin.total_users}</p>
          <p className="text-4xl font-bold font-mono text-foreground relative z-10">{stats?.totalUsers || 0}</p>
        </div>

        <div className="bg-card/50 border border-primary/20 p-6 relative group overflow-hidden">
          <div className="absolute inset-0 bg-green-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-green-500" />
          <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-green-500" />

          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 relative z-10">{t.admin.active_24h}</p>
          <p className="text-4xl font-bold font-mono text-green-500 relative z-10">{stats?.activeToday || 0}</p>
        </div>

        <div className="bg-card/50 border border-primary/20 p-6 relative group overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-blue-500" />
          <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-blue-500" />

          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 relative z-10">{t.admin.new_7d}</p>
          <p className="text-4xl font-bold font-mono text-blue-500 relative z-10">{stats?.newThisWeek || 0}</p>
        </div>

        <div className="bg-card/50 border border-primary/20 p-6 relative group overflow-hidden">
          <div className="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-red-500" />
          <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-red-500" />

          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 relative z-10">{t.admin.banned_stats}</p>
          <p className="text-4xl font-bold font-mono text-destructive relative z-10">{stats?.bannedUsers || 0}</p>
        </div>
      </div>

      {/* Maintenance Controls */}
      <div className="bg-card/30 border border-primary/20 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold uppercase tracking-widest text-primary mb-1">MAINTENANCE MODE</h3>
          <p className="text-xs text-muted-foreground font-mono">
            When enabled, only ADMINS can access the dashboard.
          </p>
        </div>
        <button
          onClick={toggleMaintenance}
          className={`
             px-6 py-2 text-xs font-bold font-mono uppercase tracking-[0.2em] border transition-all
             ${maintenanceMode
              ? 'border-destructive text-destructive hover:bg-destructive/10'
              : 'border-green-500 text-green-500 hover:bg-green-500/10'}
          `}
        >
          {maintenanceMode ? 'ENABLED (Click to Disable)' : 'DISABLED (Click to Enable)'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Users Table */}
        <div className="lg:col-span-2 bg-card/30 border border-primary/20 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary" />

          <div className="p-4 border-b border-primary/20 flex items-center justify-between bg-primary/5">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t.admin.new_registrations}</h3>
            <Link href="/admin/users" className="text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors">
              {t.admin.view_all} →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">ID</th>
                  <th className="px-6 py-3 text-left font-medium">{t.auth.username}</th>
                  <th className="px-6 py-3 text-left font-medium">{t.auth.email}</th>
                  <th className="px-6 py-3 text-left font-medium">{t.common.status}</th>
                  <th className="px-6 py-3 text-left font-medium">{t.dashboard.account_created}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 text-xs">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-muted-foreground">#{user.id.toString().padStart(5, '0')}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{user.username}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-sm text-[10px] uppercase tracking-wide border ${user.isBanned
                        ? 'border-destructive/30 bg-destructive/10 text-destructive'
                        : 'border-green-500/30 bg-green-500/10 text-green-500'
                        }`}>
                        {user.isBanned ? t.dashboard.banned : t.dashboard.active}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Status Panel */}
        <div className="bg-card/30 border border-primary/20 relative flex flex-col">
          <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary" />

          <div className="p-4 border-b border-primary/20 bg-primary/5">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t.admin.system_telemetry}</h3>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-6">
            {/* Server Connection Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider mb-2">
                <span className="text-muted-foreground">{t.admin.connection_status}</span>
                <span className={`flex items-center gap-2 ${serverStatus?.server.online ? 'text-green-500' : 'text-destructive'}`}>
                  <span className={`w-2 h-2 rounded-full ${serverStatus?.server.online ? 'bg-green-500 animate-pulse' : 'bg-destructive'}`} />
                  {serverStatus?.server.online ? t.common.on : t.common.off}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-background/50 p-2 border border-primary/10">
                  <div className="text-[10px] text-muted-foreground mb-1 uppercase">{t.admin.latency}</div>
                  <div className={serverStatus?.server.online ? 'text-green-500' : 'text-muted-foreground'}>
                    {serverStatus?.server.online ? `${serverStatus.server.ping}ms` : '--'}
                  </div>
                </div>
                <div className="bg-background/50 p-2 border border-primary/10">
                  <div className="text-[10px] text-muted-foreground mb-1 uppercase">IP</div>
                  <div className="text-foreground truncate">
                    {serverStatus?.server.ip || 'NOT SET'}
                  </div>
                </div>
              </div>
            </div>

            {/* Hardware Stats */}
            <div className="space-y-4 pt-4 border-t border-primary/10">
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-wider">
                  <span className="text-muted-foreground">{t.admin.cpu}</span>
                  <span className="font-mono text-primary">{serverStatus?.system.cpu || 0}%</span>
                </div>
                <div className="h-1 bg-background border border-primary/20">
                  <div
                    className={`h-full transition-all duration-1000 ${(serverStatus?.system.cpu || 0) > 80 ? 'bg-destructive' :
                      (serverStatus?.system.cpu || 0) > 50 ? 'bg-yellow-500' : 'bg-primary'
                      }`}
                    style={{ width: `${serverStatus?.system.cpu || 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-wider">
                  <span className="text-muted-foreground">{t.admin.memory}</span>
                  <span className="font-mono text-primary">{serverStatus?.system.memoryUsed || 0} / {serverStatus?.system.memoryTotal || 0} GB</span>
                </div>
                <div className="h-1 bg-background border border-primary/20">
                  <div
                    className={`h-full transition-all duration-1000 ${(serverStatus?.system.memory || 0) > 80 ? 'bg-destructive' :
                      (serverStatus?.system.memory || 0) > 50 ? 'bg-yellow-500' : 'bg-primary'
                      }`}
                    style={{ width: `${serverStatus?.system.memory || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Component Check */}
            <div className="mt-auto pt-6 grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1 p-2 bg-background/30 border border-primary/10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">DB</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 bg-background/30 border border-primary/10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">API</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 bg-background/30 border border-primary/10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">AUTH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
