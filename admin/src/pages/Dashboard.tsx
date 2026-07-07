import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState({ userCount: 0, matchCount: 0, ticketCount: 0 });

  useEffect(() => {
    api.get('/admin/dashboard').then(res => setStats(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="card"><div className="text-white/50 text-sm">Users</div><div className="text-3xl font-bold text-white">{stats.userCount}</div></div>
        <div className="card"><div className="text-white/50 text-sm">Matches</div><div className="text-3xl font-bold text-white">{stats.matchCount}</div></div>
        <div className="card"><div className="text-white/50 text-sm">Open Tickets</div><div className="text-3xl font-bold text-white">{stats.ticketCount}</div></div>
      </div>
    </div>
  );
}
