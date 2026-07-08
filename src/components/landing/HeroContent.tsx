'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function HeroContent() {
  return (
    <div className="relative z-10 max-w-[500px] space-y-6">
      <Badge
        variant="outline"
        className="
          h-9
          px-4
          rounded-full
          border-primary/20
          bg-white/50
          backdrop-blur-md
          text-primary
          font-bold
          tracking-wider
          text-[9px]
          uppercase
        "
      >
          <Sparkles className="w-3 h-3 mr-2" />
          NOVA GERAÇÃO DE ANÚNCIOS DIGITAIS
      </Badge>
      
      <h1
        className="
        font-headline
        font-black
        tracking-[-0.04em]
        leading-[1.1]
        text-[36px]
        lg:text-[46px]
        text-slate-900
        "
      >
        Crie uma campanha <br />
        <span className="text-primary">uma única vez</span> e <br />
        publique em tudo.
      </h1>
      
      <p
        className="
        max-w-[420px]
        text-[14px]
        lg:text-[15px]
        leading-[1.6]
        text-slate-500
        font-medium
        "
      >
        ADS Orion utiliza inteligência artificial para orquestrar suas campanhas nas principais plataformas do mundo automaticamente.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
        <Link href="/register">
          <Button size="lg" className="h-12 px-8 rounded-full font-bold text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group">
            Começar agora 
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
        <Link href="#features">
          <Button size="lg" variant="secondary" className="h-12 px-8 rounded-full font-bold text-base bg-white border border-slate-100 shadow-sm hover:bg-slate-50 text-slate-600">
            Ver funcionalidades
          </Button>
        </Link>
      </div>
    </div>
  );
}
