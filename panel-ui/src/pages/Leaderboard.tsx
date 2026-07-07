import { useEffect, useState } from 'react';
import api from '@/config/api';
import { useLang } from '@/i18n/LanguageContext';
import { TrophyIcon, SpinnerIcon } from '@/components/Icons';

export default function Leaderboard() {
  const { t } = useLang();
  const [tab, setTab] = useState<'players' | 'clans'>('players');
  const [players, setPlayers] = useState<any[]>([]);
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = tab === 'players' ? '/leaderboard/players' : '/leaderboard/clans';
    api.get(url).then((res) => {
      if (tab === 'players') setPlayers(res.data?.players || []);
      else setClans(res.data?.clans || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [tab]);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', icon: '👑' };
    if (rank === 2) return { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', icon: '🥈' };
    if (rank === 3) return { color: '#d97706', bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.2)', icon: '🥉' };
    return { color: 'var(--text-muted)', bg: 'transparent', border: 'transparent', icon: String(rank) };
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{t('nav.leaderboard')}</h1>

      {/* Tabs */}
      <div className="neu-pressed inline-flex p-1 rounded-xl gap-1">
        <button onClick={() => setTab('players')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'players' ? 'text-white' : ''}`}
          style={tab === 'players' ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' } : { color: 'var(--text-muted)' }}>
          {t('lb.players')}
        </button>
        <button onClick={() => setTab('clans')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'clans' ? 'text-white' : ''}`}
          style={tab === 'clans' ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' } : { color: 'var(--text-muted)' }}>
          {t('lb.clans')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <SpinnerIcon size={24} className="text-[#3b82f6]" />
        </div>
      ) : (
        <div className="neu-flat overflow-hidden">
          {(tab === 'players' ? players : clans).length === 0 ? (
            <div className="p-10 text-center">
              <TrophyIcon size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('lb.apiNote')}</p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="px-4 py-2 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="w-8 text-center">#</span>
                <span className="flex-1">{tab === 'players' ? t('lb.name') : t('lb.name')}</span>
                {tab === 'players' && <span className="w-14 text-end">{t('lb.elo')}</span>}
                {tab === 'players' && <span className="w-16 text-end">{t('lb.wl')}</span>}
                {tab === 'clans' && <span className="w-10 text-center">{t('clans.members')}</span>}
                {tab === 'clans' && <span className="w-14 text-end">{t('lb.wl')}</span>}
              </div>

              {/* Rows */}
              {(tab === 'players' ? players : clans).map((entry: any, i: number) => {
                const rank = entry.rank || i + 1;
                const rs = getRankStyle(rank);
                const isTop3 = rank <= 3;

                return (
                  <div key={i}
                    className="px-4 py-3 flex items-center gap-3 transition table-row-hover"
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isTop3 ? rs.bg : 'transparent',
                    }}>
                    {/* Rank */}
                    <div className="w-8 text-center">
                      <span className="text-lg">{rs.icon}</span>
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
                      style={{ background: `${rs.color}15`, border: `1px solid ${rs.color}25`, color: rs.color }}>
                      {(entry.username || entry.name || entry.tag || '?')[0].toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {entry.username || entry.name || entry.tag}
                      </p>
                      {entry.clanTag && (
                        <span className="text-[10px] font-semibold px-1 py-0.5 rounded"
                          style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                          [{entry.clanTag}]
                        </span>
                      )}
                    </div>

                    {/* ELO (players only) */}
                    {tab === 'players' && (
                      <span className="text-sm w-14 text-end font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {entry.elo || 0}
                      </span>
                    )}

                    {/* W/L */}
                    <span className="text-xs w-16 text-end">
                      <span style={{ color: '#22c55e' }}>{entry.wins || 0}</span>
                      <span style={{ color: 'var(--text-muted)' }}> / </span>
                      <span style={{ color: '#ef4444' }}>{entry.losses || 0}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
