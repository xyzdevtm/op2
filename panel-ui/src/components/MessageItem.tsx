import React from 'react';

interface Message {
  _id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

interface MessageItemProps {
  message: Message;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  system: '🔔',
  friend_request: '👤',
  clan_invite: '⚔️',
  team_invite: '🎮',
  trade_offer: '💰',
};

export default function MessageItem({ message, onRead, onDelete }: MessageItemProps) {
  const icon = TYPE_ICONS[message.type] || '📩';
  const date = new Date(message.createdAt).toLocaleDateString('fa-IR');

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        message.isRead
          ? 'border-gray-700 bg-gray-800/30'
          : 'border-blue-500/30 bg-blue-500/5'
      }`}
      onClick={() => !message.isRead && onRead(message._id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <h4 className={`text-sm font-medium ${message.isRead ? 'text-gray-300' : 'text-white'}`}>
              {message.title}
            </h4>
            <p className="text-xs text-gray-400 mt-1">{message.body}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!message.isRead && (
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          )}
          <span className="text-xs text-gray-500">{date}</span>
        </div>
      </div>
    </div>
  );
}
