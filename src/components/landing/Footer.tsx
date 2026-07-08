'use client';

import { Rocket, Instagram, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="pt-24 pb-12 px-6 border-t border-slate-100 bg-[#fafafc]">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Rocket className="text-primary w-6 h-6" />
            <span className="font-headline font-black text-xl tracking-tighter uppercase text-slate-900">
              ADS <span className="text-primary">ORION</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            A revolução tecnológica aplicada ao marketing digital de alta performance.
          </p>
          <div className="flex items-center gap-4">
            <Link 
              href="https://www.linkedin.com/company/ads-orion" 
              target="_blank" 
              className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/20 hover:shadow-lg transition-all"
            >
              <Linkedin className="w-5 h-5" />
            </Link>
            <Link 
              href="https://www.instagram.com/adsoriontech/" 
              target="_blank" 
              className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/20 hover:shadow-lg transition-all"
            >
              <Instagram className="w-5 h-5" />
            </Link>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Time de Comando</h4>
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-900">Abel Souza <span className="text-primary font-medium text-xs ml-2">CEO & Founder</span></p>
            <p className="text-sm font-bold text-slate-900">Mítalo <span className="text-primary font-medium text-xs ml-2">CTO & Lead Arch</span></p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fale com o Suporte</h4>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Mail className="w-4 h-4 text-primary" />
            dataoriontechs@gmail.com
          </div>
          <div className="pt-4 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CNPJ: 54.377.268/0001-76</p>
            <p className="text-xs text-slate-400 leading-relaxed italic">© 2026 ADS ORION — Inteligência Artificial aplicada ao Tráfego Pago.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
