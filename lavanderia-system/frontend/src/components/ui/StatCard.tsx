import type { ReactNode } from 'react';
import { cn } from '@/utils/format';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  gradient: string;
  hint?: string;
}

export function StatCard({ label, value, icon, gradient, hint }: StatCardProps) {
  return (
    <div className="card group relative overflow-hidden p-5 transition-shadow hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-extrabold text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md',
            gradient
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}