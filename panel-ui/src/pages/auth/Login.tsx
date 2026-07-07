import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/config/api';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/i18n/LanguageContext';
import { SpinnerIcon } from '@/components/Icons';
import PolicyModal from '@/components/PolicyModal';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t, dir } = useLang();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username: identifier.trim(), password });
      login(res.data, res.data.user);
      toast.success(t('auth.welcomeBack'));
      navigate('/');
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.response?.data?.message || '';

      let errorMsg = t('auth.loginFailed');

      if (status === 401) {
        if (msg.includes('Invalid') || msg.includes('incorrect') || msg.includes('wrong')) {
          errorMsg = t('auth.wrongCredentials');
        } else {
          errorMsg = t('auth.wrongCredentials');
        }
      } else if (status === 429) {
        errorMsg = t('auth.tooManyAttempts');
      } else if (status === 0 || !err.response) {
        errorMsg = t('auth.networkError');
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
      <div className="min-h-dvh flex items-center justify-center px-4 py-8" dir={dir} style={{ background: 'var(--bg-primary)' }}>
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'rgba(59,130,246,0.06)', filter: 'blur(100px)' }} />

        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-down">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 8px 32px rgba(59,130,246,0.35)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('app.name')}</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t('auth.loginToPanel')}</p>
          </div>

          {/* Card */}
          <div className="neu-raised p-6" style={{ animation: 'pageEnter 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm flex items-center gap-2 animate-fade-down"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Username */}
              <div className="input-icon-wrapper">
                <span className="input-icon input-icon-left">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                  placeholder={t('auth.loginPlaceholder')}
                  className="neu-input w-full py-3 text-sm"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div className="input-icon-wrapper">
                <span className="input-icon input-icon-left">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder={t('auth.password')}
                  className="neu-input w-full py-3 text-sm input-with-right-icon"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-icon input-icon-right"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="neu-btn-primary w-full py-3 text-sm font-medium disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <SpinnerIcon size={16} />
                    <span>{t('auth.loggingIn')}</span>
                  </span>
                ) : t('auth.login')}
              </button>
            </form>

            <div className="flex justify-center mt-4">
              <Link to="/forgot-password" className="text-xs transition" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#3b82f6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: '1px solid var(--border-subtle)' }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                  {t('auth.or')}
                </span>
              </div>
            </div>

            <Link to="/register" className="block w-full">
              <button type="button" className="neu-btn w-full py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {t('auth.createAccount')}
              </button>
            </Link>

            <p className="text-center text-[10px] mt-4" style={{ color: 'var(--text-muted)' }}>
              {t('policy.by ContinuingYouAgree')}{' '}
              <button type="button" onClick={() => setPolicyOpen(true)}
                className="font-medium hover:underline" style={{ color: '#3b82f6' }}>
                {t('policy.title')}
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-down {
          animation: fadeDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
