import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/config/api';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/i18n/LanguageContext';
import { SpinnerIcon } from '@/components/Icons';
import PolicyModal from '@/components/PolicyModal';

type Step = 1 | 2 | 3 | 4;

export default function Register() {
  const [step, setStep] = useState<Step>(1);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);
  const [invalidChars, setInvalidChars] = useState<string[]>([]);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t, dir } = useLang();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Check username availability (debounced)
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await api.post('/auth/check-username', { username });
        setUsernameAvailable(res.data.available);
      } catch (err: any) {
        setUsernameAvailable(null);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [username]);

  // Check phone availability (debounced)
  useEffect(() => {
    if (!isValidPhone(phone)) {
      setPhoneAvailable(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await api.post('/auth/check-phone', { phone });
        setPhoneAvailable(res.data.available);
      } catch (err: any) {
        setPhoneAvailable(null);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [phone]);

  // Detect invalid characters in username while typing
  useEffect(() => {
    if (!username || username.length < 3) {
      setInvalidChars([]);
      return;
    }
    const chars: string[] = [];
    for (const char of username) {
      if (!/[a-z0-9_]/.test(char) && !chars.includes(char)) {
        chars.push(char);
      }
    }
    setInvalidChars(chars);
  }, [username]);

  // Validate Iranian phone number
  const isValidPhone = (p: string) => /^09\d{9}$/.test(p);

  // Step 1: Username
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (username.trim().length < 3) {
      setError(t('auth.usernameMin3'));
      return;
    }
    if (username.trim().length > 10) {
      setError(t('auth.usernameMax10'));
      return;
    }
    // Only lowercase English letters, numbers, and underscore
    if (!/^[a-z0-9_]+$/.test(username.trim())) {
      const invalidChars: string[] = [];
      for (const char of username.trim()) {
        if (!/[a-z0-9_]/.test(char) && !invalidChars.includes(char)) {
          invalidChars.push(char);
        }
      }
      if (invalidChars.length > 0) {
        setError(t('auth.usernameInvalidChars').replace('{chars}', invalidChars.join('، ')));
      } else {
        setError(t('auth.usernameLowercase'));
      }
      return;
    }
    if (username.trim().length > 10) {
      setError(t('auth.usernameMax10'));
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError(t('auth.usernameInvalid'));
      return;
    }

    setStep(2);
  };

  // Step 2: Phone + Email → Send code
  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone) {
      setError(t('auth.phoneRequired'));
      return;
    }
    if (!isValidPhone(phone)) {
      setError(t('auth.phoneInvalid'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/send-code', { phone });
      setCodeSent(true);
      setStep(3);
      setCountdown(60); // 60 seconds cooldown
      toast.success(t('auth.codeSent'));
    } catch (err: any) {
      const msg = err.response?.data?.error || '';
      if (err.response?.status === 409) {
        setError(t('auth.phoneAlreadyRegistered'));
      } else if (err.response?.status === 429) {
        setError(msg || t('auth.tooManyAttempts'));
      } else {
        setError(msg || t('auth.sendCodeFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify code
  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verificationCode || verificationCode.length !== 5) {
      setError(t('auth.enterValidCode'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-code', { phone, code: verificationCode });
      setStep(4);
      toast.success(t('auth.phoneVerified'));
    } catch (err: any) {
      setError(err.response?.data?.error || t('auth.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Set password & complete
  const handleStep4 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.min6Chars'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    try {
      const payload: any = { username: username.trim(), password, phone };
      if (email.trim()) {
        payload.email = email.trim();
      }
      const res = await api.post('/auth/register', payload);
      login(res.data, res.data.user);
      toast.success(t('auth.accountCreated'));
      navigate('/');
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || '';

      if (status === 409) {
        if (msg.includes('username')) {
          setError(t('auth.usernameTaken'));
        } else if (msg.includes('phone')) {
          setError(t('auth.phoneAlreadyRegistered'));
        } else if (msg.includes('email')) {
          setError(t('auth.emailTaken'));
        } else {
          setError(msg || t('auth.registerFailed'));
        }
      } else if (status === 400) {
        setError(msg || t('auth.invalidInput'));
      } else {
        setError(msg || t('auth.registerFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/send-code', { phone });
      setCountdown(60);
      toast.success(t('auth.codeResent'));
    } catch (err: any) {
      setError(err.response?.data?.error || t('auth.sendCodeFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: t('auth.weak'), color: '#ef4444' };
    if (score <= 2) return { level: 2, label: t('auth.fair'), color: '#f59e0b' };
    if (score <= 3) return { level: 3, label: t('auth.good'), color: '#3b82f6' };
    return { level: 4, label: t('auth.strong'), color: '#22c55e' };
  };

  const strength = getPasswordStrength();

  return (
    <>
      <PolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
      <div className="min-h-dvh flex items-center justify-center px-4 py-8" dir={dir} style={{ background: 'var(--bg-primary)' }}>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'rgba(59,130,246,0.06)', filter: 'blur(100px)' }} />

        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <div className="text-center mb-6 animate-fade-down">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 8px 32px rgba(34,197,94,0.35)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('app.name')}</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t('auth.createAccount')}</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[
              { num: 1, icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )},
              { num: 2, icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
              )},
              { num: 3, icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              )},
              { num: 4, icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              )},
            ].map(({ num, icon }, i) => (
              <div key={num} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step > num ? 'bg-green-500 text-white scale-90' :
                  step === num ? 'text-white scale-110 shadow-lg' :
                  'text-white/40'
                }`} style={step === num ? { background: '#3b82f6', boxShadow: '0 0 16px rgba(59,130,246,0.4)' } : step > num ? { background: '#22c55e' } : { background: 'var(--bg-elevated)' }}>
                  {step > num ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : icon}
                </div>
                {i < 3 && <div className={`w-6 sm:w-8 h-0.5 transition-all duration-300 ${step > num ? 'bg-green-500' : 'bg-white/10'}`} />}
              </div>
            ))}
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

            {/* Step 1: Username */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('auth.chooseUsername')}</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('auth.usernameHint')}</p>
                </div>

                <div className="input-icon-wrapper">
                  <span className="input-icon input-icon-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); setUsernameAvailable(null); }}
                    placeholder={t('auth.username')}
                    className="neu-input w-full py-3 text-sm input-with-right-icon"
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                    required
                    autoFocus
                    minLength={3}
                    maxLength={20}
                  />
                  {username.length >= 3 && usernameAvailable !== null && (
                    <span className="input-icon input-icon-right">
                      {usernameAvailable ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      )}
                    </span>
                  )}
                </div>

                {username.length > 0 && username.length < 3 && (
                  <p className="text-xs" style={{ color: '#f59e0b' }}>{t('auth.usernameMin3')}</p>
                )}

                {invalidChars.length > 0 && (
                  <p className="text-xs" style={{ color: '#ef4444' }}>{t('auth.usernameInvalidChars').replace('{chars}', invalidChars.join('، '))}</p>
                )}

                {username.length > 10 && invalidChars.length === 0 && (
                  <p className="text-xs" style={{ color: '#ef4444' }}>{t('auth.usernameMax10')}</p>
                )}

                {username.length >= 3 && username.length <= 10 && usernameAvailable === false && invalidChars.length === 0 && (
                  <p className="text-xs" style={{ color: '#ef4444' }}>{t('auth.usernameTaken')}</p>
                )}

                {username.length >= 3 && username.length <= 10 && usernameAvailable === true && invalidChars.length === 0 && (
                  <p className="text-xs" style={{ color: '#22c55e' }}>{t('auth.usernameAvailable')}</p>
                )}

                <button type="submit" disabled={loading || username.length < 3 || username.length > 10 || usernameAvailable !== true || invalidChars.length > 0}
                  className="neu-btn-primary w-full py-3 text-sm font-medium disabled:opacity-50">
                  {t('auth.next')}
                </button>
              </form>
            )}

            {/* Step 2: Phone + Email */}
            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('auth.enterPhone')}</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('auth.phoneHint')}</p>
                </div>

                {/* Phone */}
                <div className="input-icon-wrapper">
                  <span className="input-icon input-icon-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 11)); setError(''); setPhoneAvailable(null); }}
                    placeholder="09123456789"
                    className="neu-input w-full py-3 text-sm input-with-right-icon"
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                    required
                    autoFocus
                    maxLength={11}
                  />
                  {isValidPhone(phone) && phoneAvailable !== null && (
                    <span className="input-icon input-icon-right">
                      {phoneAvailable ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      )}
                    </span>
                  )}
                </div>

                {phone.length > 0 && !isValidPhone(phone) && (
                  <p className="text-xs" style={{ color: '#f59e0b' }}>{t('auth.phoneInvalid')}</p>
                )}

                {phone.length > 0 && isValidPhone(phone) && phoneAvailable === false && (
                  <p className="text-xs" style={{ color: '#ef4444' }}>{t('auth.phoneAlreadyRegistered')}</p>
                )}

                {/* Email (optional) */}
                <div className="input-icon-wrapper">
                  <span className="input-icon input-icon-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailOptional')}
                    className="neu-input w-full py-3 text-sm"
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                  />
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="neu-btn py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                  </button>
                  <button type="submit" disabled={loading || !isValidPhone(phone) || phoneAvailable === false}
                    className="neu-btn-primary flex-1 py-3 text-sm font-medium disabled:opacity-50">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <SpinnerIcon size={16} />
                        <span>{t('auth.sending')}</span>
                      </span>
                    ) : t('auth.sendCode')}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Verify Code */}
            {step === 3 && (
              <form onSubmit={handleStep3} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('auth.verifyPhone')}</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('auth.codeSentTo')} <span className="font-medium" style={{ color: '#3b82f6' }}>{phone}</span>
                  </p>
                </div>

                <div className="input-icon-wrapper">
                  <span className="input-icon input-icon-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 5)); setError(''); }}
                    placeholder="12345"
                    className="neu-input w-full py-3 text-sm"
                    dir="ltr"
                    style={{ textAlign: 'left', letterSpacing: '0.3em', fontSize: '1.1em' }}
                    maxLength={5}
                    required
                    autoFocus
                  />
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep(2)}
                    className="neu-btn py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                  </button>
                  <button type="submit" disabled={loading || verificationCode.length !== 5}
                    className="neu-btn-primary flex-1 py-3 text-sm font-medium disabled:opacity-50">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <SpinnerIcon size={16} />
                        <span>{t('auth.verifying')}</span>
                      </span>
                    ) : t('auth.verifyCode')}
                  </button>
                </div>

                <div className="text-center">
                  {countdown > 0 ? (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t('auth.resendIn').replace('{seconds}', String(countdown))}
                    </span>
                  ) : (
                    <button type="button" onClick={handleResendCode} disabled={loading}
                      className="text-xs font-medium" style={{ color: '#3b82f6' }}>
                      {t('auth.resendCode')}
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Step 4: Password */}
            {step === 4 && (
              <form onSubmit={handleStep4} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('auth.setPassword')}</h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('auth.forUser')} <span className="font-medium" style={{ color: '#3b82f6' }}>{username}</span>
                  </p>
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
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="input-icon input-icon-right" tabIndex={-1}>
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

                {/* Password strength */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength.level ? strength.color : 'var(--border-subtle)' }} />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
                  </div>
                )}

                {/* Confirm Password */}
                <div className="input-icon-wrapper">
                  <span className="input-icon input-icon-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder={t('auth.confirmPassword')}
                    className="neu-input w-full py-3 text-sm input-with-right-icon"
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                    required
                    minLength={6}
                  />
                  {confirmPassword && (
                    <span className="input-icon input-icon-right">
                      {password === confirmPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      )}
                    </span>
                  )}
                </div>

                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs" style={{ color: '#ef4444' }}>{t('auth.passwordsDoNotMatch')}</p>
                )}

                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep(3)}
                    className="neu-btn py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                  </button>
                  <button type="submit" disabled={loading || !password || password !== confirmPassword || password.length < 6}
                    className="neu-btn-primary flex-1 py-3 text-sm font-medium disabled:opacity-50">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <SpinnerIcon size={16} />
                        <span>{t('auth.creatingAccount')}</span>
                      </span>
                    ) : t('auth.complete')}
                  </button>
                </div>
              </form>
            )}

            {step !== 4 && (
              <>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full" style={{ borderTop: '1px solid var(--border-subtle)' }} />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                      {t('auth.or')}
                    </span>
                  </div>
                </div>

                <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t('auth.hasAccount')}{' '}
                  <Link to="/login" className="font-medium" style={{ color: '#3b82f6' }}>{t('auth.login')}</Link>
                </p>
              </>
            )}
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
