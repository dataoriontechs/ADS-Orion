
"use client";

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  Download, 
  Target, 
  Zap, 
  MousePointer2, 
  Award, 
  Loader2, 
  Rocket, 
  PlusCircle,
  Eye,
  CheckCircle2,
  Sparkles,
  Calendar
} from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  type ChartConfig 
} from '@/components/ui/chart';
import { 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Area, 
  AreaChart,
  ResponsiveContainer,
  Cell,
  Pie,
  PieChart as RechartsPieChart
} from 'recharts';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { analyzeCampaigns, type AnalyzeCampaignsOutput } from '@/ai/flows/campaign-analysis-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const chartConfig = {
  revenue: { label: "Receita (R$)", color: "hsl(var(--primary))" },
  spent: { label: "Investimento (R$)", color: "hsl(var(--accent))" }
} satisfies ChartConfig;

export default function ReportsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [isScaling, setIsScaling] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzeCampaignsOutput | null>(null);
  const [period, setPeriod] = useState('all');
  const [lastSync, setLastSync] = useState(new Date());

  const userCampaignsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'campaigns'),
      where('userId', '==', user.uid)
    );
  }, [db, user]);

  const { data: rawCampaigns, loading: dataLoading } = useCollection(userCampaignsQuery);

  useEffect(() => {
    if (!dataLoading) setLastSync(new Date());
  }, [rawCampaigns, dataLoading]);

  const stats = useMemo(() => {
    if (!rawCampaigns || rawCampaigns.length === 0) return null;

    let campaigns = [...rawCampaigns];
    
    if (period !== 'all') {
      const now = new Date();
      let start = subDays(now, 3650);
      if (period === '7d') start = startOfDay(subDays(now, 7));
      if (period === '30d') start = startOfDay(subDays(now, 30));
      
      campaigns = campaigns.filter(c => {
        if (!c.createdAt?.seconds) return false;
        const cDate = new Date(c.createdAt.seconds * 1000);
        return isWithinInterval(cDate, { start, end: endOfDay(now) });
      });
    }

    if (campaigns.length === 0) return null;

    const totalSpent = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + (c.metrics?.clicks || 0), 0);
    const totalImpressions = campaigns.reduce((acc, c) => acc + (c.metrics?.impressions || 0), 0);
    const totalConversions = campaigns.reduce((acc, c) => acc + (c.metrics?.conversions || 0), 0);
    
    const platformStats: Record<string, { spent: number; clicks: number }> = {};
    campaigns.forEach(c => {
      c.platforms?.forEach((p: string) => {
        if (!platformStats[p]) platformStats[p] = { spent: 0, clicks: 0 };
        platformStats[p].spent += (c.budget || 0);
        platformStats[p].clicks += (c.metrics?.clicks || 0);
      });
    });

    const performanceByPlatform = Object.entries(platformStats).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: totalSpent > 0 ? Math.round((data.spent / totalSpent) * 100) : 0,
      spent: data.spent,
      color: name === 'google' ? 'hsl(var(--primary))' : 
             name === 'facebook' || name === 'instagram' ? 'hsl(var(--accent))' : 
             name === 'tiktok' ? '#22c55e' : '#f59e0b'
    })).filter(p => p.spent > 0);

    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthlyMap: Record<string, { month: string, spent: number, clicks: number }> = {};
    
    campaigns.forEach(c => {
      if (c.createdAt?.seconds) {
        const date = new Date(c.createdAt.seconds * 1000);
        const monthName = months[date.getMonth()];
        if (!monthlyMap[monthName]) {
          monthlyMap[monthName] = { month: monthName, spent: 0, clicks: 0 };
        }
        monthlyMap[monthName].spent += (c.budget || 0);
        monthlyMap[monthName].clicks += (c.metrics?.clicks || 0);
      }
    });

    return {
      totalClicks,
      totalSpent,
      totalImpressions,
      totalConversions,
      performanceByPlatform,
      monthlyData: Object.values(monthlyMap),
      campaigns
    };
  }, [rawCampaigns, period]);

  const handleScaleCampaigns = async () => {
    if (!stats || !db || !user || stats.campaigns.length === 0) {
      toast({ title: "Ação não permitida", description: "Sem campanhas ativas no período.", variant: "destructive" });
      return;
    }

    setIsScaling(true);
    try {
      const campaignInputs = stats.campaigns.map(c => ({
        name: c.name,
        budget: c.budget || 0,
        clicks: c.metrics?.clicks || 0,
        conversions: c.metrics?.conversions || 0,
        platforms: c.platforms || [],
      }));

      const result = await analyzeCampaigns({ campaigns: campaignInputs });
      setAiAnalysis(result);
      toast({ title: "Análise Orion AI concluída", className: "bg-primary text-white font-bold" });
    } catch (error) {
      toast({ title: "Erro na IA", variant: "destructive" });
    } finally {
      setIsScaling(false);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
        <p className="text-sm text-muted-foreground font-medium">Extraindo dados reais...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold">Relatórios Reais</h2>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             Live Analytics • Última carga: {format(lastSync, 'HH:mm:ss')}
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] bg-white border-slate-200 h-11 rounded-xl shadow-sm">
              <Calendar className="w-4 h-4 mr-2 opacity-40" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo histórico</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => {}} variant="outline" className="border-white/5 bg-card gap-2">
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {!stats ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
          <BarChart3 className="w-16 h-16 opacity-10" />
          <p className="text-muted-foreground">Nenhum dado encontrado para o período selecionado.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ReportMetricCard title="Cliques" value={stats.totalClicks.toLocaleString('pt-BR')} icon={<MousePointer2 className="text-primary" />} />
            <ReportMetricCard title="Impressões" value={stats.totalImpressions.toLocaleString('pt-BR')} icon={<Eye className="text-accent" />} />
            <ReportMetricCard title="Conversões" value={stats.totalConversions.toLocaleString('pt-BR')} icon={<Target className="text-green-500" />} />
            <ReportMetricCard title="Total Investido" value={`R$ ${stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<TrendingUp className="text-primary" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 glass border-white/5">
              <CardHeader><CardTitle className="font-headline">Fluxo de Investimento Mensal</CardTitle></CardHeader>
              <CardContent className="h-[400px] pt-4">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={stats.monthlyData}>
                    <defs>
                      <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="spent" name="Investido" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorSpent)" />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="glass border-white/5">
              <CardHeader><CardTitle className="font-headline">Redes Sociais</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center">
                {stats.performanceByPlatform.length > 0 ? (
                  <>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie data={stats.performanceByPlatform} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {stats.performanceByPlatform.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full space-y-3 mt-4">
                      {stats.performanceByPlatform.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="font-bold">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-xs">Nenhuma plataforma ativa.</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="glass border-white/5 bg-primary/5 relative overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6 text-primary">
                <Sparkles className="w-7 h-7 fill-primary/20" />
                <h3 className="text-2xl font-bold font-headline">Otimização Orion AI</h3>
              </div>
              
              {!aiAnalysis ? (
                <div className="space-y-6">
                  <p className="text-muted-foreground max-w-2xl leading-relaxed">Clique abaixo para analisar os dados filtrados e gerar um diagnóstico de escala automatizado.</p>
                  <Button onClick={handleScaleCampaigns} disabled={isScaling} className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-10 rounded-full shadow-lg">
                    {isScaling ? <Loader2 className="animate-spin mr-2" /> : <Rocket className="mr-2 w-4 h-4" />}
                    Analisar Performance Real
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Diagnóstico da IA</h4>
                      <p className="text-sm leading-relaxed text-foreground bg-white/5 p-4 rounded-xl border border-white/5">{aiAnalysis.analysis}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <Card className="bg-card border-primary/20 p-6 text-center">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Líder de Performance</div>
                      <div className="text-2xl font-bold text-primary">{aiAnalysis.bestPlatform}</div>
                    </Card>
                    <Button variant="outline" onClick={() => setAiAnalysis(null)} className="w-full border-white/10">Nova Análise</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ReportMetricCard({ title, value, icon }: any) {
  return (
    <Card className="hover:border-primary/30 transition-all duration-300 bg-card/50">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-secondary rounded-lg">{icon}</div>
        </div>
        <div className="text-sm text-muted-foreground font-medium mb-1">{title}</div>
        <div className="text-2xl font-bold font-headline">{value}</div>
      </CardContent>
    </Card>
  );
}
