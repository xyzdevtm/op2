import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?search=${search}`);
      setUsers(res.data.users || []);
    } finally { setLoading(false); }
  }

  async function adjustWallet(userId: string, amount: number) {
    const reason = prompt('Reason for adjustment:');
    if (!reason) return;
    await api.patch(`/admin/users/${userId}/wallet`, { amount, reason });
    loadUsers();
  }

  async function toggleBan(userId: string, currentBanned: boolean) {
    const reason = currentBanned ? undefined : prompt('Ban reason:');
    if (!currentBanned && !reason) return;
    await api.patch(`/admin/users/${userId}/ban`, { banned: !currentBanned, reason });
    loadUsers();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">User Management</h1>
      <div className="card">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadUsers()} className="input" placeholder="Search users..." />
      </div>
      <div className="card">
        {loading ? <div className="text-white">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="text-white/50 text-sm border-b border-white/10">
              <th className="text-left py-2">Username</th><th className="text-left py-2">Public ID</th><th className="text-left py-2">Wins</th><th className="text-left py-2">Balance</th><th className="text-left py-2">Actions</th>
            </tr></thead>
            <tbody>{users.map((u: any) => (
              <tr key={u._id} className="border-b border-white/5">
                <td className="py-3 text-white">{u.username}</td>
                <td className="py-3 text-white/60">{u.publicId}</td>
                <td className="py-3 text-white">{u.stats?.wins || 0}</td>
                <td className="py-3 text-yellow-400">{u.wallet?.balance || 0}</td>
                <td className="py-3 space-x-2">
                  <button onClick={() => adjustWallet(u._id, 100)} className="text-green-400 text-sm">+100</button>
                  <button onClick={() => adjustWallet(u._id, -100)} className="text-red-400 text-sm">-100</button>
                  <button onClick={() => toggleBan(u._id, u.isBanned)} className={`text-sm ${u.isBanned ? 'text-green-400' : 'text-red-400'}`}>{u.isBanned ? 'Unban' : 'Ban'}</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
