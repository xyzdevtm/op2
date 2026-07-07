import { useEffect, useState } from 'react';
import api from '@/config/api';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/i18n/LanguageContext';
import StatCard from '@/components/StatCard';
import QuickActionCard from '@/components/QuickActionCard';
import {
  HomeIcon,
  WalletIcon,
  ShoppingBagIcon,
  TrophyIcon,
  CalendarIcon,
  SwordsIcon,
  TicketIcon,
  ChartIcon,
  UserIcon,
  BellIcon,
  GamepadIcon,
  ClockIcon,
} from '@/components/Icons';

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('greeting.morning');
  if (hour < 17) return t('greeting.afternoon');
  if (hour < 21) return t('greeting.evening');
  return t('greeting.night');
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLang();
  const [wallet, setWallet] = useState<any>(null);
  const [notifications, setNotifications] = useState<any>(null);

  useEffect(() => {
    api.get('/wallet').then((res) => setWallet(res.data));
    api.get('/notifications/unread-count').then((res) => setNotifications(res.data));
  }, []);

  const rankAccent: Record<string, string> = {
    iron: '#8B7355',
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF',
    challenger: '#FF46D6',
  };

  const rank = user?.rank?.current ?? '';
  const accent = rankAccent[rank] || '#64748b';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {getGreeting(t)}، <span className="text-[#3b82f6]">{user?.username || t('user.guest')}</span>
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('dash.welcomeBack')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrophyIcon size={18} />}
          label={t('dash.rank')}
          value={rank?.toUpperCase() || 'UNRANKED'}
          subValue={`${user?.rank?.elo || 0} ELO`}
          accent={accent}
        />
        <StatCard
          icon={<WalletIcon size={18} />}
          label={t('dash.wallet')}
          value={wallet?.balance?.toLocaleString() || '0'}
          subValue={t('dash.coins')}
          accent="#22c55e"
        />
        <StatCard
          icon={<GamepadIcon size={18} />}
          label={t('dash.games')}
          value={user?.stats?.totalMatches || user?.stats?.totalGames || 0}
          subValue={`${user?.stats?.wins || user?.stats?.totalWins || 0}W / ${user?.stats?.losses || user?.stats?.totalLosses || 0}L`}
          accent="#3b82f6"
        />
        <StatCard
          icon={<BellIcon size={18} />}
          label={t('dash.notifications')}
          value={notifications?.count || 0}
          subValue={t('dash.unread')}
          accent="#f59e0b"
        />
      </div>

      {/* Recent Activity */}
      <div className="neu-flat p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{ color: 'var(--text-secondary)' }}>
          {t('dash.recentActivity')}
        </h2>
        <div className="space-y-2">
          {[
            { Icon: TrophyIcon, label: t('dash.activity.win'), time: `1 ${t('time.hoursAgo')}`, color: '#22c55e' },
            { Icon: WalletIcon, label: t('dash.activity.purchase'), time: `3 ${t('time.hoursAgo')}`, color: '#3b82f6' },
            { Icon: GamepadIcon, label: t('dash.activity.game'), time: `5 ${t('time.hoursAgo')}`, color: '#8b5cf6' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl transition table-row-hover"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${item.color}12`, color: item.color, boxShadow: 'var(--shadow-neu-sm)' }}
              >
                <item.Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <ClockIcon size={12} />
                  <span>{item.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
