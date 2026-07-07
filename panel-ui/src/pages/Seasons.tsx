import { useEffect, useState } from 'react';
import api from '@/config/api';
import { useLang } from '@/i18n/LanguageContext';
import { CalendarIcon, TrophyIcon, ClockIcon, SpinnerIcon } from '@/components/Icons';

export default function Seasons() {
  const { t, locale } = useLang();
  const [seasons, setSeasons] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);

  useEffect(() => {
    api.get('/seasons').then((res) => setSeasons(res.data || []));
    api.get('/seasons/current').then((res) => setCurrent(res.data));
  }, []);

  const dateLocale = locale === 'fa' ? 'fa-IR' : 'en-US';

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e', label: t('seasons.status.active') },
    ended: { bg: 'rgba(100,116,139,0.1)', text: '#64748b', label: t('seasons.status.ended') },
    upcoming: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', label: t('seasons.status.upcoming') },
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{t('nav.seasons')}</h1>

      {current && (
        <div className="neu-raised relative overflow-hidden p-5"
          style={{ borderTopColor: '#3b82f6', borderTopWidth: '2px' }}>
          {/* Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'rgba(59,130,246,0.08)', filter: 'blur(60px)' }} />
          <div className="relative z-10">
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#3b82f6' }}>
              {t('seasons.currentSeason')}
            </p>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{current.name}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {new Date(current.startDate).toLocaleDateString(dateLocale)}
              {current.endDate ? ` — ${new Date(current.endDate).toLocaleDateString(dateLocale)}` : ` — ${t('seasons.ongoing')}`}
            </p>
          </div>
        </div>
      )}

      <div className="neu-flat overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{t('seasons.allSeasons')}</h2>
        </div>
        {seasons.length === 0 ? (
          <div className="p-10 text-center">
            <CalendarIcon size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('seasons.noSeasons')}</p>
          </div>
        ) : (
          <div>
            {seasons.map((season: any) => {
              const status = statusConfig[season.status] || statusConfig.upcoming;
              return (
                <div key={season._id} className="px-4 py-3 flex items-center justify-between transition table-row-hover"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', boxShadow: 'var(--shadow-neu-sm)' }}>
                      <TrophyIcon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{season.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{season.type}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: status.bg, color: status.text }}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
