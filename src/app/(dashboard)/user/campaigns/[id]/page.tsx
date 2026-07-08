
'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  MousePointer2, 
  Eye, 
  Target, 
  Zap, 
  Loader2,
  Calendar,
  Globe,
  Instagram,
  Facebook,
  Info
} from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  type ChartConfig 
} from '@/components/ui/chart';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useDoc, useCollection, useFirestore } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

const chartConfig = {
  impressions: { label: "Impressões", color: "hsl(var(--primary))" },
  clicks: { label: "Cliques", color: "hsl(var(--accent))" },
  conversions: { label: "Conversões", color: "#22c55e" }
} satisfies ChartConfig;

export default function CampaignDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();

  const campaignRef = useMemo(() => (db && id ? doc(db, 'campaigns', id as string) : null), [db, id]);
  const metricsQuery = useMemo(() => (db && id ? collection(db, 'campaigns', id as string, 'platform_metrics') : null), [db, id]);

  const { data: campaign, loading: campLoading } = useDoc(campaignRef);
  const { data: platformMetrics, loading: metricsLoading } = useCollection(metricsQuery);

  const stats = useMemo(() => {
    if (!campaign) return null;

    const ctr = campaign.metrics?.impressions > 0 
      ? ((campaign.metrics.clicks / campaign.metrics.impressions) * 100).toFixed(2) 
      : "0.00";
    
    const cpc = campaign.metrics?.clicks > 0 
      ? (campaign.metrics.spent / campaign.metrics.clicks).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
      : "R$ 0,00";

    const chartData = platformMetrics.map(m => ({
      platform: m.platform.toUpperCase(),
      impressions: m.impressions || 0,
      clicks: m.clicks || 0,
      conversions: m.conversions || 0,
      spent: m.spent || 0
    }));

    return { ctr, cpc, chartData };
  }, [campaign, platformMetrics]);

  if (campLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  if (!campaign) return <div className="text-center py-20">Campanha não encontrada.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-headline font-bold">{campaign.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20 bg-primary/5">
                {campaign.status}
              </Badge>
              <span className="text-xs text-muted-foreground">• Criada em {new Date(campaign.createdAt?.seconds * 1000).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricSmallCard title="Impressões" value={campaign.metrics?.impressions?.toLocaleString('pt-BR') || 0} icon={<Eye className="text-primary w-4 h-4" />} />
        <MetricSmallCard title="Cliques" value={campaign.metrics?.clicks?.toLocaleString('pt-BR') || 0} icon={<MousePointer2 className="text-accent w-4 h-4" />} />
        <MetricSmallCard title="CTR Médio" value={`${stats?.ctr}%`} icon={<TrendingUp className="text-green-500 w-4 h-4" />} />
        <MetricSmallCard title="Conversões" value={campaign.metrics?.conversions?.toLocaleString('pt-BR') || 0} icon={<Target className="text-primary w-4 h-4" />} />
        <MetricSmallCard title="CPC Médio" value={stats?.cpc || 'R$ 0,00'} icon={<Zap className="text-accent w-4 h-4" />} />
        <MetricSmallCard title="Investimento" value={`R$ ${campaign.metrics?.spent?.toLocaleString('pt-BR') || 0}`} icon={<Globe className="text-green-500 w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Cliques por Plataforma
            </CardTitle>
            <CardDescription>Comparativo real de engajamento entre as redes selecionadas.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            {stats?.chartData.length ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={stats.chartData}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="platform" fontSize={12} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="clicks" name="Cliques" radius={[4, 4, 0, 0]}>
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Info className="w-8 h-8 opacity-20" />
                <p className="text-xs uppercase font-bold tracking-tighter">Aguardando dados das redes</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              Conversões por Plataforma
            </CardTitle>
            <CardDescription>Volume de resultados diretos gerados em cada canal.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
             {stats?.chartData.length ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={stats.chartData}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="platform" fontSize={12} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="conversions" name="Conversões" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Info className="w-8 h-8 opacity-20" />
                <p className="text-xs uppercase font-bold tracking-tighter">Sem conversões registradas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-headline font-bold">Resultados por Plataforma</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformMetrics.map((m) => (
            <Card key={m.id} className="bg-card/50 border-white/5 hover:border-primary/20 transition-all overflow-hidden">
              <CardHeader className="bg-white/5 pb-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm uppercase tracking-widest">{m.platform}</span>
                  {m.platform.toLowerCase() === 'instagram' && <Instagram className="w-4 h-4 text-pink-500" />}
                  {m.platform.toLowerCase() === 'facebook' && <Facebook className="w-4 h-4 text-blue-500" />}
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Impressões:</span> <span className="font-bold">{m.impressions?.toLocaleString('pt-BR')}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Cliques:</span> <span className="font-bold text-primary">{m.clicks?.toLocaleString('pt-BR')}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Conversões:</span> <span className="font-bold text-green-500">{m.conversions?.toLocaleString('pt-BR')}</span></div>
                <div className="flex justify-between text-xs border-t border-white/5 pt-2"><span className="text-muted-foreground">Valor Gasto:</span> <span className="font-bold">R$ {m.spent?.toLocaleString('pt-BR')}</span></div>
              </CardContent>
            </Card>
          ))}
          {platformMetrics.length === 0 && (
             <div className="col-span-full py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 text-muted-foreground">
               Os dados individuais por plataforma estão sendo processados e aparecerão aqui em breve.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricSmallCard({ title, value, icon }: any) {
  return (
    <Card className="bg-card/30 border-white/5">
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground">
          {icon} {title}
        </div>
        <div className="text-lg font-bold font-headline">{value}</div>
      </CardContent>
    </Card>
  );
}
