'use client';

import Image from 'next/image';
import { FloatingCard } from './FloatingCard';
import { Wallet, TrendingUp, PieChart, BarChart3, MousePointer2 } from 'lucide-react';

export function HeroVisual() {
  return (
    <div className="relative h-[600px] flex items-center justify-center select-none overflow-visible">
      <div className="relative w-full h-full max-w-[600px]">
        
        {/* Imagem Central: Protagonista VR */}
        <div className="relative w-full h-full z-0 flex items-center justify-center">
          <Image
            src="/images/hero-vr.png"
            alt="ADS Orion Hero"
            width={2000}
            height={150}
            priority
            className="object-contain scale-[2.8] translate-y-20 translate-x-16"
          />
        </div>

        {/* CARD: Saldo em conta */}
        <FloatingCard
          className="absolute top-[0%] left-[-15%] w-72 z-20"
          icon={<Wallet className="w-6 h-6" />}
          label="Saldo em conta"
          value="R$ 78.650,00"
          trend="+12,5% vs. mês"
          rotation="rotate-3"
        >
          <div className="flex items-end gap-1 h-8 opacity-60">
            {[30, 50, 40, 70, 90, 60, 100].map((h, i) => (
              <div 
                key={i} 
                className="w-1 bg-primary rounded-full" 
                style={{ height: `${h}%` }} 
              />
            ))}
          </div>
        </FloatingCard>

        {/* CARD: Conversões */}
        <FloatingCard
          className="absolute top-[2%] right-[-5%] w-72 z-20"
          icon={<TrendingUp className="w-6 h-6" />}
          label="Conversões"
          value="1.854"
          trend="+18,7% vs. mês"
          rotation="rotate-2"
        >
          <svg className="w-16 h-8 overflow-visible opacity-60">
            <path 
              d="M0,25 Q10,20 20,5 T40,15 T60,0 T80,20" 
              fill="none" 
              stroke="#0047FF" 
              strokeWidth="3" 
              strokeLinecap="round" 
            />
          </svg>
        </FloatingCard>

        {/* CARD: Campanhas ativas */}
        <FloatingCard
          className="absolute top-[42%] left-[-30%] w-72 z-20"
          icon={<PieChart className="w-6 h-6" />}
          label="Campanhas ativas"
          value="24 orquestrações"
          trend="+9,1% estável"
          rotation="-rotate-2"
        >
          <div className="relative w-10 h-10 opacity-60">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path className="stroke-slate-200/50 fill-none" strokeWidth="4" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="stroke-primary fill-none" strokeWidth="4" strokeDasharray="75, 100" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
          </div>
        </FloatingCard>

        {/* CARD: Impressões */}
        <FloatingCard
          className="absolute top-[52%] right-[-10%] w-72 z-20"
          icon={<BarChart3 className="w-6 h-6" />}
          label="Impressões"
          value="2.450.123"
          trend="+14,3% alcance"
          rotation="rotate-2"
        >
          <div className="flex items-end gap-1 h-8 opacity-60">
            {[40, 60, 20, 80, 50, 90, 70].map((h, i) => (
              <div 
                key={i} 
                className="w-1 bg-primary/40 rounded-full" 
                style={{ height: `${h}%` }} 
              />
            ))}
          </div>
        </FloatingCard>

        {/* CARD: Cliques */}
        <FloatingCard
          className="absolute bottom-[2%] left-[-10%] w-72 z-20"
          icon={<MousePointer2 className="w-6 h-6" />}
          label="Cliques reais"
          value="45.678"
          trend="+11,2% engaje"
          rotation="-rotate-1"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/40 to-transparent border border-white/40 opacity-40" />
        </FloatingCard>

      </div>
    </div>
  );
}
