import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_PANEL_WS_URL || `ws://${window.location.hostname}:4000`;

interface ClanMember {
  playerId: string;
  username: string;
  role: string;
  joinedAt?: string;
}

interface ClanUpdate {
  action: string;
  tag: string;
  member?: { username: string; role?: string };
  memberCount?: number;
  creator?: string;
}

interface ClanMemberListProps {
  clanTag: string;
  initialMembers: ClanMember[];
}

export default function ClanMemberList({ clanTag, initialMembers }: ClanMemberListProps) {
  const [members, setMembers] = useState<ClanMember[]>(initialMembers);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket: Socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_clan', { clanTag });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('clan_update', (data: ClanUpdate) => {
      if (data.tag !== clanTag) return;

      if (data.action === 'member_joined' && data.member) {
        setMembers((prev) => [
          ...prev,
          { playerId: '', username: data.member!.username, role: data.member!.role || 'member' },
        ]);
      } else if (data.action === 'member_left' && data.member) {
        setMembers((prev) => prev.filter((m) => m.username !== data.member!.username));
      } else if (data.action === 'clan_created') {
        // Refresh the full list
        window.location.reload();
      }
    });

    return () => {
      socket.emit('leave_clan', { clanTag });
      socket.disconnect();
    };
  }, [clanTag]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400">
          Members ({members.length})
        </h3>
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-500'}`} />
      </div>
      <div className="space-y-1">
        {members.map((member, i) => (
          <div
            key={`${member.playerId}-${i}`}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800/50"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{member.role === 'leader' ? '👑' : '👤'}</span>
              <span className="text-sm text-white">{member.username}</span>
            </div>
            <span className="text-xs text-gray-500 capitalize">{member.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
