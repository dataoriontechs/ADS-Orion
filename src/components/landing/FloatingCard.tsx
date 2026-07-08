'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FloatingCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: string;
  children?: ReactNode;
  className?: string;
  rotation?: string;
}

export function FloatingCard({
  icon,
  label,
  value,
  trend,
  children,
  className,
  rotation = "rotate-0"
}: FloatingCardProps) {
  return (
    <div
      className={cn(
        `
        relative
        overflow-hidden
        rounded-[32px]
        bg-white/40
        backdrop-blur-[12px]
        border
        border-white/30
        shadow-[0_8px_32px_rgba(0,0,0,0.05)]
        transition-all
        duration-700
        hover:scale-105
        px-6
        pt-3
        pb-6
        h-36
        flex
        flex-col
        justify-between
        `,
        className,
        rotation
      )}
    >
      {/* Efeito Liquid Glass - Reflexos Sutis */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/40 flex items-center justify-center text-primary shadow-sm border border-white/40 shrink-0">
            {icon}
          </div>
          <span className="text-[9px] font-bold text-slate-900 uppercase tracking-[0.15em] leading-tight">
            {label}
          </span>
        </div>

        <div className="pl-1">
          <div className="text-xl font-black text-slate-900 tracking-tighter font-headline">
            {value}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex justify-between items-end pl-1">
        {trend ? (
          <div className="text-[9px] font-bold bg-green-500/10 text-green-700 px-2 py-1 rounded-full border border-green-500/10">
            {trend}
          </div>
        ) : <div />}
        <div className="flex-1 flex justify-end overflow-hidden max-h-12">
          {children}
        </div>
      </div>
    </div>
  );
}
