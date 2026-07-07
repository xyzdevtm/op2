import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/i18n/LanguageContext';
import { useTheme } from '@/i18n/ThemeContext';
import LanguageSwitcher from '@/i18n/LanguageSwitcher';
import TransitionOverlay from '@/components/TransitionOverlay';
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
  LogoutIcon,
  MenuIcon,
  ArrowLeftIcon,
  SunIcon,
  MoonIcon,
} from '@/components/Icons';

const navItems = [
  { path: '/', key: 'dashboard', Icon: HomeIcon },
  { path: '/wallet', key: 'wallet', Icon: WalletIcon },
  { path: '/shop', key: 'shop', Icon: ShoppingBagIcon },
  { path: '/leaderboard', key: 'leaderboard', Icon: TrophyIcon },
  { path: '/seasons', key: 'seasons', Icon: CalendarIcon },
  { path: '/clans', key: 'clans', Icon: SwordsIcon },
  { path: '/tickets', key: 'tickets', Icon: TicketIcon },
  { path: '/game-stats', key: 'gameStats', Icon: ChartIcon },
  { path: '/profile', key: 'profile', Icon: UserIcon },
] as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<'game' | 'panel'>('game');
  const { user, logout } = useAuth();
  const { t, dir } = useLang();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleBackToGame = useCallback(() => {
    setTransitionTarget('game');
    setTransitioning(true);
  }, []);

  const handleTransitionComplete = useCallback(() => {
    const gameUrl = import.meta.env.VITE_GAME_URL || window.location.origin;
    const separator = gameUrl.includes('?') ? '&' : '?';
    window.location.href = `${gameUrl}${separator}panel_logged_in=1`;
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isRTL = dir === 'rtl';

  return (
    <div className={`min-h-screen flex ${isRTL ? 'flex-row-reverse' : ''}`} dir={dir} style={{ background: 'var(--bg-primary)' }}>
      <TransitionOverlay
        show={transitioning}
        target={transitionTarget}
        onComplete={handleTransitionComplete}
      />
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={`
          hidden lg:flex flex-col w-60 shrink-0 sticky top-0 h-screen neu-sidebar
        `}
      >
        {/* Brand */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 0 12px rgba(59,130,246,0.25)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('app.name')}</h1>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t('app.userPanel')}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, key, Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150
                  ${isActive
                    ? 'neu-nav-active font-medium'
                    : 'hover:opacity-80'
                  }
                `}
                style={{
                  color: isActive ? '#3b82f6' : 'var(--text-muted)',
                  background: isActive ? undefined : 'transparent',
                }}
              >
                <Icon size={18} />
                <span>{t(`nav.${key}`)}</span>
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: '#3b82f6',
                      marginInlineStart: 'auto',
                      boxShadow: '0 0 6px rgba(59,130,246,0.5)',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 space-y-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', boxShadow: 'var(--shadow-neu-sm)' }}
            >
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.username || 'Guest'}</p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.rank?.current?.toUpperCase() || 'UNRANKED'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150 hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <LogoutIcon size={18} />
            <span className="font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between"
          style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(16px)',
            minHeight: '56px',
            padding: '8px 16px',
          }}
        >
          {/* Left side - Navigation */}
          <div className="flex items-center gap-2">
            {/* Mobile menu */}
            <button
              className="lg:hidden neu-btn rounded-xl"
              style={{ width: 36, height: 36 }}
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon size={18} />
            </button>

            {/* Back to game */}
            <button
              onClick={handleBackToGame}
              className="hidden sm:flex items-center gap-2 px-3 rounded-xl text-sm neu-btn ripple"
              style={{ height: 36 }}
            >
              <ArrowLeftIcon size={15} />
              <span>{t('nav.backToGame')}</span>
            </button>
          </div>

          {/* Right side - Actions + User */}
          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="neu-btn rounded-xl flex items-center justify-center"
              style={{ width: 36, height: 36, color: 'var(--text-secondary)' }}
              aria-label="Toggle theme"
            >
              {isDark ? <SunIcon size={17} /> : <MoonIcon size={17} />}
            </button>

            {/* Language */}
            <LanguageSwitcher />

            {/* User info */}
            <div
              className="hidden md:flex items-center gap-2.5 ps-2 pe-1"
              style={{ borderInlineStart: '1px solid var(--border-subtle)', height: 36 }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
              >
                {user?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.username}</span>
            </div>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-2 py-2 flex items-center justify-around hide-scrollbar safe-bottom"
          style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)' }}
        >
          {navItems.slice(0, 5).map(({ path, key, Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all
                  ${isActive ? 'neu-nav-active' : ''}
                `}
                style={{ color: isActive ? '#3b82f6' : 'var(--text-muted)', minWidth: 52 }}
              >
                <Icon size={20} />
                <span className="text-[9px] font-medium">{t(`nav.${key}`)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Content - centered with max-width */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-y-auto page-enter w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile sidebar */}
      <aside
        className={`
          fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-50
          w-60 neu-sidebar flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:hidden
          will-change-transform
          ${sidebarOpen
            ? 'translate-x-0'
            : isRTL
              ? 'translate-x-full'
              : '-translate-x-full'
          }
        `}
      >
        {/* Brand */}
        <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('app.name')}</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg neu-btn" aria-label="Close sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, key, Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150
                  ${isActive ? 'neu-nav-active font-medium' : ''}
                `}
                style={{ color: isActive ? '#3b82f6' : 'var(--text-muted)' }}
              >
                <Icon size={18} />
                <span>{t(`nav.${key}`)}</span>
              </Link>
            );
          })}
          {/* Back to game in mobile sidebar */}
          <button
            onClick={handleBackToGame}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeftIcon size={18} />
            <span>{t('nav.backToGame')}</span>
          </button>
        </nav>

        {/* User section */}
        <div className="px-3 py-4 space-y-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
            >
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.username || 'Guest'}</p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.rank?.current?.toUpperCase() || 'UNRANKED'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
            style={{ color: '#ef4444' }}
          >
            <LogoutIcon size={18} />
            <span className="font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
