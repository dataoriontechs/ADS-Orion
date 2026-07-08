
'use client';

import { Users, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';
import { StatCard } from './StatCard';

export function Stats() {
  return (
    <div className="space-y-12 pb-32">
      <section className="py-12 px-4 md:px-10 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard icon={<Users />} value="+850" label="Usuários ativos" />
          <StatCard icon={<TrendingUp />} value="R$ 1.2M" label="Volume orquestrado" />
          <StatCard icon={<Layers />} value="8" label="Plataformas" />
          <StatCard icon={<CheckCircle2 />} value="99.2%" label="Sucesso do cliente" success />
        </div>
      </section>

      {/* Identity & Proposal Section */}
      <section id="about" className="px-4 md:px-10 max-w-[1400px] mx-auto grid lg:grid-cols-5 gap-20 items-center pt-10 scroll-mt-24">
        <div className="lg:col-span-3 space-y-8">
          <h2 className="text-4xl md:text-7xl font-black font-headline text-slate-900 leading-[1.1] tracking-tighter">
            A orquestração que sua marca merece.
          </h2>
          <p className="text-xl text-slate-500 leading-relaxed max-w-2xl font-medium">
            Somos mais que uma ferramenta de anúncios. Somos o cérebro por trás da sua escalada digital, unificando dados e criatividade para dominar todos os canais de atenção do mundo simultaneamente.
          </p>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-8">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black font-headline text-slate-900">Escala Global</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Nossa infraestrutura está conectada aos maiores backends publicitários, garantindo que sua mensagem chegue ao público certo, no custo certo, em tempo real.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
