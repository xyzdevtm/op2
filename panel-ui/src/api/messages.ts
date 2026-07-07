import api from '../config/api';

interface Message {
  _id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

interface MessagesResponse {
  messages: Message[];
  total: number;
}

export async function fetchMessages(
  page = 1,
  limit = 20,
): Promise<MessagesResponse> {
  const res = await api.get(`/messages?page=${page}&limit=${limit}`);
  return res.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await api.get('/messages/unread-count');
  return res.data.count ?? 0;
}

export async function sendMessage(
  receiverId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<Message> {
  const res = await api.post('/messages', { receiverId, type, title, body, data });
  return res.data;
}

export async function markAsRead(messageId: string): Promise<void> {
  await api.patch(`/messages/${messageId}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.patch('/messages/read-all');
}

export async function deleteMessage(messageId: string): Promise<void> {
  await api.delete(`/messages/${messageId}`);
}
