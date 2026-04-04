'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
    rank: number;
    username: string;
    uuid: string;
    level: number;
    kills: number;
    deaths: number;
    kd: string;
    wins: number;
    losses: number;
    playTime: number;
    experience: number;
    isOnline: boolean;
}

type SortOption = 'kills' | 'level' | 'playTime' | 'wins' | 'experience';

const SORT_LABELS: Record<SortOption, string> = {
    kills: 'Убийства',
    level: 'Уровень',
    playTime: 'Время игры',
    wins: 'Победы',
    experience: 'Опыт',
};

function formatPlayTime(minutes: number): string {
    if (minutes < 60) return `${minutes}м`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
}

const TacticalCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`relative bg-card/30 border border-primary/20 backdrop-blur-sm group overflow-hidden ${className}`}>
        <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-primary/50 group-hover:border-primary transition-colors" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-primary/50 group-hover:border-primary transition-colors" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-primary/50 group-hover:border-primary transition-colors" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-primary/50 group-hover:border-primary transition-colors" />
        {children}
    </div>
);

export default function LeaderboardPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('kills');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/minecraft/leaderboard?sort=${sortBy}&limit=20`)
            .then(r => r.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                setEntries(data.leaderboard);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [sortBy]);

    const rankColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <div className="border-b border-primary/20 bg-card/20 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-px w-8 bg-primary/60" />
                                <span className="text-xs font-mono text-primary/60 uppercase tracking-widest">Project: Minecraft</span>
                            </div>
                            <h1 className="text-3xl font-display font-bold text-foreground">
                                <span className="text-primary">//</span> ТАБЛИЦА ЛИДЕРОВ
                            </h1>
                        </div>
                        <Link
                            href="/"
                            className="text-xs font-mono text-primary/60 hover:text-primary border border-primary/20 hover:border-primary/50 px-3 py-1.5 transition-colors"
                        >
                            ← НА ГЛАВНУЮ
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Sort Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map(key => (
                        <button
                            key={key}
                            onClick={() => setSortBy(key)}
                            className={`px-4 py-1.5 text-xs font-mono uppercase tracking-widest border transition-all ${sortBy === key
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'border-primary/20 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                }`}
                        >
                            {SORT_LABELS[key]}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="text-center py-20 text-primary/60 font-mono animate-pulse">
                        ЗАГРУЗКА ДАННЫХ...
                    </div>
                )}

                {error && (
                    <div className="text-center py-20 text-destructive font-mono">
                        ОШИБКА: {error}
                    </div>
                )}

                {!loading && !error && (
                    <TacticalCard>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-primary/20 bg-primary/5">
                                        <th className="px-4 py-3 text-left text-xs font-mono text-primary/60 uppercase tracking-widest w-12">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-mono text-primary/60 uppercase tracking-widest">Игрок</th>
                                        <th className="px-4 py-3 text-center text-xs font-mono text-primary/60 uppercase tracking-widest">Уровень</th>
                                        <th className="px-4 py-3 text-center text-xs font-mono text-primary/60 uppercase tracking-widest">Убийства</th>
                                        <th className="px-4 py-3 text-center text-xs font-mono text-primary/60 uppercase tracking-widest">Смерти</th>
                                        <th className="px-4 py-3 text-center text-xs font-mono text-primary/60 uppercase tracking-widest">K/D</th>
                                        <th className="px-4 py-3 text-center text-xs font-mono text-primary/60 uppercase tracking-widest">Победы</th>
                                        <th className="px-4 py-3 text-center text-xs font-mono text-primary/60 uppercase tracking-widest">Время</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-16 text-muted-foreground font-mono text-sm">
                                                НЕТ ДАННЫХ — СТАТИСТИКА ПОЯВИТСЯ ПОСЛЕ ПЕРВОЙ ИГРЫ
                                            </td>
                                        </tr>
                                    )}
                                    {entries.map((entry) => (
                                        <tr
                                            key={entry.username}
                                            className="border-b border-primary/10 hover:bg-primary/5 transition-colors group"
                                        >
                                            <td className="px-4 py-3">
                                                <span className={`font-display font-bold text-sm ${rankColors[entry.rank - 1] || 'text-muted-foreground'}`}>
                                                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link href={`/stats/${entry.username}`} className="flex items-center gap-3 group/link">
                                                    <img
                                                        src={`https://mc-heads.net/avatar/${entry.uuid}/32`}
                                                        alt={entry.username}
                                                        className="w-8 h-8 rounded-sm border border-primary/20"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.ico'; }}
                                                    />
                                                    <div>
                                                        <div className="font-mono text-sm text-foreground group-hover/link:text-primary transition-colors">
                                                            {entry.username}
                                                        </div>
                                                        {entry.isOnline && (
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                                <span className="text-xs text-green-400 font-mono">онлайн</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="font-display text-primary font-bold">{entry.level}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono text-sm text-foreground">{entry.kills}</td>
                                            <td className="px-4 py-3 text-center font-mono text-sm text-muted-foreground">{entry.deaths}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-mono text-sm font-bold ${parseFloat(entry.kd) >= 1 ? 'text-green-400' : 'text-destructive'}`}>
                                                    {entry.kd}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono text-sm text-foreground">{entry.wins}</td>
                                            <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">{formatPlayTime(entry.playTime)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TacticalCard>
                )}
            </div>
        </div>
    );
}
