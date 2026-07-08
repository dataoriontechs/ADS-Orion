
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BrainCircuit, 
  Sparkles, 
  Type, 
  Loader2, 
  Copy, 
  Check,
  Zap,
  Search,
  Target,
  TrendingUp,
  Globe
} from 'lucide-react';
import { aiAdCreativeAssistant, type AiAdCreativeAssistantOutput } from '@/ai/flows/ai-ad-creative-assistant-flow';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export default function OrionAIPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [loadingText, setLoadingText] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [textResult, setTextResult] = useState<AiAdCreativeAssistantOutput | null>(null);

  // Estados para Copywriting
  const [textInputs, setTextInputs] = useState({
    description: '',
    audience: '',
    tone: 'professional' as any,
    format: 'social_media_post' as any
  });

  // Busca de dados reais para os Insights
  const userCampaignsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'campaigns'), where('userId', '==', user.uid));
  }, [db, user]);

  const { data: campaigns } = useCollection(userCampaignsQuery);

  // Lógica para processar Insights Reais
  const realInsights = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return null;

    const totalClicks = campaigns.reduce((acc, c) => acc + (c.metrics?.clicks || 0), 0);
    const totalSpent = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
    
    const platformStats: Record<string, { clicks: number }> = {};
    campaigns.forEach(c => {
      c.platforms?.forEach((p: string) => {
        if (!platformStats[p]) platformStats[p] = { clicks: 0 };
        platformStats[p].clicks += (c.metrics?.clicks || 0);
      });
    });

    const bestPlatform = Object.entries(platformStats).sort((a, b) => b[1].clicks - a[1].clicks)[0];
    const avgCpc = totalClicks > 0 ? (totalSpent / totalClicks) : 0;

    const locations: Record<string, number> = {};
    campaigns.forEach(c => {
      c.targeting?.locations?.forEach((l: string) => {
        locations[l] = (locations[l] || 0) + 1;
      });
    });
    const topLocation = Object.entries(locations).sort((a, b) => b[1] - a[1])[0];

    return {
      platform: bestPlatform ? bestPlatform[0].toUpperCase() : 'N/A',
      cpc: avgCpc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      location: topLocation ? (topLocation[0] === 'BR' ? 'Brasil (Todo)' : topLocation[0]) : 'Pendente'
    };
  }, [campaigns]);

  const handleGenerateText = async () => {
    if (!textInputs.description) {
      toast({ title: "Campo Vazio", description: "Por favor, descreva o que você deseja vender.", variant: "destructive" });
      return;
    }
    setLoadingText(true);
    try {
      const result = await aiAdCreativeAssistant({
        productDescription: textInputs.description,
        targetAudience: textInputs.audience || "Público geral interessado no segmento",
        adFormat: textInputs.format,
        tone: textInputs.tone
      });
      setTextResult(result);
      toast({ title: "Texto Gerado!", description: "Sua copy persuasiva foi orquestrada pela Orion AI." });
    } catch (error: any) {
      toast({ title: "Erro na IA", description: "Não conseguimos processar os textos no momento.", variant: "destructive" });
    } finally {
      setLoadingText(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: "Copiado!" });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold flex items-center gap-3">
            <BrainCircuit className="text-primary w-8 h-8" />
            Orion <span className="text-primary">AI</span>
          </h2>
          <p className="text-muted-foreground">Sua central de inteligência criativa para anúncios de alta performance.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/20 py-1 px-3">
            <Zap className="w-3 h-3 mr-1" /> Inteligência Ativa
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="copywriting" className="space-y-6">
        <TabsList className="bg-slate-100 border border-slate-200 p-1 h-12">
          <TabsTrigger value="copywriting" className="gap-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Type className="w-4 h-4" /> Copywriting
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Search className="w-4 h-4" /> Insights de Público
          </TabsTrigger>
        </TabsList>

        <TabsContent value="copywriting" className="grid grid-cols-1 lg:grid-cols-2 gap-8 outline-none">
          <Card className="bg-white border-slate-200 shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="font-headline">Gerador de Copy</CardTitle>
              <CardDescription>Crie títulos e textos persuasivos baseados nas especificações do seu produto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>O que você está vendendo?</Label>
                <Textarea 
                  placeholder="Ex: Tênis de corrida ultraleve com tecnologia de amortecimento espacial..."
                  value={textInputs.description}
                  onChange={(e) => setTextInputs({...textInputs, description: e.target.value})}
                  className="min-h-[100px] bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Quem é o público-alvo?</Label>
                <Input 
                  placeholder="Ex: Atletas amadores de 25-40 anos que buscam conforto"
                  value={textInputs.audience}
                  onChange={(e) => setTextInputs({...textInputs, audience: e.target.value})}
                  className="bg-white border-slate-200 h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tom de Voz</Label>
                  <Select value={textInputs.tone} onValueChange={(v) => setTextInputs({...textInputs, tone: v})}>
                    <SelectTrigger className="bg-white border-slate-200 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select value={textInputs.format} onValueChange={(v) => setTextInputs({...textInputs, format: v})}>
                    <SelectTrigger className="bg-white border-slate-200 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social_media_post">Post Social</SelectItem>
                      <SelectItem value="search_ad">Search Ad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleGenerateText} className="w-full bg-primary h-11" disabled={loadingText}>
                {loadingText ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 w-4 h-4" />}
                Gerar Textos
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {textResult && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-primary font-bold">Sugestões de Copy Orion</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {textResult.titles.map((title, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg group">
                        <span className="text-sm font-medium">{title}</span>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(title, i)} className="h-8 w-8">
                          {copiedIndex === i ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    ))}
                    {textResult.bodyTexts.map((text, i) => (
                      <div key={`body-${i}`} className="p-4 bg-white border border-slate-200 rounded-lg relative group">
                        <p className="text-xs text-muted-foreground leading-relaxed italic pr-8">"{text}"</p>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(text, i + 100)} className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedIndex === i + 100 ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="outline-none">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Análise de Performance Orion AI</CardTitle>
              <CardDescription>
                {realInsights 
                  ? "Insights extraídos diretamente do comportamento das suas campanhas ativas." 
                  : "Tendências globais de anúncios (aguardando dados das suas campanhas)."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {realInsights ? (
                  <>
                    <InsightCard 
                      icon={<TrendingUp className="text-primary" />}
                      title="Plataforma Líder" 
                      value={realInsights.platform} 
                      desc="Esta rede está gerando o maior volume de interações reais para o seu perfil hoje."
                      trend="Melhor Performance"
                    />
                    <InsightCard 
                      icon={<Zap className="text-accent" />}
                      title="Custo Médio (CPC)" 
                      value={realInsights.cpc} 
                      desc="Média de investimento por clique considerando todas as suas campanhas orquestradas."
                      trend="Valor Real"
                    />
                    <InsightCard 
                      icon={<Globe className="text-green-500" />}
                      title="Foco Geográfico" 
                      value={realInsights.location} 
                      desc="Sua maior audiência está concentrada nesta região. Considere escalar o orçamento aqui."
                      trend="Público Ativo"
                    />
                  </>
                ) : (
                  <>
                    <InsightCard 
                      icon={<TrendingUp className="text-primary" />}
                      title="Formato em Alta" 
                      value="UGC Vídeos Curtos" 
                      desc="Tendência global: Vídeos amadores aumentaram em 42% a conversão no TikTok nesta semana."
                      trend="+12%"
                    />
                    <InsightCard 
                      icon={<Search className="text-accent" />}
                      title="Melhor Horário" 
                      value="19:00 - 21:30" 
                      desc="Pico de engajamento detectado para produtos de consumo direto e serviços locais."
                      trend="Estável"
                    />
                    <InsightCard 
                      icon={<Target className="text-green-500" />}
                      title="Cores do Momento" 
                      value="Azul Elétrico & Prata" 
                      desc="Paletas tecnológicas e futuristas estão gerando 15% mais cliques em display ads."
                      trend="+8%"
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InsightCard({ icon, title, value, desc, trend }: any) {
  return (
    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl hover:border-primary/20 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white border border-slate-200 rounded-lg">{icon}</div>
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{trend}</span>
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
      <div className="text-xl font-bold mb-2 group-hover:text-primary transition-colors text-slate-900">{value}</div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
