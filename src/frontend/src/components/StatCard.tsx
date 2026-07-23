import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  variant = 'default',
  icon,
}) => {
  const styles = {
    default: 'bg-slate-900 border-slate-800 text-slate-100',
    success: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300',
    error: 'bg-rose-950/40 border-rose-800/60 text-rose-300',
    warning: 'bg-amber-950/40 border-amber-800/60 text-amber-300',
    info: 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300',
  }[variant];

  const valueColors = {
    default: 'text-white',
    success: 'text-emerald-400',
    error: 'text-rose-400',
    warning: 'text-amber-400',
    info: 'text-indigo-400',
  }[variant];

  return (
    <div className={`${styles} p-6 rounded-xl border shadow-lg backdrop-blur-sm transition-all hover:border-slate-700`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {icon && <div className="p-2 rounded-lg bg-slate-800/60 text-slate-300">{icon}</div>}
      </div>
      <p className={`text-3xl font-extrabold mt-3 tracking-tight ${valueColors}`}>{value}</p>
      {subtext && <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>}
    </div>
  );
};
