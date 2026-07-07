import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface QuickActionCardProps {
  to: string;
  icon: ReactNode;
  label: string;
  accent?: string;
}

export default function QuickActionCard({
  to,
  icon,
  label,
  accent = '#3b82f6',
}: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className="neu-raised p-4 flex items-center gap-3 group transition-all duration-200"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
        style={{ background: `${accent}12`, color: accent, boxShadow: 'var(--shadow-neu-sm)' }}
      >
        {icon}
      </div>
      <span className="text-sm font-medium transition-colors duration-200" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
    </Link>
  );
}
