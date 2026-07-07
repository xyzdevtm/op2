import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/shop', label: 'Shop', icon: '🛒' },
  { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { path: '/clans', label: 'Clans', icon: '⚔️' },
  { path: '/tickets', label: 'Support', icon: '🎫' },
];

function getGameUrl(): string {
  if (window.location.port === '4001') return 'http://localhost:9000';
  return window.location.origin;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">OF</span>
            </div>
            <span className="text-white font-bold text-xl">OpenFront</span>
          </Link>

          <div className="flex items-center gap-4">
            <a
              href={getGameUrl()}
              className="text-white/60 hover:text-blue-400 text-sm transition-colors flex items-center gap-1"
            >
              ← Back to Game
            </a>
            <span className="text-white/60 text-sm">
              Welcome, <span className="text-white font-medium">{user?.username}</span>
            </span>
            <span className="text-yellow-400 text-sm font-medium">
              💰 {user?.wallet?.balance?.toLocaleString() || 0}
            </span>
            <button
              onClick={() => logout()}
              className="text-white/40 hover:text-red-400 text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <nav className="w-48 flex-shrink-0">
          <div className="card p-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
