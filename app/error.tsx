'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'chunk_reload';
const RELOAD_MAX = 2;

function isChunkLoadError(msg: string) {
    return /chunk|Failed to (load|fetch)|dynamically imported module|loading css chunk/i.test(msg);
}

function safeReload() {
    const count = Number(sessionStorage.getItem(RELOAD_KEY) || '0');
    if (count >= RELOAD_MAX) return false;
    sessionStorage.setItem(RELOAD_KEY, String(count + 1));
    window.location.reload();
    return true;
}

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
        if (isChunkLoadError(error.message)) {
            safeReload();
        }
    }, [error]);

    const handleReset = () => {
        sessionStorage.removeItem(RELOAD_KEY);
        window.location.reload();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-red-500 font-mono p-4">
            <h2 className="text-2xl font-bold mb-4">CRITICAL SYSTEM FAILURE // КРИТИЧЕСКИЙ СБОЙ</h2>
            <div className="border border-red-900 bg-red-950/20 p-4 rounded max-w-lg w-full mb-6">
                <p className="mb-2">ERROR_CODE: {error.digest || 'UNKNOWN'}</p>
                <p className="opacity-70 text-sm">{error.message}</p>
            </div>
            <button
                onClick={handleReset}
                className="px-6 py-2 border border-red-500 hover:bg-red-500/10 transition-colors uppercase tracking-widest"
            >
                REBOOT SYSTEM // ПЕРЕЗАГРУЗКА
            </button>
        </div>
    );
}
