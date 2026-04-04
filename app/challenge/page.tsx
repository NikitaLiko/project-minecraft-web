'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Turnstile } from '@marsidev/react-turnstile';
import { TacticalCard } from '@/components/ui/tactical-card';

function ChallengeForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState('');

    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const handleSuccess = async (token: string) => {
        try {
            const res = await fetch('/api/auth/challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            if (!res.ok) {
                throw new Error('Verification failed');
            }

            router.push(callbackUrl);
            router.refresh();
        } catch (err) {
            setError('Verification failed. Please try again.');
            console.error(err);
        }
    };

    return (
        <div className="max-w-md w-full text-center space-y-6">
            <h1 className="text-2xl font-bold tracking-widest text-primary animate-pulse">
                SYSTEM SECURITY CHECK
            </h1>

            <p className="text-sm font-mono text-muted-foreground">
                Please verify you are human to access the system.
            </p>

            <div className="flex justify-center p-4 border border-primary/20 bg-primary/5 rounded-lg backdrop-blur-sm">
                <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                    onSuccess={handleSuccess}
                    options={{
                        theme: 'dark',
                    }}
                />
            </div>

            {error && (
                <div className="text-destructive font-mono text-xs">
                    {error}
                </div>
            )}

            <div className="text-[10px] text-muted-foreground/30 font-mono uppercase">
                S.H.I.E.L.D. PROTOCOL ACTIVE // ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </div>
        </div>
    );
}

export default function ChallengePage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black font-display text-foreground">
            <Suspense fallback={<div className="text-primary animate-pulse">INITIALIZING SECURITY...</div>}>
                <ChallengeForm />
            </Suspense>
        </div>
    );
}
