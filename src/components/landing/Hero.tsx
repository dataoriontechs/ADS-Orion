
'use client';

import { HeroContent } from './HeroContent';
import { HeroVisual } from './HeroVisual';
import { BackgroundGlow } from './BackgroundGlow';

export function Hero() {
  return (
    <section id="home" className="relative pt-28 pb-10 px-4 md:px-10 max-w-[1400px] mx-auto scroll-mt-28">
      <BackgroundGlow />
      <div 
        className="rounded-[3rem] overflow-hidden relative p-8 md:p-12 lg:p-16 lg:pb-0 shadow-2xl"
        style={{
          background: 'radial-gradient(circle at 50% 40%, #eff3fd 0%, #d8e5fb 15%, #d4e0fc 30%, #cadbfc 45%, #c1dbfc 60%, #c1d2fb 80%, #e2eafd 100%)',
          backgroundColor: '#f2f6fd'
        }}
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <HeroContent />
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
