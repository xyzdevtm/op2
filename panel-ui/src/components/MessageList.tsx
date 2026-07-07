import React, { useState, useEffect } from 'react';
import MessageItem from './MessageItem';
import { fetchMessages, markAsRead, markAllAsRead } from '../../api/messages';

interface Message {
  _id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

interface MessageListProps {
  refreshTrigger?: number;
}

export default function MessageList({ refreshTrigger }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadMessages = async (p: number) => {
    setLoading(true);
    try {
      const data = await fetchMessages(p, 20);
      setMessages(data.messages);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(page);
  }, [page, refreshTrigger]);

  const handleRead = async (id: string) => {
    await markAsRead(id);
    setMessages((prev) =>
      prev.map((m) => (m._id === id ? { ...m, isRead: true } : m)),
    );
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
  };

  const handleDelete = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m._id !== id));
  };

  const totalPages = Math.ceil(total / 20);

  if (loading && messages.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">Loading messages...</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Messages</h3>
        <button
          onClick={handleMarkAllRead}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          Mark all as read
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No messages</div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <MessageItem
              key={msg._id}
              message={msg}
              onRead={handleRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm rounded bg-gray-700 text-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm rounded bg-gray-700 text-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
