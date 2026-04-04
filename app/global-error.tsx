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

export default function GlobalError({
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
        <html>
            <body className="bg-black text-red-600 font-mono flex items-center justify-center min-h-screen p-4">
                <div className="max-w-xl w-full border border-red-800 p-8 bg-black/90">
                    <h1 className="text-4xl font-black mb-4 tracking-widest">SYSTEM FATAL ERROR</h1>
                    <div className="mb-8 border-l-2 border-red-600 pl-4">
                        <p className="text-xl mb-2">CRITICAL ROOT FAILURE</p>
                        <p className="font-mono text-sm opacity-70 break-all">{error.message}</p>
                        {error.digest && <p className="font-mono text-xs opacity-50 mt-2">ERR_DIGEST: {error.digest}</p>}
                    </div>
                    <button
                        onClick={handleReset}
                        className="bg-red-900/20 hover:bg-red-900/40 text-red-500 px-6 py-3 border border-red-800 transition-all uppercase tracking-widest text-sm font-bold"
                    >
                        ATTEMPT RECOVERY
                    </button>
                </div>
            </body>
        </html>
    );
}
