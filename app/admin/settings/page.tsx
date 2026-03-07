'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { soundEngine } from '@/lib/sounds';

export default function SettingsPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    serverIp: '',
    serverPort: '25565',
    rconPort: '',
    rconPassword: '',
    maintenanceMode: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setFormData({
          serverIp: data.serverIp || '',
          serverPort: data.serverPort?.toString() || '25565',
          rconPort: data.rconPort?.toString() || '',
          rconPassword: data.rconPassword || '',
          maintenanceMode: data.maintenanceMode || false
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    soundEngine.playClick();

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        // Optional: Show success notification or sound
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xs uppercase tracking-[0.2em] animate-pulse text-muted-foreground">{t.common.loading}...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div>
        <h2 className="text-2xl font-black uppercase tracking-[0.1em] mb-1">{t.admin.settings}</h2>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">SYSTEM CONFIGURATION</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Connection Section */}
        <div className="bg-card/30 border border-primary/20 relative group">
          {/* Decorative Corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary/50" />
          <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary/50" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary/50" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary/50" />

          <div className="p-4 border-b border-primary/20 bg-primary/5">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t.admin.connection}</h3>
          </div>

          <div className="p-6 space-y-6">

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                {t.admin.target_ip}
              </label>
              <input
                type="text"
                value={formData.serverIp}
                onChange={(e) => setFormData({ ...formData, serverIp: e.target.value })}
                placeholder="192.168.1.1 or domain.com"
                className="w-full bg-background/50 border border-primary/30 p-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30"
                spellCheck={false}
              />
              <p className="text-[10px] text-primary/40 uppercase tracking-widest font-mono">
                {t.admin.primary_endpoint}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  {t.admin.port}
                </label>
                <input
                  type="number"
                  value={formData.serverPort}
                  onChange={(e) => setFormData({ ...formData, serverPort: e.target.value })}
                  placeholder="25565"
                  className="w-full bg-background/50 border border-primary/30 p-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30"
                />
                <p className="text-[10px] text-primary/40 uppercase tracking-widest font-mono">
                  {t.admin.default_port}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  {t.admin.rcon_port}
                </label>
                <input
                  type="number"
                  value={formData.rconPort || ''}
                  onChange={(e) => setFormData({ ...formData, rconPort: e.target.value })}
                  placeholder="25575"
                  className="w-full bg-background/50 border border-primary/30 p-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30"
                />
                <p className="text-[10px] text-primary/40 uppercase tracking-widest font-mono">
                  {t.admin.default_rcon_port}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                {t.admin.rcon_password}
              </label>
              <input
                type="password"
                value={formData.rconPassword || ''}
                onChange={(e) => setFormData({ ...formData, rconPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-background/50 border border-primary/30 p-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30"
              />
            </div>

            <div className="pt-4 border-t border-primary/10">
              <button
                type="submit"
                disabled={saving}
                onMouseEnter={() => soundEngine.playHover()}
                className="px-8 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/50 text-primary text-xs font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <span className="relative z-10">{saving ? t.common.processing : t.admin.save}</span>
                <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>

              {/* Success Indicator (Simple fade out) */}
              {/* Ideally we'd have a toast system, but for now this button state is feedback enough */}
            </div>

          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-card/30 border-l-2 border-primary/50 p-6 relative">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4">{t.admin.notes}</h3>
          <ul className="space-y-2">
            {t.admin.notes_text.map((note, i) => (
              <li key={i} className="text-xs text-muted-foreground font-mono flex items-start gap-2">
                <span className="text-primary">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>

      </form>
    </div>
  );
}
