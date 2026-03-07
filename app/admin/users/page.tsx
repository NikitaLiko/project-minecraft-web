'use client';

import { useState, useEffect, useCallback } from 'react';
import { TacticalInput } from '@/components/ui/tactical-input';
import { soundEngine } from '@/lib/sounds';
import { useLanguage } from '@/lib/i18n';

interface GameProfile {
  id: number;
  nickname: string | null;
  level: number;
  experience: number;
  money: number;
  faction: string | null;
  playTime: number;
  kills: number;
  deaths: number;
  wins: number;
  losses: number;
  damageDealt: number;
  damageTaken: number;
  blocksPlaced: number;
  blocksBroken: number;
  lastSeen: string | null;
  isOnline: boolean;
}

interface SessionInfo {
  id: string;
  expires: string;
}

interface AuthLogEntry {
  id: number;
  username: string;
  ip: string | null;
  source: string;
  success: boolean;
  message: string | null;
  createdAt: string;
}

interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  role: string;
  isBanned: boolean;
  isHwidBanned: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  ipAddress: string | null;
  hardwareId: string | null;
  profile: GameProfile | null;
}

interface UserDetail extends User {
  sessions: SessionInfo[];
}

export default function AdminUsersPage() {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [selectedAuthLogs, setSelectedAuthLogs] = useState<AuthLogEntry[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'game' | 'sessions' | 'logs'>('info');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }

  const fetchUserDetail = useCallback(async (userId: number) => {
    setDetailLoading(true);
    setDetailTab('info');
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedUser(data.user);
        setSelectedAuthLogs(data.authLogs || []);
      }
    } catch (error) {
      console.error('Failed to fetch user detail:', error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  async function handleBan(userId: number, isBanned: boolean, type: 'account' | 'hwid' = 'account') {
    soundEngine.playClick();
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban?type=${type}`, {
        method: isBanned ? 'DELETE' : 'POST',
      });
      if (res.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) fetchUserDetail(userId);
        soundEngine.playSuccess();
      } else {
        soundEngine.playError();
      }
    } catch (error) {
      console.error('Ban action failed:', error);
      soundEngine.playError();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(userId: number, username: string) {
    if (!confirm(`CONFIRM DELETION // ПОДТВЕРДИТЕ УДАЛЕНИЕ: "${username}"?`)) return;

    soundEngine.playClick();
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) setSelectedUser(null);
        soundEngine.playSuccess();
      } else {
        soundEngine.playError();
      }
    } catch (error) {
      console.error('Delete failed:', error);
      soundEngine.playError();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRoleChange(userId: number, newRole: string) {
    soundEngine.playClick();
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) fetchUserDetail(userId);
        soundEngine.playSuccess();
      } else {
        soundEngine.playError();
      }
    } catch (error) {
      console.error('Role change failed:', error);
      soundEngine.playError();
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatDateTime(date: string) {
    return new Date(date).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function getTimeSince(date: string) {
    const now = new Date();
    const created = new Date(date);
    const diff = now.getTime() - created.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (language === 'ru') {
      if (days === 0) return 'Сегодня';
      if (days === 1) return '1д';
      if (days < 30) return `${days}д`;
      const months = Math.floor(days / 30);
      if (months < 12) return `${months}м`;
      return `${Math.floor(months / 12)}г`;
    }

    if (days === 0) return 'Today';
    if (days === 1) return '1d';
    if (days < 30) return `${days}d`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}m`;
    return `${Math.floor(months / 12)}y`;
  }

  function formatPlayTime(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.uuid.toLowerCase().includes(search.toLowerCase()) ||
      (user.ipAddress && user.ipAddress.includes(search)) ||
      (user.hardwareId && user.hardwareId.toLowerCase().includes(search.toLowerCase()))
  );

  const isRu = language === 'ru';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em] animate-pulse text-muted-foreground">
            {t.common.loading}...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-display">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-primary/20 pb-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest mb-1">{t.admin.users}</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t.admin.total_users}: {users.length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <TacticalInput
          placeholder={isRu ? 'ПОИСК ПО ИМЕНИ, EMAIL, UUID, IP, HWID...' : 'SEARCH BY NAME, EMAIL, UUID, IP, HWID...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="bg-card/30 border border-primary/20 relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary" />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary/5 border-b border-primary/20">
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4 font-bold">ID</th>
                <th className="px-6 py-4 font-bold">{t.auth.username}</th>
                <th className="px-6 py-4 font-bold">{t.auth.email}</th>
                <th className="px-6 py-4 font-bold">{t.dashboard.role}</th>
                <th className="px-6 py-4 font-bold">{t.common.status}</th>
                <th className="px-6 py-4 font-bold">{t.dashboard.account_created}</th>
                <th className="px-6 py-4 font-bold">{t.dashboard.last_login}</th>
                <th className="px-6 py-4 font-bold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10 text-xs">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-primary/5 transition-colors group cursor-pointer"
                  onClick={() => fetchUserDetail(user.id)}
                >
                  <td className="px-6 py-4 font-mono text-muted-foreground">
                    #{user.id.toString().padStart(5, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.role === 'ADMIN' && (
                        <span className="text-primary text-xs" title="Admin">
                          ★
                        </span>
                      )}
                      {user.role === 'MODERATOR' && (
                        <span className="text-blue-400 text-xs" title="Moderator">
                          ◆
                        </span>
                      )}
                      <span className="font-bold tracking-wide">{user.username}</span>
                      {user.profile?.isOnline && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" title="Online" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-mono">{user.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={actionLoading === user.id}
                      className="bg-background/50 border border-primary/20 px-2 py-1 text-[10px] uppercase tracking-wider focus:outline-none focus:border-primary cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playClick();
                      }}
                    >
                      <option value="USER">User</option>
                      <option value="MODERATOR">Moderator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] uppercase tracking-wider border ${
                          user.isBanned
                            ? 'border-destructive/30 bg-destructive/10 text-destructive'
                            : 'border-green-500/30 bg-green-500/10 text-green-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${user.isBanned ? 'bg-destructive' : 'bg-green-500'}`}
                        />
                        {user.isBanned ? t.dashboard.banned : t.dashboard.active}
                      </span>
                      {user.isHwidBanned && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[9px] uppercase tracking-wider border border-orange-500/30 bg-orange-500/10 text-orange-500">
                          HWID BAN
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <div className="flex flex-col">
                      <span className="font-mono">{formatDate(user.createdAt)}</span>
                      <span className="text-[9px] text-muted-foreground/50 uppercase">
                        {getTimeSince(user.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-mono">
                    {user.lastLogin ? formatDate(user.lastLogin) : '---'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div
                      className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleBan(user.id, user.isBanned, 'account')}
                        disabled={actionLoading === user.id}
                        onMouseEnter={() => soundEngine.playHover()}
                        className={`px-3 py-1 border text-[9px] uppercase tracking-wider transition-all disabled:opacity-50 ${
                          user.isBanned
                            ? 'border-green-500 text-green-500 hover:bg-green-500/10'
                            : 'border-yellow-500 text-yellow-500 hover:bg-yellow-500/10'
                        }`}
                      >
                        {user.isBanned ? 'UNBAN' : 'BAN'}
                      </button>

                      {!user.isBanned && (
                        <button
                          onClick={() => handleBan(user.id, false, 'hwid')}
                          disabled={actionLoading === user.id}
                          onMouseEnter={() => soundEngine.playHover()}
                          className="px-3 py-1 border border-orange-500 text-orange-500 hover:bg-orange-500/10 text-[9px] uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                          HWID
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        disabled={actionLoading === user.id}
                        onMouseEnter={() => soundEngine.playHover()}
                        className="px-3 py-1 border border-destructive text-destructive hover:bg-destructive/10 text-[9px] uppercase tracking-wider transition-all disabled:opacity-50"
                      >
                        DEL
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-[10px] text-muted-foreground/40 uppercase tracking-widest text-right px-2 font-mono">
        SECURE CONNECTION // DATABASE READ-WRITE ACCESS
      </div>

      {/* User Detail Modal */}
      {(selectedUser || detailLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => {
            if (!detailLoading) setSelectedUser(null);
          }}
        >
          <div
            className="relative bg-background border border-primary/30 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-primary" />
            <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-primary" />

            {detailLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-xs uppercase tracking-[0.2em] animate-pulse text-muted-foreground">
                    {t.common.loading}...
                  </span>
                </div>
              </div>
            ) : selectedUser ? (
              <>
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-primary/5 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-lg uppercase">
                      {selectedUser.username[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold uppercase tracking-widest">{selectedUser.username}</h3>
                        <span
                          className={`px-2 py-0.5 text-[9px] uppercase tracking-wider border ${
                            selectedUser.role === 'ADMIN'
                              ? 'border-primary/50 text-primary bg-primary/10'
                              : selectedUser.role === 'MODERATOR'
                                ? 'border-blue-400/50 text-blue-400 bg-blue-400/10'
                                : 'border-muted-foreground/30 text-muted-foreground bg-muted-foreground/5'
                          }`}
                        >
                          {selectedUser.role}
                        </span>
                        {selectedUser.isBanned && (
                          <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider border border-destructive/50 text-destructive bg-destructive/10">
                            {t.dashboard.banned}
                          </span>
                        )}
                        {selectedUser.isHwidBanned && (
                          <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider border border-orange-500/50 text-orange-500 bg-orange-500/10">
                            HWID BAN
                          </span>
                        )}
                        {selectedUser.profile?.isOnline && (
                          <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider border border-green-500/50 text-green-500 bg-green-500/10 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            ONLINE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        ID: #{selectedUser.id.toString().padStart(5, '0')} // UUID: {selectedUser.uuid}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    onMouseEnter={() => soundEngine.playHover()}
                    className="w-8 h-8 border border-primary/30 hover:bg-primary/10 transition-colors flex items-center justify-center text-muted-foreground hover:text-primary"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-primary/20 shrink-0">
                  {(
                    [
                      { key: 'info', label: isRu ? 'АККАУНТ' : 'ACCOUNT' },
                      { key: 'game', label: isRu ? 'ИГРОВОЙ ПРОФИЛЬ' : 'GAME PROFILE' },
                      { key: 'sessions', label: isRu ? 'СЕССИИ' : 'SESSIONS' },
                      { key: 'logs', label: isRu ? 'ЛОГИ ВХОДА' : 'AUTH LOGS' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setDetailTab(tab.key);
                        soundEngine.playClick();
                      }}
                      onMouseEnter={() => soundEngine.playHover()}
                      className={`px-6 py-3 text-[10px] uppercase tracking-widest transition-colors relative ${
                        detailTab === tab.key
                          ? 'text-primary bg-primary/5'
                          : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                      }`}
                    >
                      {tab.label}
                      {detailTab === tab.key && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="overflow-y-auto flex-1 p-6">
                  {detailTab === 'info' && <AccountTab user={selectedUser} formatDateTime={formatDateTime} isRu={isRu} />}
                  {detailTab === 'game' && <GameTab profile={selectedUser.profile} formatPlayTime={formatPlayTime} formatDateTime={formatDateTime} isRu={isRu} />}
                  {detailTab === 'sessions' && <SessionsTab sessions={selectedUser.sessions} formatDateTime={formatDateTime} isRu={isRu} />}
                  {detailTab === 'logs' && <AuthLogsTab logs={selectedAuthLogs} formatDateTime={formatDateTime} isRu={isRu} />}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono, warn }: { label: string; value: React.ReactNode; mono?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-primary/10 last:border-0">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground w-40 shrink-0 pt-0.5">
        {label}
      </span>
      <span className={`text-sm ${mono ? 'font-mono' : ''} ${warn ? 'text-orange-400' : 'text-foreground'} break-all`}>
        {value || <span className="text-muted-foreground/40">—</span>}
      </span>
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-primary/5 border border-primary/20 p-4">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className="text-xl font-bold font-mono text-primary">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground/60 mt-1 uppercase">{sub}</div>}
    </div>
  );
}

function AccountTab({ user, formatDateTime, isRu }: { user: UserDetail; formatDateTime: (d: string) => string; isRu: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-0">
          <div className="text-[10px] uppercase tracking-widest text-primary mb-3 border-b border-primary/20 pb-2">
            {isRu ? 'ОСНОВНАЯ ИНФОРМАЦИЯ' : 'BASIC INFORMATION'}
          </div>
          <InfoRow label="ID" value={`#${user.id.toString().padStart(5, '0')}`} mono />
          <InfoRow label="UUID" value={user.uuid} mono />
          <InfoRow label={isRu ? 'ИМЯ' : 'USERNAME'} value={user.username} />
          <InfoRow label={isRu ? 'ПОЧТА' : 'EMAIL'} value={user.email} mono />
          <InfoRow label={isRu ? 'РОЛЬ' : 'ROLE'} value={user.role} />
        </div>

        <div className="space-y-0">
          <div className="text-[10px] uppercase tracking-widest text-primary mb-3 border-b border-primary/20 pb-2">
            {isRu ? 'БЕЗОПАСНОСТЬ' : 'SECURITY'}
          </div>
          <InfoRow
            label={isRu ? 'СТАТУС' : 'STATUS'}
            value={
              <span className={user.isBanned ? 'text-destructive' : 'text-green-500'}>
                {user.isBanned ? (isRu ? 'ЗАБАНЕН' : 'BANNED') : (isRu ? 'АКТИВЕН' : 'ACTIVE')}
              </span>
            }
          />
          <InfoRow
            label="HWID BAN"
            value={
              <span className={user.isHwidBanned ? 'text-orange-500' : 'text-muted-foreground/40'}>
                {user.isHwidBanned ? (isRu ? 'ДА' : 'YES') : (isRu ? 'НЕТ' : 'NO')}
              </span>
            }
          />
          <InfoRow label="IP" value={user.ipAddress} mono warn={!!user.ipAddress} />
          <InfoRow
            label="HWID"
            value={
              user.hardwareId ? (
                <span className="font-mono text-foreground break-all">{user.hardwareId}</span>
              ) : (
                <span className="text-muted-foreground/60 italic">
                  {isRu ? '— заполняется при входе через лаунчер (GML)' : '— set on launcher (GML) login'}
                </span>
              )
            }
          />
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-primary mb-3 border-b border-primary/20 pb-2">
          {isRu ? 'ВРЕМЕННЫЕ МЕТКИ' : 'TIMESTAMPS'}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-primary/5 border border-primary/10 p-3">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
              {isRu ? 'ДАТА РЕГИСТРАЦИИ' : 'CREATED'}
            </div>
            <div className="text-xs font-mono">{formatDateTime(user.createdAt)}</div>
          </div>
          <div className="bg-primary/5 border border-primary/10 p-3">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
              {isRu ? 'ОБНОВЛЁН' : 'UPDATED'}
            </div>
            <div className="text-xs font-mono">{formatDateTime(user.updatedAt)}</div>
          </div>
          <div className="bg-primary/5 border border-primary/10 p-3">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
              {isRu ? 'ПОСЛЕДНИЙ ВХОД' : 'LAST LOGIN'}
            </div>
            <div className="text-xs font-mono">
              {user.lastLogin ? formatDateTime(user.lastLogin) : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GameTab({
  profile,
  formatPlayTime,
  formatDateTime,
  isRu,
}: {
  profile: GameProfile | null;
  formatPlayTime: (m: number) => string;
  formatDateTime: (d: string) => string;
  isRu: boolean;
}) {
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="text-4xl mb-4 opacity-30">⌀</div>
        <span className="text-xs uppercase tracking-widest">
          {isRu ? 'ИГРОВОЙ ПРОФИЛЬ НЕ СОЗДАН' : 'NO GAME PROFILE'}
        </span>
      </div>
    );
  }

  const kd = profile.deaths > 0 ? (profile.kills / profile.deaths).toFixed(2) : profile.kills > 0 ? '∞' : '0.00';
  const wl = profile.losses > 0 ? (profile.wins / profile.losses).toFixed(2) : profile.wins > 0 ? '∞' : '0.00';

  return (
    <div className="space-y-6">
      {profile.nickname && (
        <InfoRow label={isRu ? 'ИГРОВОЙ НИК' : 'NICKNAME'} value={profile.nickname} />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label={isRu ? 'УРОВЕНЬ' : 'LEVEL'} value={profile.level} />
        <StatBox label={isRu ? 'ОПЫТ' : 'XP'} value={profile.experience.toLocaleString()} />
        <StatBox label={isRu ? 'БАЛАНС' : 'MONEY'} value={`$${profile.money.toLocaleString()}`} />
        <StatBox label={isRu ? 'ВРЕМЯ ИГРЫ' : 'PLAY TIME'} value={formatPlayTime(profile.playTime)} />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-primary mb-3 border-b border-primary/20 pb-2">
          {isRu ? 'БОЕВАЯ СТАТИСТИКА' : 'COMBAT STATS'}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label={isRu ? 'УБИЙСТВА' : 'KILLS'} value={profile.kills} />
          <StatBox label={isRu ? 'СМЕРТИ' : 'DEATHS'} value={profile.deaths} />
          <StatBox label="K/D" value={kd} />
          <StatBox label={isRu ? 'ФРАКЦИЯ' : 'FACTION'} value={profile.faction || '—'} />
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-primary mb-3 border-b border-primary/20 pb-2">
          {isRu ? 'МАТЧИ' : 'MATCHES'}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label={isRu ? 'ПОБЕДЫ' : 'WINS'} value={profile.wins} />
          <StatBox label={isRu ? 'ПОРАЖЕНИЯ' : 'LOSSES'} value={profile.losses} />
          <StatBox label="W/L" value={wl} />
          <StatBox label={isRu ? 'ВСЕГО МАТЧЕЙ' : 'TOTAL'} value={profile.wins + profile.losses} />
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-primary mb-3 border-b border-primary/20 pb-2">
          {isRu ? 'УРОН И БЛОКИ' : 'DAMAGE & BLOCKS'}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label={isRu ? 'УРОН НАНЕСЁН' : 'DMG DEALT'} value={profile.damageDealt.toLocaleString()} />
          <StatBox label={isRu ? 'УРОН ПОЛУЧЕН' : 'DMG TAKEN'} value={profile.damageTaken.toLocaleString()} />
          <StatBox label={isRu ? 'БЛОКОВ ПОСТАВЛЕНО' : 'BLOCKS PLACED'} value={profile.blocksPlaced.toLocaleString()} />
          <StatBox label={isRu ? 'БЛОКОВ СЛОМАНО' : 'BLOCKS BROKEN'} value={profile.blocksBroken.toLocaleString()} />
        </div>
      </div>

      {profile.lastSeen && (
        <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest text-right font-mono">
          {isRu ? 'ПОСЛЕДНЯЯ АКТИВНОСТЬ' : 'LAST SEEN'}: {formatDateTime(profile.lastSeen)}
        </div>
      )}
    </div>
  );
}

function SessionsTab({ sessions, formatDateTime, isRu }: { sessions: SessionInfo[]; formatDateTime: (d: string) => string; isRu: boolean }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="text-4xl mb-4 opacity-30">⌀</div>
        <span className="text-xs uppercase tracking-widest">
          {isRu ? 'НЕТ АКТИВНЫХ СЕССИЙ' : 'NO ACTIVE SESSIONS'}
        </span>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
        {isRu ? 'ВСЕГО СЕССИЙ' : 'TOTAL SESSIONS'}: {sessions.length}
      </div>
      {sessions.map((session) => {
        const expires = new Date(session.expires);
        const isExpired = expires < now;
        return (
          <div
            key={session.id}
            className={`flex items-center justify-between px-4 py-3 border ${
              isExpired ? 'border-muted-foreground/10 bg-muted-foreground/5' : 'border-primary/20 bg-primary/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full ${isExpired ? 'bg-muted-foreground/30' : 'bg-green-500 animate-pulse'}`}
              />
              <span className="font-mono text-xs text-muted-foreground">{session.id.slice(0, 16)}...</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {isExpired ? (isRu ? 'ИСТЕКЛА' : 'EXPIRED') : (isRu ? 'АКТИВНА' : 'ACTIVE')}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground/60">
                {formatDateTime(session.expires)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AuthLogsTab({ logs, formatDateTime, isRu }: { logs: AuthLogEntry[]; formatDateTime: (d: string) => string; isRu: boolean }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="text-4xl mb-4 opacity-30">⌀</div>
        <span className="text-xs uppercase tracking-widest">
          {isRu ? 'НЕТ ЛОГОВ АВТОРИЗАЦИИ' : 'NO AUTH LOGS'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
        {isRu ? 'ПОСЛЕДНИЕ 20 ЗАПИСЕЙ' : 'LAST 20 ENTRIES'}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[9px] uppercase tracking-wider text-muted-foreground border-b border-primary/20">
              <th className="px-3 py-2">{isRu ? 'ВРЕМЯ' : 'TIME'}</th>
              <th className="px-3 py-2">{isRu ? 'ИСТОЧНИК' : 'SOURCE'}</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">{isRu ? 'РЕЗУЛЬТАТ' : 'RESULT'}</th>
              <th className="px-3 py-2">{isRu ? 'СООБЩЕНИЕ' : 'MESSAGE'}</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-0.5 text-[9px] uppercase tracking-wider border ${
                      log.source === 'web'
                        ? 'border-blue-400/30 text-blue-400 bg-blue-400/10'
                        : 'border-purple-400/30 text-purple-400 bg-purple-400/10'
                    }`}
                  >
                    {log.source}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
                  {log.ip || '—'}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-wider ${
                      log.success ? 'text-green-500' : 'text-destructive'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${log.success ? 'bg-green-500' : 'bg-destructive'}`} />
                    {log.success ? 'OK' : 'FAIL'}
                  </span>
                </td>
                <td className="px-3 py-2 text-[10px] text-muted-foreground max-w-[200px] truncate">
                  {log.message || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
