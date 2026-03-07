'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { soundEngine } from '@/lib/sounds';
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.user.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
      setUser(data.user);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background font-display">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="uppercase tracking-[0.2em] text-sm animate-pulse text-primary">{t.common.loading}...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/admin', label: t.admin.overview },
    { href: '/admin/users', label: t.admin.users },
    { href: '/admin/logs', label: t.admin.logs },
    { href: '/admin/analytics', label: t.admin.analytics },
    { href: '/admin/settings', label: t.admin.settings },
  ];

  return (
    <div className="min-h-screen bg-background flex font-display overflow-hidden relative">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-card/80 backdrop-blur border-r border-primary/20 flex flex-col relative z-20">
        <div className="p-6 border-b border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <Link href="/admin" className="text-2xl font-black tracking-[0.15em] text-foreground block mb-1">
            PROJECT: MINECRAFT
          </Link>
          <p className="text-[10px] text-primary uppercase tracking-[0.3em] font-mono">{t.admin.panel}</p>
        </div>

        <nav className="flex-1 py-6 px-3">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onMouseEnter={() => soundEngine.playHover()}
                  onClick={() => soundEngine.playClick()}
                  className={`block px-4 py-3 text-xs uppercase tracking-[0.15em] transition-all border border-transparent ${pathname === item.href
                      ? 'bg-primary/10 text-primary border-primary/50 shadow-[0_0_10px_rgba(var(--color-primary),0.2)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-primary/5 hover:border-primary/20'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-1 rounded-full ${pathname === item.href ? 'bg-primary animate-pulse' : 'bg-muted-foreground/50'}`} />
                    {item.label}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-primary/20 bg-background/50">
          <Link
            href="/dashboard"
            onMouseEnter={() => soundEngine.playHover()}
            onClick={() => soundEngine.playClick()}
            className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            {t.common.back}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className="h-16 border-b border-primary/20 bg-background/95 backdrop-blur flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
              SECTION: <span className="text-foreground">{navItems.find(i => i.href === pathname)?.label || 'UNKNOWN'}</span>
            </h1>
          </div>
          <div className="flex items-center gap-6 pr-20">
            <div className="text-right">
              <span className="block text-xs font-bold text-foreground uppercase tracking-wider">{user.username}</span>
              <span className="block text-[10px] text-primary uppercase tracking-widest font-mono">ADMINISTRATOR</span>
            </div>
            <div className="h-8 w-8 bg-primary/20 border border-primary/50 flex items-center justify-center text-xs font-bold text-primary">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
