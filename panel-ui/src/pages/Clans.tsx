import { useEffect, useState } from 'react';
import api from '@/config/api';
import { useLang } from '@/i18n/LanguageContext';
import { SwordsIcon, SpinnerIcon, TrophyIcon } from '@/components/Icons';

export default function Clans() {
  const { t } = useLang();
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clans').then((res) => setClans(res.data?.clans || res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><SpinnerIcon size={24} className="text-[#3b82f6]" /></div>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{t('nav.clans')}</h1>
      <div className="neu-flat overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{t('clans.clanLeaderboard')}</h2>
        </div>
        {clans.length === 0 ? (
          <div className="p-10 text-center">
            <SwordsIcon size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('clans.apiNote')}</p>
          </div>
        ) : (
          <div>
            {clans.map((clan: any, i: number) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between transition table-row-hover"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-6 text-center" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', boxShadow: 'var(--shadow-neu-sm)' }}>
                    {(clan.name || clan.tag || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{clan.name || clan.tag}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{clan.memberCount || 0} {t('clans.members')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: '#22c55e' }}>
                  <TrophyIcon size={14} />
                  {clan.wins || 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
