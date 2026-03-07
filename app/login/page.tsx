'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TacticalInput } from '@/components/ui/tactical-input';
import { TacticalButton } from '@/components/ui/tactical-button';
import { TacticalCard } from '@/components/ui/tactical-card';
import { soundEngine } from '@/lib/sounds';
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Turnstile } from '@marsidev/react-turnstile';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        router.push('/dashboard');
      }
    } catch (e) {
      // Not logged in, stay on login page
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    soundEngine.playClick();

    if (!turnstileToken) {
      setError('PLEASE COMPLETE CAPTCHA');
      setLoading(false);
      soundEngine.playError();
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, token: turnstileToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        soundEngine.playError();
        throw new Error(data.error || 'ACCESS DENIED');
      }

      soundEngine.playSuccess();
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-display">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Tactical Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-px bg-primary/20 -z-10" />
          <div className="inline-block bg-background px-4">
            <h1 className="text-4xl font-black tracking-[0.2em] text-foreground mb-1 glitch-text">
              PROJECT: MINECRAFT
            </h1>
            <div className="text-[10px] text-primary uppercase tracking-[0.4em] font-mono">
              {t.auth.login_title}
            </div>
          </div>
        </div>

        {/* Login Container */}
        <TacticalCard title={t.auth.login_title} className="relative bg-black/40">
          {error && (
            <div className="mb-6 p-3 bg-destructive/10 border-l-2 border-destructive text-destructive text-xs font-mono uppercase tracking-wide flex items-center gap-2 animate-pulse">
              <span>⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <TacticalInput
              label={t.auth.username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="USERNAME"
            />

            <TacticalInput
              label={t.auth.password}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
            />

            <div className="flex justify-center my-4">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                onSuccess={setTurnstileToken}
                options={{
                  theme: 'dark',
                }}
              />
            </div>

            <TacticalButton
              type="submit"
              disabled={loading}
              isLoading={loading}
              className="w-full"
            >
              {t.auth.login_action}
            </TacticalButton>
          </form>

          <div className="mt-8 flex justify-between items-center text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
            <Link
              href="/register"
              className="hover:text-primary transition-colors hover:underline decoration-primary/50 underline-offset-4"
              onMouseEnter={() => soundEngine.playHover()}
              onClick={() => soundEngine.playClick()}
            >
              {t.auth.to_register}
            </Link>
            <Link
              href="#"
              className="hover:text-primary transition-colors"
              onMouseEnter={() => soundEngine.playHover()}
            >
              {t.auth.forgot_password}
            </Link>
          </div>
        </TacticalCard>

        {/* System Status */}
        <div className="mt-6 flex justify-between text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest px-2">
          <div>{t.common.status}: <span className="text-green-500/80">{t.common.on}</span></div>
          <div>SECURE: <span className="text-primary/80">TRUE</span></div>
        </div>
      </div>
    </div>
  );
}
