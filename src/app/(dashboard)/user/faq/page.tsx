
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Info, ShieldAlert, ShieldCheck, Scale, Zap, Wallet, Rocket } from 'lucide-react';

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold flex items-center gap-3">
          <Info className="text-primary w-8 h-8" />
          FAQ - Central de Ajuda
        </h2>
        <p className="text-muted-foreground">
          Entenda como funciona o ecossistema ADS Orion e nossas diretrizes de serviço.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card/50 border-white/5 overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-white/5">
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Funcionamento da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-white/5">
                <AccordionTrigger className="text-left font-bold hover:no-underline">O que é a ADS Orion?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  A ADS Orion é um orquestrador inteligente de anúncios que simplifica o tráfego pago. Em uma única interface, você configura sua campanha e nossa IA cuida da publicação e otimização em redes como Facebook e Instagram.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-white/5">
                <AccordionTrigger className="text-left font-bold hover:no-underline">Como os créditos são utilizados?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Ao carregar saldo em sua carteira, você adquire créditos de orquestração. Esses créditos são consumidos à medida que suas campanhas são publicadas e entregues pelo sistema. O valor que você vê em sua conta é o montante total disponível para novas orquestrações.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-white/5">
                <AccordionTrigger className="text-left font-bold hover:no-underline">O Orion AI cobra taxas adicionais?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Nossos planos incluem todos os custos de processamento, IA e manutenção da infraestrutura de automação. Não há cobranças "surpresa" por fora do saldo que você carrega na plataforma.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 overflow-hidden">
          <CardHeader className="bg-destructive/5 border-b border-white/5">
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Conformidade e Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="legal-1" className="border-white/5">
                <AccordionTrigger className="text-left font-bold hover:no-underline">Quais conteúdos são permitidos?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Todos os anúncios devem seguir as leis brasileiras e as políticas de publicidade da Meta. É proibida a promoção de produtos ilícitos, incitação à violência ou esquemas fraudulentos.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="legal-3" className="border-white/5">
                <AccordionTrigger className="text-left font-bold hover:no-underline">Como meus dados são protegidos?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Seguimos rigorosamente a LGPD. Seus dados de faturamento e campanhas são criptografados e utilizados exclusivamente para a operação técnica da plataforma.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center space-y-4">
        <Scale className="w-10 h-10 mx-auto text-primary opacity-40" />
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Ao utilizar a ADS Orion, você concorda com nossos Termos de Uso. O uso indevido da plataforma pode resultar em suspensão da conta.
        </p>
      </div>
    </div>
  );
}
