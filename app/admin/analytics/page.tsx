'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';

interface AnalyticsData {
  registrations: Array<{ date: string; count: number }>;
  authAttempts: Array<{ date: string; total: number; successful: number; failed: number }>;
  authBySource: Array<{ source: string; count: number }>;
  serverMetrics: Array<{ tps: number; online: number; createdAt: string }>;
  failedLogins: Array<{ username: string; count: number }>;
  totals: { totalUsers: number; totalBanned: number; totalAuthToday: number };
}

function BarChart({ data, maxVal, color }: { data: Array<{ label: string; value: number }>; maxVal: number; color: string }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-1">
      <div className="flex items-end gap-[2px] h-32">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-primary/30 px-2 py-1 text-[9px] font-mono whitespace-nowrap z-10 pointer-events-none">
              {item.label}: {item.value}
            </div>
            <div
              className={`w-full min-h-[2px] transition-all duration-500 ${color}`}
              style={{ height: `${Math.max((item.value / max) * 100, 2)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[8px] font-mono text-muted-foreground/50 mt-1">
        <span>{data[0]?.label || ''}</span>
        <span>{data[data.length - 1]?.label || ''}</span>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div className="bg-card/50 border border-primary/20 p-5 relative group overflow-hidden">
      <div className={`absolute inset-0 ${color} translate-y-full group-hover:translate-y-0 transition-transform duration-500`} />
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary" />
      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary" />
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 relative z-10">{title}</p>
      <p className="text-3xl font-bold font-mono text-foreground relative z-10">{value}</p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { language } = useLanguage();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/admin/analytics');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatShortDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em] animate-pulse text-muted-foreground">
            {language === 'ru' ? 'ЗАГРУЗКА' : 'LOADING'}...
          </span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-24 text-muted-foreground text-xs uppercase tracking-wider">
        {language === 'ru' ? 'ОШИБКА ЗАГРУЗКИ ДАННЫХ' : 'FAILED TO LOAD DATA'}
      </div>
    );
  }

  const regChartData = data.registrations.map(r => ({
    label: formatShortDate(r.date),
    value: r.count,
  }));

  const authSuccessData = data.authAttempts.map(a => ({
    label: formatShortDate(a.date),
    value: a.successful,
  }));

  const authFailData = data.authAttempts.map(a => ({
    label: formatShortDate(a.date),
    value: a.failed,
  }));

  const authMaxVal = Math.max(
    ...data.authAttempts.map(a => Math.max(a.successful, a.failed)),
    1
  );

  const tpsData = data.serverMetrics.map(m => ({
    label: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: m.tps,
  }));

  const onlineData = data.serverMetrics.map(m => ({
    label: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: m.online,
  }));

  const webCount = data.authBySource.find(s => s.source === 'web')?.count || 0;
  const launcherCount = data.authBySource.find(s => s.source === 'launcher')?.count || 0;
  const totalAuth = webCount + launcherCount || 1;

  return (
    <div className="space-y-8 font-display">
      <div className="border-b border-primary/20 pb-4">
        <h2 className="text-2xl font-bold uppercase tracking-widest mb-1">
          {language === 'ru' ? 'АНАЛИТИКА' : 'ANALYTICS'}
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {language === 'ru' ? 'ДАННЫЕ ЗА ПОСЛЕДНИЕ 30 ДНЕЙ' : 'LAST 30 DAYS DATA'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={language === 'ru' ? 'ВСЕГО ЮЗЕРОВ' : 'TOTAL USERS'}
          value={data.totals.totalUsers}
          color="bg-primary/5"
        />
        <StatCard
          title={language === 'ru' ? 'В БАНЕ' : 'BANNED'}
          value={data.totals.totalBanned}
          color="bg-red-500/5"
        />
        <StatCard
          title={language === 'ru' ? 'АВТОРИЗАЦИЙ СЕГОДНЯ' : 'AUTH TODAY'}
          value={data.totals.totalAuthToday}
          color="bg-green-500/5"
        />
        <StatCard
          title={language === 'ru' ? 'ВЕБ / ЛАУНЧЕР' : 'WEB / LAUNCHER'}
          value={`${webCount} / ${launcherCount}`}
          color="bg-blue-500/5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card/30 border border-primary/20 p-6 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary" />
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6">
            {language === 'ru' ? 'РЕГИСТРАЦИИ' : 'REGISTRATIONS'}
          </h3>
          {regChartData.length > 0 ? (
            <BarChart data={regChartData} maxVal={0} color="bg-primary" />
          ) : (
            <div className="h-32 flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-wider">
              {language === 'ru' ? 'НЕТ ДАННЫХ' : 'NO DATA'}
            </div>
          )}
        </div>

        <div className="bg-card/30 border border-primary/20 p-6 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary" />
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6">
            {language === 'ru' ? 'ИСТОЧНИКИ АВТОРИЗАЦИИ' : 'AUTH SOURCES'}
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs uppercase tracking-wider">
                <span className="text-purple-500">WEB</span>
                <span className="font-mono text-muted-foreground">{webCount} ({Math.round((webCount / totalAuth) * 100)}%)</span>
              </div>
              <div className="h-2 bg-background border border-primary/20">
                <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${(webCount / totalAuth) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs uppercase tracking-wider">
                <span className="text-blue-500">LAUNCHER</span>
                <span className="font-mono text-muted-foreground">{launcherCount} ({Math.round((launcherCount / totalAuth) * 100)}%)</span>
              </div>
              <div className="h-2 bg-background border border-primary/20">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(launcherCount / totalAuth) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card/30 border border-primary/20 p-6 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary" />
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-green-500 mb-6">
            {language === 'ru' ? 'УСПЕШНЫЕ АВТОРИЗАЦИИ' : 'SUCCESSFUL AUTH'}
          </h3>
          {authSuccessData.length > 0 ? (
            <BarChart data={authSuccessData} maxVal={authMaxVal} color="bg-green-500" />
          ) : (
            <div className="h-32 flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-wider">
              {language === 'ru' ? 'НЕТ ДАННЫХ' : 'NO DATA'}
            </div>
          )}
        </div>

        <div className="bg-card/30 border border-primary/20 p-6 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary" />
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-destructive mb-6">
            {language === 'ru' ? 'НЕУДАЧНЫЕ АВТОРИЗАЦИИ' : 'FAILED AUTH'}
          </h3>
          {authFailData.length > 0 ? (
            <BarChart data={authFailData} maxVal={authMaxVal} color="bg-destructive" />
          ) : (
            <div className="h-32 flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-wider">
              {language === 'ru' ? 'НЕТ ДАННЫХ' : 'NO DATA'}
            </div>
          )}
        </div>
      </div>

      {data.serverMetrics.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card/30 border border-primary/20 p-6 relative">
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6">TPS (24H)</h3>
            <BarChart data={tpsData} maxVal={20} color="bg-primary" />
          </div>
          <div className="bg-card/30 border border-primary/20 p-6 relative">
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6">
              {language === 'ru' ? 'ОНЛАЙН (24Ч)' : 'ONLINE (24H)'}
            </h3>
            <BarChart data={onlineData} maxVal={0} color="bg-blue-500" />
          </div>
        </div>
      )}

      {data.failedLogins.length > 0 && (
        <div className="bg-card/30 border border-primary/20 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-destructive" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-destructive" />
          <div className="p-4 border-b border-primary/20 bg-destructive/5">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-destructive">
              {language === 'ru' ? 'ТОП НЕУДАЧНЫХ АВТОРИЗАЦИЙ' : 'TOP FAILED LOGINS'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">#</th>
                  <th className="px-6 py-3 text-left font-medium">{language === 'ru' ? 'ПОЛЬЗОВАТЕЛЬ' : 'USERNAME'}</th>
                  <th className="px-6 py-3 text-left font-medium">{language === 'ru' ? 'ПОПЫТОК' : 'ATTEMPTS'}</th>
                  <th className="px-6 py-3 text-left font-medium">{language === 'ru' ? 'УРОВЕНЬ УГРОЗЫ' : 'THREAT LEVEL'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 text-xs">
                {data.failedLogins.map((entry, i) => (
                  <tr key={entry.username} className="hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-3 font-mono text-muted-foreground">{i + 1}</td>
                    <td className="px-6 py-3 font-medium">{entry.username}</td>
                    <td className="px-6 py-3 font-mono text-destructive">{entry.count}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 max-w-[100px] bg-background border border-primary/20">
                          <div
                            className={`h-full transition-all duration-500 ${entry.count > 20 ? 'bg-destructive' : entry.count > 5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min((entry.count / 30) * 100, 100)}%` }}
                          />
                        </div>
                        <span className={`text-[9px] uppercase tracking-wider ${entry.count > 20 ? 'text-destructive' : entry.count > 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                          {entry.count > 20 ? (language === 'ru' ? 'ВЫСОКИЙ' : 'HIGH') : entry.count > 5 ? (language === 'ru' ? 'СРЕДНИЙ' : 'MEDIUM') : (language === 'ru' ? 'НИЗКИЙ' : 'LOW')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground/40 uppercase tracking-widest text-right px-2 font-mono">
        SECURE CONNECTION // ANALYTICS READ ACCESS
      </div>
    </div>
  );
}
