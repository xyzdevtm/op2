import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMatches(); }, []);

  async function loadMatches() {
    try {
      const res = await api.get('/admin/matches');
      setMatches(res.data.matches || []);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Match History</h1>
      <div className="card">
        {loading ? <div className="text-white">Loading...</div> : matches.length === 0 ? (
          <div className="text-center py-8 text-white/50">No matches yet</div>
        ) : (
          <div className="space-y-2">
            {matches.map((m: any) => (
              <div key={m._id} className="p-4 bg-white/5 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{m.gameMode} - {m.mapName}</div>
                  <div className="text-white/40 text-sm">{m.players?.length || 0} players • {Math.round((m.duration || 0) / 60)} min</div>
                </div>
                <div className="text-white/60 text-sm">{new Date(m.endedAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
