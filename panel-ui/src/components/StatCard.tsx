import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  accent?: string;
  className?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  subValue,
  accent = '#3b82f6',
  className = '',
}: StatCardProps) {
  return (
    <div className={`neu-raised relative overflow-hidden ${className}`}>
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: accent }} />
      <div className="p-4 lg:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-xl lg:text-2xl font-semibold mt-1.5 truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
            {subValue && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{subValue}</p>
            )}
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accent}18`, color: accent, boxShadow: 'var(--shadow-neu-sm)' }}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
