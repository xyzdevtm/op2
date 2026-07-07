import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/config/api';
import { useLang } from '@/i18n/LanguageContext';
import { SpinnerIcon } from '@/components/Icons';

function maskValue(v: string): string {
  if (!v) return '—';
  if (v.length <= 4) return '•'.repeat(v.length);
  return v.slice(0, 2) + '•'.repeat(Math.max(0, v.length - 4)) + v.slice(-2);
}

export default function Profile() {
  const { user, login } = useAuth();
  const { t, dir } = useLang();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [privateMode, setPrivateMode] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('pm_popup_shown')) {
      setShowPopup(true);
      sessionStorage.setItem('pm_popup_shown', '1');
    }
  }, []);

  const phone = user?.phoneNumber || (user as any)?.phone || '';

  const togglePrivate = () => {
    if (privateMode) setShowConfirm(true);
    else { setPrivateMode(true); toast.success(t('profile.privateModeOn')); }
  };

  const confirmOff = () => {
    setPrivateMode(false);
    setShowConfirm(false);
    toast.success(t('profile.privateModeOff'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {};
      if (displayName !== undefined) payload.displayName = displayName;
      if (email) payload.email = email;
      if (password) payload.password = password;
      const res = await api.patch('/users/profile', payload);
      login({}, res.data);
      setPassword('');
      toast.success(t('profile.updated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('profile.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const PM = privateMode;

  return (
    <div className="space-y-4 pb-6" dir={dir}>
      {/* Popups */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="neu-raised p-5 max-w-xs w-full text-center" style={{ animation: 'pageEnter 0.3s ease-out' }}>
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{t('profile.privateMode')}</h3>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{t('profile.privateModeFirstTime')}</p>
            <button onClick={() => setShowPopup(false)} className="neu-btn-primary w-full py-2 text-xs font-medium">
              {t('profile.gotIt')}
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="neu-raised p-5 max-w-xs w-full text-center" style={{ animation: 'pageEnter 0.3s ease-out' }}>
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 8px 24px rgba(245,158,11,0.3)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{t('profile.privateModeTurnOff')}</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{t('profile.privateModeTurnOffDesc')}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="neu-btn flex-1 py-2 text-xs">{t('common.cancel')}</button>
              <button onClick={confirmOff} className="flex-1 py-2 text-xs font-medium rounded-xl text-white" style={{ background: '#ef4444' }}>
                {t('profile.privateModeOff')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="neu-raised p-4" style={{ animation: 'pageEnter 0.3s ease-out' }}>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 4px 16px rgba(59,130,246,0.3)' }}>
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user?.username}</h2>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {PM ? maskValue(phone) : phone}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                {user?.rank?.current?.toUpperCase() || 'UNRANKED'}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{user?.rank?.elo || 0} ELO</span>
            </div>
          </div>
          <button onClick={togglePrivate}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
            style={{
              background: PM ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.1)',
              color: PM ? '#22c55e' : '#6b7280',
              border: `1px solid ${PM ? 'rgba(34,197,94,0.25)' : 'rgba(107,114,128,0.2)'}`,
            }}>
            {PM ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
            {PM ? t('profile.privateModeOn') : t('profile.privateModeOff')}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="neu-raised p-4" style={{ animation: 'pageEnter 0.35s ease-out' }}>
        <form onSubmit={handleSave} className="space-y-3">
          {/* Username */}
          <div>
            <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{t('auth.username')}</label>
            <div className="relative">
              <input type="text" value={user?.username || ''} disabled readOnly
                className="neu-input w-full px-3 py-2 text-xs opacity-50 cursor-not-allowed pr-10" />
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <p className="text-[9px] mt-0.5 flex items-center gap-0.5" style={{ color: '#f59e0b' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {t('profile.usernameChangeSoon')}
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{t('profile.displayName')}</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="neu-input w-full px-3 py-2 text-xs" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{t('profile.email')}</label>
            <input
              type={PM ? 'password' : 'email'}
              value={PM ? '••••••••' : email}
              onChange={(e) => !PM && setEmail(e.target.value)}
              disabled={PM} readOnly={PM}
              placeholder={PM ? '' : 'you@example.com'}
              className={`neu-input w-full px-3 py-2 text-xs ${PM ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{t('profile.phone')}</label>
            <input type="text" value={PM ? '••••••••' : phone} disabled readOnly
              className="neu-input w-full px-3 py-2 text-xs opacity-50 cursor-not-allowed" />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{t('profile.password')}</label>
            <input
              type="password"
              value={PM ? '••••••••' : password}
              onChange={(e) => !PM && setPassword(e.target.value)}
              disabled={PM} readOnly={PM}
              placeholder={PM ? '' : '••••••••'}
              className={`neu-input w-full px-3 py-2 text-xs ${PM ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          <button type="submit" disabled={saving || PM}
            className="neu-btn-primary w-full py-2.5 text-xs font-medium disabled:opacity-50">
            {saving ? <span className="flex items-center justify-center gap-1.5"><SpinnerIcon size={14} /><span>{t('profile.saving')}</span></span> : t('profile.saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
}
