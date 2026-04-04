'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PlayerStats {
    username: string;
    uuid: string;
    registeredAt: string;
    level: number;
    experience: number;
    money: number;
    faction: string | null;
    playTime: number;
    kills: number;
    deaths: number;
    kd: string;
    wins: number;
    losses: number;
    damageDealt: number;
    damageTaken: number;
    blocksPlaced: number;
    blocksBroken: number;
    isOnline: boolean;
    lastSeen: string | null;
}

function formatPlayTime(minutes: number): string {
    if (minutes < 60) return `${minutes} мин`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}ч ${m}м` : `${h} часов`;
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Никогда';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const StatBox = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div className="relative bg-card/30 border border-primary/20 p-4 group hover:border-primary/50 transition-colors">
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-primary/40 group-hover:border-primary transition-colors" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-primary/40 group-hover:border-primary transition-colors" />
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
        <div className="text-2xl font-display font-bold text-primary">{value}</div>
        {sub && <div className="text-xs font-mono text-muted-foreground mt-0.5">{sub}</div>}
    </div>
);

export default function PlayerStatsPage() {
    const params = useParams();
    const username = params.username as string;
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!username) return;
        setLoading(true);
        fetch(`/api/minecraft/stats/${username}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                setStats(data);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [username]);

    const xpForNextLevel = stats ? (stats.level * 1000) : 1000;
    const xpProgress = stats ? Math.min((stats.experience / xpForNextLevel) * 100, 100) : 0;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <div className="border-b border-primary/20 bg-card/20 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs font-mono text-primary/60">
                            <Link href="/" className="hover:text-primary transition-colors">ГЛАВНАЯ</Link>
                            <span>/</span>
                            <Link href="/leaderboard" className="hover:text-primary transition-colors">ЛИДЕРЫ</Link>
                            <span>/</span>
                            <span className="text-foreground">{username}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {loading && (
                    <div className="text-center py-20 text-primary/60 font-mono animate-pulse">ЗАГРУЗКА...</div>
                )}

                {error && (
                    <div className="text-center py-20">
                        <div className="text-destructive font-mono text-lg mb-2">ИГРОК НЕ НАЙДЕН</div>
                        <div className="text-muted-foreground font-mono text-sm">{error}</div>
                        <Link href="/leaderboard" className="mt-4 inline-block text-xs font-mono text-primary border border-primary/30 px-4 py-2 hover:border-primary transition-colors">
                            ← К ТАБЛИЦЕ ЛИДЕРОВ
                        </Link>
                    </div>
                )}

                {stats && (
                    <div className="space-y-6">
                        {/* Player Header */}
                        <div className="relative bg-card/30 border border-primary/20 p-6 overflow-hidden">
                            <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-primary/50" />
                            <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-primary/50" />
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-primary/50" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-primary/50" />

                            <div className="flex items-start gap-6">
                                <div className="relative">
                                    <img
                                        src={`https://mc-heads.net/avatar/${stats.uuid}/80`}
                                        alt={stats.username}
                                        className="w-20 h-20 border-2 border-primary/40"
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.ico'; }}
                                    />
                                    {stats.isOnline && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background animate-pulse" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-3xl font-display font-bold text-foreground">{stats.username}</h1>
                                        {stats.isOnline ? (
                                            <span className="text-xs font-mono text-green-400 border border-green-400/30 px-2 py-0.5">● ОНЛАЙН</span>
                                        ) : (
                                            <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-0.5">ОФЛАЙН</span>
                                        )}
                                        {stats.faction && (
                                            <span className="text-xs font-mono text-primary border border-primary/30 px-2 py-0.5">{stats.faction}</span>
                                        )}
                                    </div>
                                    <div className="text-xs font-mono text-muted-foreground mb-3">UUID: {stats.uuid}</div>

                                    {/* XP Bar */}
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="text-xs font-mono text-primary/60">УРОВЕНЬ {stats.level}</span>
                                        <span className="text-xs font-mono text-muted-foreground">{stats.experience} / {stats.level * 1000} XP</span>
                                    </div>
                                    <div className="h-2 bg-muted border border-primary/20 overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500"
                                            style={{ width: `${xpProgress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Combat Stats */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-px flex-1 bg-primary/20" />
                                <span className="text-xs font-mono text-primary/60 uppercase tracking-widest">Боевая статистика</span>
                                <div className="h-px flex-1 bg-primary/20" />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatBox label="Убийства" value={stats.kills} />
                                <StatBox label="Смерти" value={stats.deaths} />
                                <StatBox
                                    label="K/D Ratio"
                                    value={stats.kd}
                                    sub={parseFloat(stats.kd) >= 1 ? '▲ Положительный' : '▼ Отрицательный'}
                                />
                                <StatBox label="Победы / Поражения" value={`${stats.wins} / ${stats.losses}`} />
                            </div>
                        </div>

                        {/* Damage Stats */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-px flex-1 bg-primary/20" />
                                <span className="text-xs font-mono text-primary/60 uppercase tracking-widest">Урон</span>
                                <div className="h-px flex-1 bg-primary/20" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <StatBox label="Нанесено урона" value={stats.damageDealt.toFixed(1)} sub="единиц" />
                                <StatBox label="Получено урона" value={stats.damageTaken.toFixed(1)} sub="единиц" />
                            </div>
                        </div>

                        {/* World Stats */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-px flex-1 bg-primary/20" />
                                <span className="text-xs font-mono text-primary/60 uppercase tracking-widest">Мир</span>
                                <div className="h-px flex-1 bg-primary/20" />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatBox label="Блоков поставлено" value={stats.blocksPlaced.toLocaleString()} />
                                <StatBox label="Блоков сломано" value={stats.blocksBroken.toLocaleString()} />
                                <StatBox label="Время игры" value={formatPlayTime(stats.playTime)} />
                                <StatBox label="Монеты" value={stats.money.toLocaleString()} sub="игровая валюта" />
                            </div>
                        </div>

                        {/* Meta */}
                        <div className="grid grid-cols-2 gap-3 text-xs font-mono text-muted-foreground">
                            <div className="border border-primary/10 px-4 py-2">
                                Зарегистрирован: <span className="text-foreground">{formatDate(stats.registeredAt)}</span>
                            </div>
                            <div className="border border-primary/10 px-4 py-2">
                                Последний вход: <span className="text-foreground">{formatDate(stats.lastSeen)}</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <Link href="/leaderboard" className="text-xs font-mono text-primary/60 hover:text-primary border border-primary/20 hover:border-primary/50 px-4 py-2 transition-colors">
                                ← ТАБЛИЦА ЛИДЕРОВ
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
