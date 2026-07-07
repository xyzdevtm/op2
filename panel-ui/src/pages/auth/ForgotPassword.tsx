import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/config/api';
import { useLang } from '@/i18n/LanguageContext';
import { SpinnerIcon, KeyIcon } from '@/components/Icons';

export default function ForgotPassword() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const { t, dir } = useLang();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { phoneNumber });
      toast.success(t('auth.resetCodeSent'));
      if (res.data.code) setCode(res.data.code);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8" dir={dir} style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'rgba(245,158,11,0.06)', filter: 'blur(100px)' }} />

      <div className="w-full max-w-sm relative z-10 page-enter">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(245,158,11,0.12)', boxShadow: '0 8px 24px rgba(245,158,11,0.15)' }}>
            <KeyIcon size={28} className="text-[#f59e0b]" />
          </div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('app.name')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('auth.forgotPassword')}</p>
        </div>

        <div className="neu-raised p-6">
          {code ? (
            <div className="space-y-4">
              <div className="neu-pressed p-4 text-center" style={{ background: 'rgba(34,197,94,0.06)' }}>
                <p className="text-xs mb-2" style={{ color: '#22c55e' }}>{t('auth.resetCodeSent')}</p>
                <p className="text-xl font-mono font-bold tracking-[0.2em]" style={{ color: 'var(--text-primary)' }}>{code}</p>
                <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>{t('auth.useCodeInReset')}</p>
              </div>
              <Link to={`/reset-password?token=${code}`} className="block w-full py-2.5 text-sm text-center neu-btn-primary">
                {t('auth.resetPassword')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('auth.phoneNumber')}</label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+989123456789" className="neu-input w-full py-2.5 text-sm" required />
              </div>
              <button type="submit" disabled={loading} className="neu-btn-primary w-full py-2.5 text-sm disabled:opacity-50">
                {loading ? <span className="flex items-center justify-center gap-2"><SpinnerIcon size={16} />...</span> : t('auth.sendResetCode')}
              </button>
            </form>
          )}

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
