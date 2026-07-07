import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/config/api';
import { useLang } from '@/i18n/LanguageContext';
import { SpinnerIcon, KeyIcon, ShieldIcon } from '@/components/Icons';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, dir } = useLang();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error(t('auth.passwordsDoNotMatch')); return; }
    if (newPassword.length < 6) { toast.error(t('auth.min6Chars')); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      toast.success(t('auth.passwordResetSuccess'));
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('auth.passwordResetFailed'));
    } finally {
      setLoading(false);
    }
  };

  const inputClassIcon = `neu-input w-full py-2.5 text-sm ${dir === 'rtl' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`;

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8" dir={dir} style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'rgba(34,197,94,0.06)', filter: 'blur(100px)' }} />

      <div className="w-full max-w-sm relative z-10 page-enter">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(34,197,94,0.12)', boxShadow: '0 8px 24px rgba(34,197,94,0.15)' }}>
            <ShieldIcon size={28} className="text-[#22c55e]" />
          </div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('app.name')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('auth.resetPassword')}</p>
        </div>

        <div className="neu-raised p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('auth.resetCode')}</label>
              <input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="XXXXXX"
                className="neu-input w-full py-2.5 text-sm font-mono text-center tracking-[0.15em]" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('auth.newPassword')}</label>
              <div className="relative">
                <span className={`absolute top-1/2 -translate-y-1/2 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} style={{ color: 'var(--text-muted)' }}><KeyIcon size={16} /></span>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('auth.min6Chars')} className={inputClassIcon} required minLength={6} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('auth.confirmPassword')}</label>
              <div className="relative">
                <span className={`absolute top-1/2 -translate-y-1/2 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} style={{ color: 'var(--text-muted)' }}><ShieldIcon size={16} /></span>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClassIcon} required minLength={6} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="neu-btn-primary w-full py-2.5 text-sm disabled:opacity-50">
              {loading ? <span className="flex items-center justify-center gap-2"><SpinnerIcon size={16} />...</span> : t('auth.resetPassword')}
            </button>
          </form>

          <p className="text-center mt-4">
            <Link to="/login" className="text-xs transition" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#3b82f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              ← {t('auth.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
