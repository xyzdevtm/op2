import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import MessageList from './MessageList';

const WS_URL = import.meta.env.VITE_PANEL_WS_URL || `ws://${window.location.hostname}:4000`;

interface NotificationCenterProps {
  userId: string | null;
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMessages, setShowMessages] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket: Socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('message', () => {
      setUnreadCount((prev) => prev + 1);
      setRefreshTrigger((prev) => prev + 1);
    });

    socket.on('notification', () => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const handleToggle = useCallback(() => {
    setShowMessages((prev) => !prev);
    if (!showMessages) {
      setUnreadCount(0);
    }
  }, [showMessages]);

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showMessages && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-3 max-h-96 overflow-y-auto">
            <MessageList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      )}
    </div>
  );
}
