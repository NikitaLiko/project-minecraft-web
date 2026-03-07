'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import { soundEngine } from '@/lib/sounds';
import { TacticalInput } from '@/components/ui/tactical-input';

interface User {
  username: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
  uuid: string;
  profile: {
    kills: number;
    deaths: number;
    wins: number;
    losses: number;
    playTime: number;
    isOnline: boolean;
    lastSeen: string | null;
  } | null;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  uuid: string;
  kills: number;
  deaths: number;
  kd: string;
  wins: number;
  isOnline: boolean;
}

const TacticalCard = ({ children, className = '', title }: { children: React.ReactNode; className?: string; title?: string }) => (
  <div className={`relative bg-card/30 border border-primary/20 backdrop-blur-sm p-6 group overflow-hidden ${className}`}>
    {/* Corner Accents */}
    <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-primary/50 group-hover:border-primary transition-colors" />
    <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-primary/50 group-hover:border-primary transition-colors" />
    <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-primary/50 group-hover:border-primary transition-colors" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-primary/50 group-hover:border-primary transition-colors" />

    {/* Scanline Effect */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 translate-y-[-100%] group-hover:translate-y-[100%] transition-all duration-1000 pointer-events-none" />

    {title && (
      <div className="mb-4 flex items-center gap-2 border-b border-primary/20 pb-2">
        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">{title}</h3>
      </div>
    )}

    {children}
  </div>
);

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    soundEngine.playClick();
    setLanguage(language === 'en' ? 'ru' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      onMouseEnter={() => soundEngine.playHover()}
      className="relative px-3 py-1 group overflow-hidden border border-primary/30 hover:border-primary/60 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold font-mono ${language === 'en' ? 'text-primary' : 'text-muted-foreground'}`}>EN</span>
        <span className="text-[10px] text-primary/30">/</span>
        <span className={`text-[10px] font-bold font-mono ${language === 'ru' ? 'text-primary' : 'text-muted-foreground'}`}>RU</span>
      </div>
    </button>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchUser(true);
    fetchStatus();
    fetchLeaderboard();
    const statusInterval = setInterval(fetchStatus, 2000);
    const statsInterval = setInterval(() => fetchUser(false), 5000);
    const lbInterval = setInterval(fetchLeaderboard, 10000);
    return () => {
      clearInterval(statusInterval);
      clearInterval(statsInterval);
      clearInterval(lbInterval);
    };
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.maintenance) {
        // Redirect handled by layout, but just in case
        // window.location.reload(); 
      }
      setServerStatus(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchUser(initial = false) {
    try {
      // 10 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Use new endpoint to avoid adblockers blocking "auth/me"
      const res = await fetch('/api/profile/get', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Not authenticated (${res.status})`);
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      console.error('[Dashboard] fetchUser error:', error);
      if (initial) {
        // Clear invalid session via new endpoint, non-blocking
        fetch('/api/profile/logout', { method: 'POST' }).catch(() => { });
        router.push('/login');
      }
    } finally {
      if (initial) setLoading(false);
    }
  }

  async function fetchLeaderboard() {
    try {
      const res = await fetch('/api/minecraft/leaderboard?sort=kills&limit=5');
      const data = await res.json();
      if (data.leaderboard) setLeaderboard(data.leaderboard);
    } catch (e) {
      console.error('Leaderboard fetch failed', e);
    }
  }

  const handleLogout = async () => {
    soundEngine.playClick();
    try {
      await fetch('/api/profile/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleDownloadLauncher = () => {
    if (downloading) return;
    soundEngine.playClick();
    setDownloading(true);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const link = document.createElement('a');
          link.href = '/launcher/launcher.exe';
          link.download = 'PJM-Launcher.exe';
          link.click();
          setTimeout(() => {
            setDownloading(false);
            setDownloadProgress(0);
          }, 1000);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 120);
  };

  const handleChangePassword = async () => {
    soundEngine.playClick();
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: isRu ? 'Заполните все поля' : 'All fields required' });
      soundEngine.playError();
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: isRu ? 'Минимум 8 символов' : 'Min 8 characters' });
      soundEngine.playError();
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: isRu ? 'Пароли не совпадают' : 'Passwords do not match' });
      soundEngine.playError();
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordMessage({ type: 'success', text: isRu ? 'Пароль изменён!' : 'Password changed!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        soundEngine.playSuccess();
      } else {
        const errorText = data.error === 'Неверный текущий пароль'
          ? (isRu ? 'Неверный текущий пароль' : 'Wrong current password')
          : data.error || (isRu ? 'Ошибка' : 'Error');
        setPasswordMessage({ type: 'error', text: errorText });
        soundEngine.playError();
      }
    } catch {
      setPasswordMessage({ type: 'error', text: isRu ? 'Ошибка сети' : 'Network error' });
      soundEngine.playError();
    } finally {
      setPasswordLoading(false);
    }
  };

  const isRu = t.common.loading === 'ЗАГРУЗКА';

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
  }

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="flex flex-col items-center gap-4">
  //         <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
  //         <div className="text-xs font-mono text-primary animate-pulse tracking-[0.3em]">{t.common.loading}...</div>
  //       </div>
  //     </div>
  //   );
  // }

  // if !user return null was blocking too. use skeleton.
  const displayUser = user || {
    username: 'LOADING...',
    email: '...',
    role: 'GUEST',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    uuid: 'steve',
    profile: {
      kills: 0,
      deaths: 0,
      wins: 0,
      losses: 0,
      playTime: 0,
      isOnline: false,
      lastSeen: null
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-display selection:bg-primary/20">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full border-b border-primary/20 bg-background/90 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-primary animate-pulse" />
            <h1 className="text-xl font-bold tracking-[0.2em] text-primary glitch-text" data-text="PROJECT: MINECRAFT">
              PROJECT: MINECRAFT
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block mr-2">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider">{displayUser.username}</div>
              <div className="text-[10px] text-primary font-mono">{displayUser.role}</div>
            </div>

            {/* Separator */}
            <div className="h-8 w-px bg-primary/20 hidden sm:block" />

            <LanguageSwitcher />

            <button
              onClick={handleLogout}
              onMouseEnter={() => soundEngine.playHover()}
              className="group relative px-3 py-1 flex items-center justify-center transition-all duration-200 hover:bg-destructive/10 border border-destructive/30"
            >
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-destructive group-hover:text-destructive/80">
                {t.dashboard.logout}
              </span>

              {/* Corner accents for button feel - Red style */}
              <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-destructive/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-destructive/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 max-w-7xl mx-auto px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-end justify-between border-b border-primary/20 pb-4">
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-widest mb-2">
                {t.dashboard.welcome}, <span className="text-primary">{displayUser.username}</span>
              </h2>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                {t.dashboard.id}: {displayUser.email}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-mono font-bold text-primary tabular-nums">
                {time.toLocaleTimeString()}
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {time.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Status Card */}
          <TacticalCard title={t.dashboard.status}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-bold uppercase tracking-wider">{t.dashboard.account_active}</div>
                <div className="text-xs text-muted-foreground font-mono mt-1">{t.dashboard.access_level_granted}</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-primary/10 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground mb-1">{t.dashboard.role}</div>
                <div className="font-mono text-sm text-primary">{displayUser.role}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground mb-1">{t.admin.latency}</div>
                <div className="font-mono text-sm text-primary">{serverStatus?.ping || 0} ms</div>
              </div>
            </div>

            {displayUser.role === 'ADMIN' && (
              <div className="mt-4">
                <button
                  onClick={() => router.push('/admin')}
                  className="w-full py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <span>{t.dashboard.admin_panel}</span>
                  <span>→</span>
                </button>
              </div>
            )}
          </TacticalCard>

          {/* Game Stats */}
          <TacticalCard title={t.dashboard.game_stats}>
            {displayUser?.profile ? (
              <div className="space-y-3">
                {/* K/D Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-background/30 border border-primary/10 p-2 text-center">
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">Убийства</div>
                    <div className="font-mono text-xl font-bold text-foreground">{displayUser.profile.kills}</div>
                  </div>
                  <div className="bg-background/30 border border-primary/10 p-2 text-center">
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">Смерти</div>
                    <div className="font-mono text-xl font-bold text-muted-foreground">{displayUser.profile.deaths}</div>
                  </div>
                  <div className="bg-background/30 border border-primary/10 p-2 text-center">
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">K/D</div>
                    <div className={`font-mono text-xl font-bold ${displayUser.profile.deaths === 0
                      ? 'text-primary'
                      : displayUser.profile.kills / displayUser.profile.deaths >= 1
                        ? 'text-green-400'
                        : 'text-destructive'
                      }`}>
                      {displayUser.profile.deaths > 0
                        ? (displayUser.profile.kills / displayUser.profile.deaths).toFixed(2)
                        : displayUser.profile.kills.toFixed(2)}
                    </div>
                  </div>
                </div>
                {/* Wins / Losses */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background/30 border border-green-500/20 p-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase text-muted-foreground">Победы</span>
                    <span className="font-mono font-bold text-green-400">{displayUser.profile.wins}</span>
                  </div>
                  <div className="bg-background/30 border border-destructive/20 p-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase text-muted-foreground">Поражения</span>
                    <span className="font-mono font-bold text-destructive">{displayUser.profile.losses}</span>
                  </div>
                </div>

                {/* Play Time */}
                <div className="pt-1 border-t border-primary/10 flex items-center justify-between">
                  <span className="text-[10px] uppercase text-muted-foreground">Время в игре</span>
                  <span className="font-mono text-xs text-primary">
                    {displayUser.profile.playTime < 60
                      ? `${displayUser.profile.playTime} мин`
                      : `${Math.floor(displayUser.profile.playTime / 60)}ч ${displayUser.profile.playTime % 60}м`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Статистика появится<br />после первого матча
                </div>
              </div>
            )}
          </TacticalCard>

          {/* Launcher Download Card */}
          <TacticalCard title={t.dashboard.download_launcher} className="relative overflow-hidden">
            <div className="flex flex-col gap-3">
              <div className="text-xs text-muted-foreground font-mono">{t.dashboard.download_subtitle}</div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-primary border border-primary/20 px-2 py-0.5 bg-primary/5">
                  {t.dashboard.download_version}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground border border-primary/20 px-2 py-0.5">
                  {t.dashboard.download_size}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground border border-primary/20 px-2 py-0.5">
                  WINDOWS x64
                </span>
              </div>

              {downloading ? (
                <div className="space-y-2 mt-1">
                  <div className="flex justify-between text-[10px] font-mono text-primary/60 uppercase tracking-widest">
                    <span>DOWNLOADING...</span>
                    <span>{Math.min(Math.round(downloadProgress), 100)}%</span>
                  </div>
                  <div className="h-2 bg-primary/10 border border-primary/20 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-150 relative"
                      style={{ width: `${Math.min(downloadProgress, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1s_infinite]" />
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleDownloadLauncher}
                  onMouseEnter={() => soundEngine.playHover()}
                  className="group w-full relative py-3 bg-primary/10 hover:bg-primary/20 border border-primary text-primary transition-all duration-300 uppercase tracking-[0.2em] font-bold text-xs overflow-hidden mt-1"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t.dashboard.download_windows}
                  </span>
                  <div className="absolute inset-0 bg-primary/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
                </button>
              )}
            </div>
          </TacticalCard>
        </div>

        {/* Change Password Section */}
        <div className="mt-6">
          <TacticalCard title={isRu ? 'СМЕНА ПАРОЛЯ' : 'CHANGE PASSWORD'}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TacticalInput
                type="password"
                label={isRu ? 'ТЕКУЩИЙ ПАРОЛЬ' : 'CURRENT PASSWORD'}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={passwordLoading}
              />
              <TacticalInput
                type="password"
                label={isRu ? 'НОВЫЙ ПАРОЛЬ' : 'NEW PASSWORD'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={passwordLoading}
              />
              <TacticalInput
                type="password"
                label={isRu ? 'ПОВТОР НОВОГО ПАРОЛЯ' : 'CONFIRM NEW PASSWORD'}
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={passwordLoading}
              />
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary/10">
              {passwordMessage ? (
                <span className={`text-[10px] uppercase tracking-widest font-mono ${
                  passwordMessage.type === 'success' ? 'text-green-500' : 'text-destructive'
                }`}>
                  {passwordMessage.type === 'success' ? '✓' : '⚠'} {passwordMessage.text}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-mono">
                  {isRu ? 'МИНИМУМ 8 СИМВОЛОВ' : 'MIN 8 CHARACTERS'}
                </span>
              )}
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                onMouseEnter={() => soundEngine.playHover()}
                className="group relative px-6 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/50 hover:border-primary text-primary transition-all duration-300 uppercase tracking-[0.15em] font-bold text-[11px] disabled:opacity-50 overflow-hidden"
              >
                <span className="relative z-10">
                  {passwordLoading
                    ? (isRu ? 'СОХРАНЕНИЕ...' : 'SAVING...')
                    : (isRu ? 'СМЕНИТЬ ПАРОЛЬ' : 'CHANGE PASSWORD')}
                </span>
                <div className="absolute inset-0 bg-primary/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
              </button>
            </div>
          </TacticalCard>
        </div>


        {/* Community & Top Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Quick Actions / Community */}
          <div className="md:col-span-1">
            <TacticalCard title={t.dashboard.community} className="h-full">
              <div className="space-y-4">
                <a
                  href="https://discord.gg/zmeJMqH7j8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group p-4 border border-primary/20 bg-card/30 hover:border-[#5865F2] transition-colors hover:bg-[#5865F2]/5 relative overflow-hidden"
                  onMouseEnter={() => soundEngine.playHover()}
                  onClick={() => soundEngine.playClick()}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <span className="font-bold tracking-wider group-hover:text-[#5865F2] transition-colors">{t.dashboard.discord}</span>
                    <span className="text-[#5865F2] opacity-50 group-hover:opacity-100">↗</span>
                  </div>
                  {/* Hover effect similar to TacticalCard */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2]/0 via-[#5865F2]/5 to-[#5865F2]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </a>

                <a
                  href="https://t.me/project_minecraft"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group p-4 border border-primary/20 bg-card/30 hover:border-[#24A1DE] transition-colors hover:bg-[#24A1DE]/5 relative overflow-hidden"
                  onMouseEnter={() => soundEngine.playHover()}
                  onClick={() => soundEngine.playClick()}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <span className="font-bold tracking-wider group-hover:text-[#24A1DE] transition-colors">{t.dashboard.telegram}</span>
                    <span className="text-[#24A1DE] opacity-50 group-hover:opacity-100">↗</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#24A1DE]/0 via-[#24A1DE]/5 to-[#24A1DE]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </a>
              </div>
            </TacticalCard>
          </div>

          {/* Top Players */}
          <div className="md:col-span-2">
            <TacticalCard className="h-full overflow-hidden">
              <div className="mb-4 flex items-center justify-between border-b border-primary/20 pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">{t.dashboard.top_players}</h3>
                </div>
                <a href="/leaderboard" className="text-[10px] font-mono text-primary/60 hover:text-primary border border-primary/20 hover:border-primary/50 px-2 py-1 transition-colors">
                  ВСЕ →
                </a>
              </div>

              {leaderboard.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Нет данных — статистика появится после матчей
                </div>
              ) : (
                <div className="divide-y divide-primary/10">
                  {leaderboard.map((entry) => {
                    const isMe = displayUser?.username === entry.username;
                    const rankEmoji = ['🥇', '🥈', '🥉'][entry.rank - 1] || `#${entry.rank}`;
                    return (
                      <a
                        key={entry.username}
                        href={`/stats/${entry.username}`}
                        className={`flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors group ${isMe ? 'bg-primary/10 border-l-2 border-primary' : ''
                          }`}
                      >
                        {/* Rank */}
                        <span className="w-8 text-center text-sm shrink-0">{rankEmoji}</span>

                        {/* Avatar */}
                        <img
                          src={`https://mc-heads.net/avatar/${entry.uuid}/28`}
                          alt={entry.username}
                          className="w-7 h-7 border border-primary/20 shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />

                        {/* Name + online */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-sm truncate ${isMe ? 'text-primary font-bold' : 'text-foreground group-hover:text-primary transition-colors'
                              }`}>
                              {entry.username}
                              {isMe && <span className="ml-1 text-[10px] text-primary/60">(вы)</span>}
                            </span>
                            {entry.isOnline && (
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 shrink-0 text-right">
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase">Убийства</div>
                            <div className="font-mono text-sm font-bold text-foreground">{entry.kills}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase">K/D</div>
                            <div className={`font-mono text-sm font-bold ${parseFloat(entry.kd) >= 1 ? 'text-green-400' : 'text-destructive'
                              }`}>{entry.kd}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase">Победы</div>
                            <div className="font-mono text-sm font-bold text-foreground">{entry.wins}</div>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </TacticalCard>
          </div>

        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/90 border-t border-primary/20 backdrop-blur py-1 px-4 z-50">
        <div className="flex justify-between items-center max-w-7xl mx-auto text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
          <div>&copy; 2026 PROJECT: MINECRAFT</div>
        </div>
      </footer>
    </div>
  );
}
