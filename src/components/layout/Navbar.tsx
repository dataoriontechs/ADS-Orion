'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, Rocket } from 'lucide-react';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/#home", label: "Home" },
    { href: "/#features", label: "Funcionalidades" },
    { href: "/#about", label: "Sobre nós" },
    { href: "/faq", label: "FAQ" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fafafc]/70 backdrop-blur-md">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/#home" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Rocket className="text-white w-6 h-6" />
          </div>
          <span className="font-headline text-xl font-black tracking-tighter uppercase text-slate-900">
            ADS <span className="text-primary">ORION</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" className="text-sm font-bold text-slate-900 hover:text-primary transition-colors border-l border-slate-200 pl-8">
            Entrar
          </Link>
        </div>

        <div className="hidden md:block shrink-0">
          <Link href="/register">
            <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 h-11">
              Seja um membro
            </Button>
          </Link>
        </div>

        <button className="md:hidden p-2 text-slate-900" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="absolute top-20 left-0 right-0 bg-white border-b p-6 flex flex-col gap-4 md:hidden animate-in slide-in-from-top-5">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              onClick={() => setOpen(false)}
              className="text-lg font-bold text-slate-900"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)} className="text-lg font-bold text-slate-900">Entrar</Link>
          <Link href="/register" onClick={() => setOpen(false)}>
            <Button className="w-full rounded-full font-bold h-12">Seja um membro</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
