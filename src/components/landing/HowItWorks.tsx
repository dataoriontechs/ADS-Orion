
'use client';

import Image from 'next/image';

export function HowItWorks() {
  return (
    <section id="features" className="py-24 px-4 md:px-10 max-w-[1400px] mx-auto overflow-hidden scroll-mt-24">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6 order-2 lg:order-1">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black font-headline text-slate-900 tracking-tighter leading-tight">
              Anuncie em poucos <br />
              segundos. <span className="text-primary">Simples assim.</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium max-w-md">
              Eliminamos a barreira técnica. Você traz a ideia, nós cuidamos da engenharia de tráfego com uma interface intuitiva e poderosa.
            </p>
          </div>
        </div>

        <div className="relative order-1 lg:order-2">
          {/* Imagem direta do painel sem container de mockup */}
          <div className="relative animate-in fade-in slide-in-from-right-10 duration-1000">
            <Image 
              src="/images/painel.png" 
              alt="Orion Painel" 
              width={1200} 
              height={800} 
              className="rounded-[2.5rem] shadow-2xl border border-slate-100"
              priority
            />
          </div>

          {/* Efeitos de fundo para profundidade */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[100px] -z-10" />
        </div>
      </div>
    </section>
  );
}
