import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    try {
      const res = await api.get('/admin/tickets');
      setTickets(res.data.tickets || []);
    } finally { setLoading(false); }
  }

  async function updateTicket(id: string, status: string, reply?: string) {
    await api.patch(`/admin/tickets/${id}`, { status, reply });
    loadTickets();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
      <div className="card">
        {loading ? <div className="text-white">Loading...</div> : tickets.length === 0 ? (
          <div className="text-center py-8 text-white/50">No tickets</div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t: any) => (
              <div key={t._id} className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">#{t.ticketNumber} - {t.title}</div>
                    <div className="text-white/40 text-sm">{t.category} • {t.status}</div>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => updateTicket(t._id, 'in_progress')} className="text-yellow-400 text-sm">In Progress</button>
                    <button onClick={() => updateTicket(t._id, 'resolved')} className="text-green-400 text-sm">Resolve</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
