import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/config/api';
import { useLang } from '@/i18n/LanguageContext';
import { TicketIcon, SpinnerIcon, CheckIcon, ClockIcon, XIcon } from '@/components/Icons';

const CATEGORIES = ['account', 'payment', 'gameplay', 'bug', 'clan', 'other'] as const;

export default function Tickets() {
  const { t } = useLang();
  const [tickets, setTickets] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const [message, setMessage] = useState('');

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    const res = await api.get('/tickets');
    setTickets(res.data.tickets || []);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tickets', { title, category, message });
      toast.success(t('tickets.created'));
      setShowCreate(false);
      setTitle('');
      setMessage('');
      loadTickets();
    } catch {
      toast.error(t('tickets.createFailed'));
    }
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    open: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e', label: t('tickets.status.open') },
    in_progress: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', label: t('tickets.status.in_progress') },
    waiting_user: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', label: t('tickets.status.waiting_user') },
    resolved: { bg: 'rgba(100,116,139,0.1)', text: '#64748b', label: t('tickets.status.resolved') },
    closed: { bg: 'rgba(71,85,105,0.1)', text: '#475569', label: t('tickets.status.closed') },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{t('nav.tickets')}</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="neu-btn-primary px-4 py-2 text-sm flex items-center gap-2">
          <span>+</span>
          <span>{t('tickets.newTicket')}</span>
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="neu-raised p-5 space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>{t('tickets.createNew')}</h2>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('tickets.title')}
            className="neu-input w-full px-4 py-2.5 text-sm" required />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="neu-input w-full px-4 py-2.5 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{t(`tickets.${c}`)}</option>)}
          </select>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('tickets.describeIssue')}
            className="neu-input w-full px-4 py-2.5 text-sm h-28 resize-none" required />
          <div className="flex gap-2">
            <button type="submit" className="neu-btn-primary px-5 py-2 text-sm">{t('tickets.submit')}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="neu-btn px-5 py-2 text-sm">{t('common.cancel')}</button>
          </div>
        </form>
      )}

      <div className="neu-flat overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-10 text-center">
            <TicketIcon size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('tickets.noTickets')}</p>
          </div>
        ) : (
          <div>
            {tickets.map((ticket: any) => {
              const status = statusConfig[ticket.status] || statusConfig.open;
              return (
                <div key={ticket._id} className="px-4 py-3 flex items-center justify-between transition table-row-hover"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', boxShadow: 'var(--shadow-neu-sm)' }}>
                      <TicketIcon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ticket.title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ticket.ticketNumber}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: status.bg, color: status.text }}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
