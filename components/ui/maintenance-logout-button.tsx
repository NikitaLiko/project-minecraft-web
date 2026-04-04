'use client';

import { useRouter } from 'next/navigation';

export function MaintenanceLogoutButton() {
    const router = useRouter();

    async function handleLogout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Force redirect anyway
            window.location.href = '/login';
        }
    }

    return (
        <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
        >
            Return to Login
        </button>
    );
}
