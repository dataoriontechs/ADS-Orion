
'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: string;
  label: string;
  success?: boolean;
}

export function StatCard({ icon, value, label, success }: StatCardProps) {
  return (
    <div className="bg-white rounded-[2.5rem] p-10 space-y-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:border-white transition-all group">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
        {icon}
      </div>
      <div className="space-y-1">
        <div className={`text-5xl font-bold font-headline tracking-tighter ${success ? 'text-green-500' : 'text-slate-900'}`}>{value}</div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{label}</p>
      </div>
    </div>
  );
}
