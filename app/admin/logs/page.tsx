'use client';

import { useState, useEffect } from 'react';
import { TacticalInput } from '@/components/ui/tactical-input';
import { soundEngine } from '@/lib/sounds';
import { useLanguage } from '@/lib/i18n';

interface AuthLogEntry {
  id: number;
  userId: number | null;
  username: string;
  ip: string | null;
  source: string;
  success: boolean;
  message: string | null;
  createdAt: string;
}

export default function AdminLogsPage() {
  const { t, language } = useLanguage();
  const [logs, setLogs] = useState<AuthLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [page, sourceFilter, successFilter]);

  async function fetchLogs() {
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '50');
      if (sourceFilter) params.set('source', sourceFilter);
      if (successFilter) params.set('success', successFilter);
      if (search) params.set('search', search);

      const res = await fetch('/api/admin/logs?' + params.toString());
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    setPage(1);
    fetchLogs();
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em] animate-pulse text-muted-foreground">{t.common.loading}...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-display">
      <div className="flex items-end justify-between border-b border-primary/20 pb-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest mb-1">
            {language === 'ru' ? 'ЛОГИ АВТОРИЗАЦИЙ' : 'AUTH LOGS'}
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {language === 'ru' ? 'ВСЕГО ЗАПИСЕЙ' : 'TOTAL ENTRIES'}: {total}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] max-w-md">
          <TacticalInput
            placeholder={language === 'ru' ? 'ПОИСК ПО НИКУ / IP...' : 'SEARCH BY USERNAME / IP...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="bg-background/50 border border-primary/20 px-3 py-2 text-[10px] uppercase tracking-wider focus:outline-none focus:border-primary cursor-pointer hover:bg-primary/10 transition-colors"
        >
          <option value="">{language === 'ru' ? 'ВСЕ ИСТОЧНИКИ' : 'ALL SOURCES'}</option>
          <option value="web">WEB</option>
          <option value="launcher">LAUNCHER</option>
        </select>

        <select
          value={successFilter}
          onChange={(e) => { setSuccessFilter(e.target.value); setPage(1); }}
          className="bg-background/50 border border-primary/20 px-3 py-2 text-[10px] uppercase tracking-wider focus:outline-none focus:border-primary cursor-pointer hover:bg-primary/10 transition-colors"
        >
          <option value="">{language === 'ru' ? 'ВСЕ СТАТУСЫ' : 'ALL STATUSES'}</option>
          <option value="true">{language === 'ru' ? 'УСПЕШНЫЕ' : 'SUCCESS'}</option>
          <option value="false">{language === 'ru' ? 'НЕУДАЧНЫЕ' : 'FAILED'}</option>
        </select>

        <button
          onClick={handleSearch}
          onMouseEnter={() => soundEngine.playHover()}
          className="px-4 py-2 border border-primary/50 text-primary text-[10px] uppercase tracking-wider hover:bg-primary/10 transition-colors"
        >
          {language === 'ru' ? 'НАЙТИ' : 'SEARCH'}
        </button>
      </div>

      <div className="bg-card/30 border border-primary/20 relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary" />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary/5 border-b border-primary/20">
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-bold">ID</th>
                <th className="px-4 py-3 font-bold">{language === 'ru' ? 'ВРЕМЯ' : 'TIME'}</th>
                <th className="px-4 py-3 font-bold">{language === 'ru' ? 'ПОЛЬЗОВАТЕЛЬ' : 'USER'}</th>
                <th className="px-4 py-3 font-bold">IP</th>
                <th className="px-4 py-3 font-bold">{language === 'ru' ? 'ИСТОЧНИК' : 'SOURCE'}</th>
                <th className="px-4 py-3 font-bold">{language === 'ru' ? 'СТАТУС' : 'STATUS'}</th>
                <th className="px-4 py-3 font-bold">{language === 'ru' ? 'СООБЩЕНИЕ' : 'MESSAGE'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10 text-xs">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-xs uppercase tracking-wider">
                    {language === 'ru' ? 'НЕТ ЗАПИСЕЙ' : 'NO ENTRIES'}
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-muted-foreground">#{log.id}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3 font-medium">{log.username}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{log.ip || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] uppercase tracking-wider border ${
                      log.source === 'launcher'
                        ? 'border-blue-500/30 bg-blue-500/10 text-blue-500'
                        : 'border-purple-500/30 bg-purple-500/10 text-purple-500'
                    }`}>
                      {log.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] uppercase tracking-wider border ${
                      log.success
                        ? 'border-green-500/30 bg-green-500/10 text-green-500'
                        : 'border-destructive/30 bg-destructive/10 text-destructive'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${log.success ? 'bg-green-500' : 'bg-destructive'}`} />
                      {log.success ? 'OK' : 'FAIL'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">{log.message || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
            {language === 'ru' ? 'СТРАНИЦА' : 'PAGE'} {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); soundEngine.playClick(); }}
              disabled={page <= 1}
              className="px-3 py-1 border border-primary/30 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← {language === 'ru' ? 'НАЗАД' : 'PREV'}
            </button>
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); soundEngine.playClick(); }}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-primary/30 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {language === 'ru' ? 'ДАЛЕЕ' : 'NEXT'} →
            </button>
          </div>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground/40 uppercase tracking-widest text-right px-2 font-mono">
        SECURE CONNECTION // AUTH LOG READ ACCESS
      </div>
    </div>
  );
}
