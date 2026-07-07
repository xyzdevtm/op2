import { useState, useRef, useEffect } from 'react';
import { useLang } from './LanguageContext';
import { GlobeIcon, CheckIcon } from '@/components/Icons';
import type { Locale } from './translations';

const languages: { code: Locale; label: string; labelEn: string; flag: string }[] = [
  { code: 'fa', label: 'فارسی', labelEn: 'Persian', flag: '🇮🇷' },
  { code: 'en', label: 'English', labelEn: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', labelEn: 'Arabic', flag: '🇸🇦' },
  { code: 'tr', label: 'Türkçe', labelEn: 'Turkish', flag: '🇹🇷' },
];

export default function LanguageSwitcher() {
  const { locale, setLocale, dir } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = languages.find((l) => l.code === locale) || languages[0];

  const handleSelect = (code: Locale) => {
    setOpen(false);
    if (code !== locale) {
      setLocale(code);
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="neu-btn rounded-xl flex items-center justify-center gap-1.5"
        style={{
          width: 36,
          height: 36,
          color: 'var(--text-muted)',
          padding: '6px',
          background: open ? 'var(--bg-primary)' : 'var(--bg-surface)',
          boxShadow: open ? 'var(--neu-shadow-inset)' : 'var(--neu-shadow-sm)',
        }}
        aria-label="Select language"
      >
        <GlobeIcon size={17} />
      </button>

      {/* Dropdown with slide animation */}
      <div
        className={`
          absolute top-full mt-2 z-50 w-48 overflow-hidden
          rounded-xl transition-all duration-200 ease-out
          ${open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
          }
        `}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.3), 0 0 1px rgba(59,130,246,0.1)',
          [dir === 'rtl' ? 'left' : 'right']: 0,
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          {dir === 'rtl' ? 'انتخاب زبان' : 'Select Language'}
        </div>

        {/* Options */}
        {languages.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150
                ${isActive ? '' : 'hover:opacity-80'}
              `}
              style={{
                background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                color: isActive ? '#3b82f6' : 'var(--text-secondary)',
              }}
            >
              <span className="text-base">{lang.flag}</span>
              <div className="flex-1 text-start">
                <p className="font-medium leading-tight">{lang.label}</p>
                <p className="text-[10px] leading-tight" style={{ opacity: 0.5 }}>{lang.labelEn}</p>
              </div>
              {isActive && (
                <CheckIcon size={14} style={{ color: '#3b82f6' }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
