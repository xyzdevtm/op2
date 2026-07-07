import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function LeaderboardConfig() {
  const [config, setConfig] = useState({ isEnabled: true, minWinsRequired: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    try {
      const res = await api.get('/admin/leaderboard-config');
      setConfig(res.data.config || { isEnabled: true, minWinsRequired: 0 });
    } finally { setLoading(false); }
  }

  async function saveConfig() {
    await api.patch('/admin/leaderboard-config', config);
    alert('Saved!');
  }

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Leaderboard Configuration</h1>
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white">Enable Leaderboard</span>
          <button onClick={() => setConfig({ ...config, isEnabled: !config.isEnabled })} className={`w-12 h-6 rounded-full transition-colors ${config.isEnabled ? 'bg-green-500' : 'bg-white/20'}`}>
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${config.isEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <div>
          <label className="text-white/60 text-sm">Minimum Wins Required</label>
          <input type="number" value={config.minWinsRequired} onChange={e => setConfig({ ...config, minWinsRequired: parseInt(e.target.value) || 0 })} className="input mt-1" />
        </div>
        <button onClick={saveConfig} className="btn-primary">Save Configuration</button>
      </div>
    </div>
  );
}
