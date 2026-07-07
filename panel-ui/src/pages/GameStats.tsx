import { useEffect, useState } from 'react';
import api from '@/config/api';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/i18n/LanguageContext';
import StatCard from '@/components/StatCard';
import {
  GamepadIcon,
  TrophyIcon,
  ChartIcon,
  SpinnerIcon,
  AwardIcon,
  SkullIcon,
  ClockIcon,
} from '@/components/Icons';

interface MatchRecord {
  gameId: string;
  isWin: boolean;
  gameMode: string;
  mapName: string;
  stats: {
    kills: number;
    deaths: number;
    finalTiles: number;
    attacks: number;
    gold: number;
  };
  duration: number;
  playedAt: string;
}

interface StatsOverview {
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    totalKills: number;
    totalDeaths: number;
    kdRatio: number;
    lastPlayedAt: string;
  };
}

export default function GameStats() {
  const { user } = useAuth();
  const { t } = useLang();
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        const [overviewRes, historyRes] = await Promise.all([
          api.get('/stats/overview'),
          api.get('/stats/history'),
        ]);
        if (mounted) {
          // Handle both response formats
          const overview = overviewRes.data;
          if (overview.stats) {
            setStats({
              stats: {
                totalMatches: overview.stats.totalMatches || 0,
                wins: overview.stats.wins || 0,
                losses: overview.stats.losses || 0,
                totalKills: overview.stats.totalKills || 0,
                totalDeaths: overview.stats.totalDeaths || 0,
                kdRatio: overview.stats.kdRatio || 0,
                lastPlayedAt: overview.stats.lastPlayedAt || '',
              },
            });
          }
          // Handle match history format
          const historyData = historyRes.data;
          if (Array.isArray(historyData)) {
            setHistory(historyData);
          } else if (historyData?.matches) {
            setHistory(historyData.matches.map((m: any) => {
              const myPlayer = m.players?.find((p: any) => p.persistentId === user?.persistentId);
              return {
                gameId: m.gameId,
                isWin: myPlayer?.result === 'win' && myPlayer?.hasSpawned !== false,
                gameMode: m.gameMode || 'FFA',
                mapName: m.mapName || 'Unknown',
                stats: { kills: myPlayer?.kills || 0, deaths: myPlayer?.deaths || 0, finalTiles: myPlayer?.score || 0, attacks: 0, gold: 0 },
                duration: m.duration || 0,
                playedAt: m.endedAt || '',
              };
            }));
          }
        }
      } catch (err) {
        if (mounted) setError('Failed to load stats');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerIcon size={24} className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="neu-flat p-5 text-center">
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }

  const s = stats?.stats;
  const winRate = s?.totalMatches ? ((s.wins / s.totalMatches) * 100).toFixed(1) : '0';
  const kda = s?.totalDeaths ? (s.totalKills / s.totalDeaths).toFixed(2) : '0';

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        {t('nav.gameStats')}
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<GamepadIcon size={18} />}
          label={t('gs.totalGames')}
          value={s?.totalMatches || 0}
          accent="#3b82f6"
        />
        <StatCard
          icon={<TrophyIcon size={18} />}
          label={t('gs.wins')}
          value={s?.wins || 0}
          accent="#22c55e"
        />
        <StatCard
          icon={<ChartIcon size={18} />}
          label={t('gs.losses')}
          value={s?.losses || 0}
          accent="#ef4444"
        />
        <StatCard
          icon={<AwardIcon size={18} />}
          label={t('gs.winRate')}
          value={`${winRate}%`}
          accent="#f59e0b"
        />
        <StatCard
          icon={<SkullIcon size={18} />}
          label={t('gs.kills')}
          value={s?.totalKills || 0}
          accent="#ef4444"
        />
        <StatCard
          icon={<SkullIcon size={18} />}
          label={t('gs.deaths')}
          value={s?.totalDeaths || 0}
          accent="#6b7280"
        />
        <StatCard
          icon={<SpinnerIcon size={18} />}
          label={t('gs.kda')}
          value={kda}
          accent="#8b5cf6"
        />
        <StatCard
          icon={<ClockIcon size={18} />}
          label={t('gs.lastSync')}
          value={s?.lastPlayedAt ? new Date(s.lastPlayedAt).toLocaleDateString() : '—'}
          accent="#64748b"
        />
      </div>

      {/* Match history */}
      <div className="neu-flat p-5">
        <h2
          className="text-sm font-medium uppercase tracking-wide mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('gs.recentMatches')}
        </h2>

        {history.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('gs.noMatches')}
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((match) => (
              <div
                key={match.gameId}
                className="flex items-center gap-3 p-3 rounded-xl transition table-row-hover"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: match.isWin
                      ? 'rgba(34,197,94,0.12)'
                      : 'rgba(239,68,68,0.12)',
                    color: match.isWin ? '#22c55e' : '#ef4444',
                    boxShadow: 'var(--shadow-neu-sm)',
                  }}
                >
                  {match.isWin ? (
                    <TrophyIcon size={16} />
                  ) : (
                    <SkullIcon size={16} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {match.gameMode} — {match.mapName}
                  </p>
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span>
                      {match.stats.kills}K / {match.stats.deaths}D
                    </span>
                    <span>•</span>
                    <span>{match.stats.finalTiles} tiles</span>
                    <span>•</span>
                    <span>
                      {Math.floor(match.duration / 1000 / 60)}:
                      {String(Math.floor((match.duration / 1000) % 60)).padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(match.playedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
