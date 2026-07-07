import { useState, useEffect } from 'react';

interface TransitionOverlayProps {
  show: boolean;
  target?: 'game' | 'panel';
  onComplete?: () => void;
}

export default function TransitionOverlay({ show, target = 'game', onComplete }: TransitionOverlayProps) {
  const [phase, setPhase] = useState<'idle' | 'entering' | 'visible' | 'leaving'>('idle');

  useEffect(() => {
    if (show) {
      setPhase('entering');
      const t1 = setTimeout(() => setPhase('visible'), 300);
      const t2 = setTimeout(() => setPhase('leaving'), 600);
      const t3 = setTimeout(() => {
        setPhase('idle');
        onComplete?.();
      }, 900);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [show, onComplete]);

  if (phase === 'idle') return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{
        background: 'var(--bg-primary)',
        opacity: phase === 'entering' || phase === 'leaving' ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: phase === 'visible' ? 'all' : 'none',
      }}
    >
      {/* Center icon */}
      <div className="flex flex-col items-center gap-4">
        {/* Animated icon */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: target === 'game'
              ? 'linear-gradient(135deg, #f97316, #dc2626)'
              : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            boxShadow: target === 'game'
              ? '0 0 40px rgba(249, 115, 22, 0.4)'
              : '0 0 40px rgba(59, 130, 246, 0.4)',
            animation: 'gameIconSpin 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {target === 'game' ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          )}
        </div>

        {/* Loading dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: target === 'game' ? '#f97316' : '#3b82f6',
                animation: `dotPulse 1s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Text */}
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          {target === 'game' ? 'Opening game...' : 'Opening panel...'}
        </p>
      </div>

      <style>{`
        @keyframes gameIconSpin {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(0deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
