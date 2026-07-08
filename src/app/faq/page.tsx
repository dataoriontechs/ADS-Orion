'use client';

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, ShieldCheck, Scale, Gavel, FileText, Lock, AlertTriangle, HelpCircle } from 'lucide-react';

export default function PublicFAQPage() {
  return (
    <main className="min-h-screen bg-[#fafafc] font-body text-slate-900">
      <Navbar />
      
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
              <HelpCircle className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter">Central de Transparência</h1>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              Entenda as diretrizes operacionais da ADS Orion fundamentadas na legislação brasileira e nas melhores práticas do mercado digital.
            </p>
          </div>

          <div className="grid gap-8">
            <Card className="bg-white border-slate-200 shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                <CardTitle className="flex items-center gap-3 font-headline text-2xl">
                  <Gavel className="text-primary w-7 h-7" />
                  Diretrizes Jurídicas e Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-slate-100 px-8">
                    <AccordionTrigger className="text-left font-bold py-6 hover:no-underline hover:text-primary transition-colors">
                      1. Marco Civil da Internet (Lei 12.965/14)
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 leading-relaxed space-y-4 pb-6">
                      <p>
                        A ADS Orion atua em conformidade com o <strong>Marco Civil da Internet</strong>, estabelecendo princípios, garantias, direitos e deveres para o uso da rede no Brasil.
                      </p>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li><strong>Neutralidade da Rede:</strong> Garantimos que os dados trafegados em nossa orquestração recebam tratamento isonômico conforme a lei.</li>
                        <li><strong>Registros de Acesso:</strong> Em conformidade com o Art. 15, mantemos os registros de acesso a aplicações de internet sob sigilo, em ambiente controlado e de segurança pelo prazo de 6 meses.</li>
                        <li><strong>Privacidade:</strong> O sigilo da sua comunicação de dados é inviolável, exceto por ordem judicial específica.</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2" className="border-slate-100 px-8">
                    <AccordionTrigger className="text-left font-bold py-6 hover:no-underline hover:text-primary transition-colors">
                      2. Proteção de Dados (LGPD - Lei 13.709/18)
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 leading-relaxed space-y-4 pb-6">
                      <p>
                        O tratamento de dados pessoais na plataforma segue rigorosamente a <strong>LGPD</strong>, focando na finalidade, necessidade e transparência.
                      </p>
                      <div className="grid md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <h4 className="font-bold text-slate-900 mb-1">Finalidade</h4>
                          <p>Coletamos dados apenas para a execução do contrato de orquestração de anúncios e melhoria da IA.</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 mb-1">Direitos do Titular</h4>
                          <p>Você pode solicitar a qualquer momento a confirmação, acesso, correção ou exclusão de seus dados.</p>
                        </div>
                      </div>
                      <p className="text-sm">
                        <strong>Operador de Dados:</strong> A ADS Orion atua como operadora ao processar informações enviadas pelo anunciante (controlador) para as redes Meta e Google.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3" className="border-slate-100 px-8">
                    <AccordionTrigger className="text-left font-bold py-6 hover:no-underline hover:text-primary transition-colors">
                      3. Código de Defesa do Consumidor (CDC)
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 leading-relaxed space-y-4 pb-6">
                      <p>
                        No marketing digital, o <strong>CDC</strong> exige transparência total. Ao utilizar a Orion, você se compromete a:
                      </p>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li><strong>Identificação Publicitária:</strong> Todos os anúncios devem ser claramente identificados como tais, evitando publicidade enganosa ou abusiva.</li>
                        <li><strong>Veracidade:</strong> As ofertas vinculadas via orquestração devem honrar o preço e as condições apresentadas no criativo.</li>
                        <li><strong>Direito de Arrependimento:</strong> Aplicado conforme a natureza do serviço digital contratado na carteira Orion.</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4" className="border-slate-100 px-8">
                    <AccordionTrigger className="text-left font-bold py-6 hover:no-underline hover:text-primary transition-colors">
                      4. Normas Éticas do CONAR
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 leading-relaxed space-y-4 pb-6">
                      <p>
                        Embora sejamos uma ferramenta tecnológica, orientamos que toda campanha orquestrada siga o <strong>Código Brasileiro de Autorregulamentação Publicitária</strong>.
                      </p>
                      <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-xs text-yellow-800 italic">
                        "A publicidade deve ser honesta, decente e respeitar as leis do país, sendo preparada com o devido senso de responsabilidade social."
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5" className="border-slate-100 px-8">
                    <AccordionTrigger className="text-left font-bold py-6 hover:no-underline hover:text-primary transition-colors">
                      5. Políticas de Conteúdo Proibido
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 leading-relaxed space-y-4 pb-6">
                      <p>
                        Para manter a integridade da rede Orion e das contas mestras, é expressamente proibido anunciar:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-red-50 text-red-700 rounded-lg">• Produtos Ilícitos / Drogas</div>
                        <div className="p-2 bg-red-50 text-red-700 rounded-lg">• Armas e Munições</div>
                        <div className="p-2 bg-red-50 text-red-700 rounded-lg">• Conteúdo Adulto / Explícito</div>
                        <div className="p-2 bg-red-50 text-red-700 rounded-lg">• Esquemas de Pirâmide</div>
                        <div className="p-2 bg-red-50 text-red-700 rounded-lg">• Discurso de Ódio</div>
                        <div className="p-2 bg-red-50 text-red-700 rounded-lg">• Desinformação / Fake News</div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row gap-6">
               <Card className="flex-1 bg-primary text-white border-none rounded-[2rem] p-8 shadow-xl shadow-primary/20">
                  <div className="space-y-4">
                    <ShieldCheck className="w-10 h-10 opacity-50" />
                    <h3 className="text-2xl font-black font-headline leading-tight">Segurança de Dados Orion</h3>
                    <p className="text-primary-foreground/80 text-sm leading-relaxed">
                      Utilizamos criptografia de ponta a ponta e servidores seguros para garantir que seus ativos criativos e estratégias de público permaneçam confidenciais.
                    </p>
                  </div>
               </Card>
               <Card className="flex-1 bg-white border-slate-200 rounded-[2rem] p-8 shadow-sm">
                  <div className="space-y-4">
                    <Scale className="w-10 h-10 text-primary opacity-20" />
                    <h3 className="text-2xl font-black font-headline text-slate-900 leading-tight">Suporte Jurídico</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Dúvidas sobre a legalidade de um criativo ou sobre o uso de dados na plataforma? Nossa equipe de compliance está à disposição.
                    </p>
                    <div className="pt-2">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contato Compliance</p>
                       <p className="text-sm font-bold text-primary">dataoriontechs@gmail.com</p>
                    </div>
                  </div>
               </Card>
            </div>
          </div>

          <div className="text-center pt-10">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.3em]">Última atualização: 15 de Junho de 2024</p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
