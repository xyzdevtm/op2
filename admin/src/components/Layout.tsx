import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { path: '/admin/tickets', label: 'Tickets', icon: '🎫' },
  { path: '/admin/matches', label: 'Matches', icon: '🎮' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen admin-bg">
      <header className="border-b border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="text-white font-bold text-xl">Admin Panel</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm">{user?.username}</span>
            <button onClick={() => logout()} className="text-white/40 hover:text-red-400 text-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
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
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
