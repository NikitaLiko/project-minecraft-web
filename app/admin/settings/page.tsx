'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n';
import { soundEngine } from '@/lib/sounds';

export default function SettingsPage() {
  const { t, language } = useLanguage();
  const isRu = language === 'ru';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [launcherStatus, setLauncherStatus] = useState<{
    exists: boolean;
    sizeMB: number | null;
    remote?: boolean;
    remoteUrl?: string;
    hint?: string;
  } | null>(null);
  const [launcherUploading, setLauncherUploading] = useState(false);
  const [launcherMessage, setLauncherMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    serverIp: '',
    serverPort: '25565',
    rconPort: '',
    rconPassword: '',
    maintenanceMode: false
  });

  useEffect(() => {
    fetchSettings();
    fetchLauncherStatus();
  }, []);

  async function fetchLauncherStatus() {
    try {
      const res = await fetch('/api/admin/launcher/status');
      if (res.ok) {
        const data = await res.json();
        setLauncherStatus({
          exists: data.exists,
          sizeMB: data.sizeMB ?? null,
          remote: data.remote,
          remoteUrl: data.remoteUrl,
          hint: data.hint,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const c = data.config || data;
        setFormData({
          serverIp: c.serverIp || '',
          serverPort: c.serverPort?.toString() || '25565',
          rconPort: c.rconPort?.toString() || '',
          rconPassword: c.rconPassword || '',
          maintenanceMode: c.maintenanceMode || false
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

  async function handleLauncherUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.exe') && !ext.endsWith('.zip') && !ext.endsWith('.7z')) {
      setLauncherMessage({
        type: 'error',
        text: isRu ? 'Допустимы .exe, .zip, .7z' : 'Allowed: .exe, .zip, .7z',
      });
      soundEngine.playError();
      return;
    }
    setLauncherUploading(true);
    setLauncherMessage(null);
    soundEngine.playClick();
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/launcher/upload', {
        method: 'POST',
        body: formData,
      });
      let data: { success?: boolean; error?: string; sizeMB?: number } = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        // Response is not JSON (e.g. nginx 413/502 HTML page)
        if (res.status === 413) {
          setLauncherMessage({
            type: 'error',
            text: isRu
              ? 'Файл слишком большой. Добавьте в nginx: client_max_body_size 150M;'
              : 'File too large. Add to nginx: client_max_body_size 150M;',
          });
        } else {
          setLauncherMessage({
            type: 'error',
            text: isRu
              ? `Ошибка сервера ${res.status}. Проверьте логи nginx.`
              : `Server error ${res.status}. Check nginx logs.`,
          });
        }
        soundEngine.playError();
        return;
      }
      if (res.ok && data.success) {
        setLauncherMessage({ type: 'success', text: `${t.admin.launcher_uploaded} (${data.sizeMB} MB)` });
        soundEngine.playSuccess();
        fetchLauncherStatus();
      } else {
        setLauncherMessage({ type: 'error', text: data.error || 'Upload failed' });
        soundEngine.playError();
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : isRu
            ? 'Ошибка сети. Проверьте nginx (client_max_body_size 150M) и логи.'
            : 'Network error. Check nginx (client_max_body_size 150M) and logs.';
      setLauncherMessage({ type: 'error', text: msg });
      soundEngine.playError();
    } finally {
      setLauncherUploading(false);
      e.target.value = '';
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

        {/* Launcher Section */}
        <div className="bg-card/30 border border-primary/20 relative group">
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary/50" />
          <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary/50" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary/50" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary/50" />
          <div className="p-4 border-b border-primary/20 bg-primary/5">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{t.admin.launcher}</h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
              {t.admin.launcher_upload_hint}
            </p>
            {launcherStatus && (
              <div className="text-xs font-mono text-muted-foreground space-y-1">
                {launcherStatus.hint && (
                  <div className="text-amber-500/90 break-all">{launcherStatus.hint}</div>
                )}
                {launcherStatus.exists ? (
                  <div className="space-y-0.5">
                    <span className="text-green-500 block">
                      ✓ {launcherStatus.remote ? t.admin.launcher_cdn : t.admin.launcher_uploaded}
                      {launcherStatus.sizeMB != null
                        ? ` — ${t.admin.launcher_size}: ${launcherStatus.sizeMB} MB`
                        : ''}
                    </span>
                    {launcherStatus.remote && launcherStatus.remoteUrl && (
                      <span className="block text-[10px] opacity-80 break-all">{launcherStatus.remoteUrl}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-amber-500/80">○ {t.admin.launcher_not_uploaded}</span>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".exe,.zip,.7z"
              onChange={handleLauncherUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={launcherUploading}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={() => soundEngine.playHover()}
              className="px-6 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/50 text-primary text-xs font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {launcherUploading ? t.common.processing : t.admin.launcher_select_file}
            </button>
            {launcherMessage && (
              <p className={`text-xs font-mono ${launcherMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                {launcherMessage.text}
              </p>
            )}
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
