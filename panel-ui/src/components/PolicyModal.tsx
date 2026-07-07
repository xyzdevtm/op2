import { Link } from 'react-router-dom';
import { useLang } from '@/i18n/LanguageContext';
import { XIcon, ShieldIcon } from '@/components/Icons';

interface PolicyModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PolicyModal({ open, onClose }: PolicyModalProps) {
  const { t, dir } = useLang();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={dir}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-md neu-raised rounded-2xl overflow-hidden page-enter"
        style={{ background: 'var(--bg-surface)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <ShieldIcon size={18} style={{ color: '#3b82f6' }} />
            </div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('policy.title')}
            </h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10">
            <XIcon size={16} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-2"
                style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('policy.section2Title')}</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-2"
                style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <p className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('policy.section3Title')}</p>
            </div>
          </div>

          {/* Key points */}
          <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#3b82f6' }} />
              <p>{t('policy.section2Item1')}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#ef4444' }} />
              <p>{t('policy.section2Item2')}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#f59e0b' }} />
              <p>{t('policy.section3Item2')}</p>
            </div>
          </div>

          {/* View full policy link */}
          <Link
            to="/policy"
            onClick={onClose}
            className="block w-full text-center py-2.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: '#3b82f6' }}>
            {t('policy.viewFull')} →
          </Link>

          {/* Footer */}
          <p className="text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {t('policy.by ContinuingYouAgree')}{' '}
            <Link to="/policy" onClick={onClose} className="font-medium" style={{ color: '#3b82f6' }}>
              {t('policy.title')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
