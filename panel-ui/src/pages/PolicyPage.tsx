import { Link } from 'react-router-dom';
import { useLang } from '@/i18n/LanguageContext';

const sections = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
    color: '#3b82f6',
    titleKey: 'policy.section1Title',
    bodyKey: 'policy.section1Body',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    color: '#22c55e',
    titleKey: 'policy.section2Title',
    items: ['policy.section2Item1', 'policy.section2Item2', 'policy.section2Item3', 'policy.section2Item4'],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    color: '#f59e0b',
    titleKey: 'policy.section3Title',
    items: ['policy.section3Item1', 'policy.section3Item2', 'policy.section3Item3'],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    color: '#ef4444',
    titleKey: 'policy.section4Title',
    bodyKey: 'policy.section4Body',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    color: '#8b5cf6',
    titleKey: 'policy.section5Title',
    bodyKey: 'policy.section5Body',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
      </svg>
    ),
    color: '#06b6d4',
    titleKey: 'policy.section6Title',
    bodyKey: 'policy.section6Body',
  },
];

export default function PolicyPage() {
  const { t, dir } = useLang();

  return (
    <div className="min-h-dvh" dir={dir} style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm transition-colors" style={{ color: '#3b82f6' }}>
            <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {t('policy.back')}
          </Link>
          <h1 className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('policy.title')}
          </h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
        {/* Hero Section */}
        <div className="relative mb-8 sm:mb-10">
          <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.08)', filter: 'blur(60px)' }} />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full" style={{ background: 'rgba(139, 92, 246, 0.08)', filter: 'blur(60px)' }} />
          </div>

          <div className="text-center py-8 sm:py-12 px-4">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 12px 40px rgba(59,130,246,0.4)' }}>
                <svg width="40" height="40" className="sm:w-12 sm:h-12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#22c55e', boxShadow: '0 4px 12px rgba(34,197,94,0.4)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('policy.title')}
            </h2>
            <p className="text-xs sm:text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t('policy.subtitle')}
            </p>

            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6">
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold" style={{ color: '#3b82f6' }}>6</div>
                <div className="text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>{t('policy.stats.sections')}</div>
              </div>
              <div className="w-px h-8" style={{ background: 'var(--border-subtle)' }} />
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold" style={{ color: '#22c55e' }}>4</div>
                <div className="text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>{t('policy.stats.conduct')}</div>
              </div>
              <div className="w-px h-8" style={{ background: 'var(--border-subtle)' }} />
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold" style={{ color: '#f59e0b' }}>3</div>
                <div className="text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>{t('policy.stats.rules')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <h3 className="text-xs sm:text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            {t('policy.tableOfContents')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sections.map((section, i) => (
              <a key={i} href={`#section-${i}`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all hover:scale-[1.02]"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${section.color}15`, color: section.color }}>
                  {section.icon}
                </div>
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{t(section.titleKey)}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4 sm:space-y-5">
          {sections.map((section, i) => (
            <div key={i} id={`section-${i}`} className="scroll-mt-20">
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${section.color}15`, color: section.color }}>
                    {section.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${section.color}15`, color: section.color }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-sm sm:text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {t(section.titleKey)}
                    </h3>
                  </div>
                </div>

                <div className="px-4 sm:px-5 py-3 sm:py-4">
                  {section.bodyKey && (
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {t(section.bodyKey)}
                    </p>
                  )}

                  {section.items && (
                    <ul className="space-y-2 sm:space-y-2.5">
                      {section.items.map((itemKey, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: `${section.color}10` }}>
                            <span className="text-[10px] sm:text-xs font-bold" style={{ color: section.color }}>
                              {j + 1}
                            </span>
                          </div>
                          <span>{t(itemKey)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 sm:mt-12 text-center space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-xs sm:text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              {t('policy.by ContinuingYouAgree')}{' '}
              <span className="font-medium" style={{ color: '#3b82f6' }}>{t('policy.title')}</span>
            </p>
            <Link to="/login"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all hover:scale-105"
              style={{ background: '#3b82f6', color: 'white', boxShadow: '0 4px 20px rgba(59,130,246,0.35)' }}>
              <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              {t('policy.back')}
            </Link>
          </div>

          <p className="text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('policy.effectiveDate')}
          </p>

          {/* Branding */}
          <div className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('policy.branding')} · {t('policy.subProject')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
