'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TacticalInput } from '@/components/ui/tactical-input';
import { TacticalButton } from '@/components/ui/tactical-button';
import { TacticalCard } from '@/components/ui/tactical-card';
import { soundEngine } from '@/lib/sounds';
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Turnstile } from '@marsidev/react-turnstile';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    soundEngine.playClick();

    if (password !== confirmPassword) {
      setError('PASSWORDS DO NOT MATCH');
      setLoading(false);
      soundEngine.playError();
      return;
    }

    if (password.length < 6) {
      setError('PASSWORD TOO SHORT (MIN 6)');
      setLoading(false);
      soundEngine.playError();
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
      setError('USERNAME INVALID (3-16 CHARS, A-Z, 0-9, _ ONLY)');
      setLoading(false);
      soundEngine.playError();
      return;
    }

    if (!turnstileToken) {
      setError('PLEASE COMPLETE CAPTCHA');
      setLoading(false);
      soundEngine.playError();
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, token: turnstileToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'REGISTRATION FAILED');
      }

      soundEngine.playSuccess();
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
      soundEngine.playError();
    } finally {
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
              {t.auth.register_title}
            </div>
          </div>
        </div>

        {/* Register Container */}
        <TacticalCard title={t.auth.register_title} className="relative bg-black/40">
          {error && (
            <div className="mb-6 p-3 bg-destructive/10 border-l-2 border-destructive text-destructive text-xs font-mono uppercase tracking-wide flex items-center gap-2 animate-pulse">
              <span>⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <TacticalInput
              label={t.auth.username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              placeholder="USERNAME"
            />

            <TacticalInput
              label={t.auth.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="EMAIL@EXAMPLE.COM"
            />

            <TacticalInput
              label={t.auth.password}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••••••"
            />

            <TacticalInput
              label={t.auth.confirm_password}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              className="w-full mt-4"
            >
              {t.auth.register_action}
            </TacticalButton>
          </form>

          <div className="mt-8 flex justify-center text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
            <span>{t.auth.already_registered}</span>
            <Link
              href="/login"
              className="ml-2 text-primary hover:text-primary/80 transition-colors hover:underline decoration-primary/50 underline-offset-4"
              onMouseEnter={() => soundEngine.playHover()}
              onClick={() => soundEngine.playClick()}
            >
              {t.auth.to_login}
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
