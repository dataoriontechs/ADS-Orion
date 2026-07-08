
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  MousePointer2, 
  Eye, 
  Wallet,
  Rocket,
  Loader2,
  PlusCircle,
  BarChart3,
  Target,
  Zap,
  Calendar,
  RefreshCw,
  Clock
} from 'lucide-react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  type ChartConfig 
} from '@/components/ui/chart';
import { 
  Area, 
  AreaChart,
  CartesianGrid, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Cell,
  Pie,
  PieChart as RechartsPieChart
} from 'recharts';
import { useUser, useCollection, useFirestore, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const chartConfig = {
  investimento: { label: "Performance (Cliques)", color: "hsl(var(--primary))" }
} satisfies ChartConfig;

export default function UserDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [period, setPeriod] = useState('all');
  const [lastSync, setLastSync] = useState(new Date());

  const userRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userRef);

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
    if (!rawCampaigns) return null;

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

    const totalInvestido = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
    const activeCount = campaigns.filter(c => c.status === 'Ativa').length;
    const balance = profile?.balance || 0;
    
    const totalClicks = campaigns.reduce((acc, c) => acc + (c.metrics?.clicks || 0), 0);
    const totalImpressions = campaigns.reduce((acc, c) => acc + (c.metrics?.impressions || 0), 0);
    const totalConversions = campaigns.reduce((acc, c) => acc + (c.metrics?.conversions || 0), 0);
    const totalSpentReal = campaigns.reduce((acc, c) => acc + (c.metrics?.spent || 0), 0);

    const dailyMap: Record<string, number> = {};
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    
    campaigns.forEach(c => {
      if (c.createdAt?.seconds) {
        const date = new Date(c.createdAt.seconds * 1000);
        const dayName = days[date.getDay()];
        dailyMap[dayName] = (dailyMap[dayName] || 0) + (c.metrics?.clicks || 0);
      }
    });

    const realChartData = days.map(day => ({
      day,
      investimento: dailyMap[day] || 0
    }));

    return {
      saldo: balance,
      totalInvestido,
      activeCount,
      cliques: totalClicks,
      impressoes: totalImpressions,
      conversoes: totalConversions,
      spentReal: totalSpentReal,
      chartData: realChartData,
      hasCampaigns: campaigns.length > 0
    };
  }, [rawCampaigns, profile, period]);

  if (authLoading || dataLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  const displayGreetingName = profile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Usuário';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold">Olá, {displayGreetingName}! 👋</h2>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             Orion Live Sync • Atualizado às {format(lastSync, 'HH:mm:ss')}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] bg-white border-slate-200 h-11 rounded-xl shadow-sm">
              <Calendar className="w-4 h-4 mr-2 opacity-40" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o histórico</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/user/campaigns/new">
            <Button className="bg-primary hover:bg-primary/90 rounded-full h-11 px-6 shadow-lg shadow-primary/20">
              <PlusCircle className="mr-2 w-5 h-5" /> Nova Campanha
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Saldo em Conta" value={`R$ ${stats?.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<Wallet className="text-green-500" />} subtitle="Créditos Orion" />
        <MetricCard title="Campanhas Ativas" value={stats?.activeCount || 0} icon={<Rocket className="text-primary" />} subtitle="Rodando agora" />
        <MetricCard title="Engajamento Real" value={stats?.cliques.toLocaleString('pt-BR') || 0} icon={<MousePointer2 className="text-accent" />} subtitle="Cliques Gerados" />
        <MetricCard title="Conversões" value={stats?.conversoes.toLocaleString('pt-BR') || 0} icon={<Target className="text-green-500" />} subtitle="Resultados Diretos" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Desempenho de Cliques ({period === 'all' ? 'Histórico' : period === '7d' ? '7 dias' : '30 dias'})
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats?.hasCampaigns ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="investimento" name="Cliques" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorInvest)" />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyState title="Sem histórico de performance" icon={<BarChart3 />} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-sm font-bold uppercase">Métricas Consolidadas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <StatRow label="Impressões Totais" value={stats?.impressoes.toLocaleString('pt-BR') || 0} icon={<Eye className="w-3 h-3" />} />
              <StatRow label="Investimento Real" value={`R$ ${stats?.spentReal.toLocaleString('pt-BR') || '0,00'}`} icon={<Zap className="w-3 h-3" />} />
              <div className="pt-4 border-t border-slate-100">
                <Link href="/user/reports">
                  <Button variant="outline" className="w-full text-xs font-bold border-slate-200">Ver Relatório Completo</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-primary">Status da Rede Orion</CardTitle></CardHeader>
            <CardContent>
               <div className="flex items-center justify-between">
                 <span className="text-[10px] font-medium text-slate-600">Orquestrador de Mídia</span>
                 <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-green-500 uppercase">Operacional</span>
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, icon }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon} {label}</div>
      <div className="font-bold text-sm">{value}</div>
    </div>
  );
}

function MetricCard({ title, value, icon, subtitle }: any) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm hover:border-primary/30 transition-all group">
      <CardContent className="p-5 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{title}</span>
          <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg group-hover:scale-110 transition-transform">{icon}</div>
        </div>
        <div className="text-2xl font-bold font-headline">{value}</div>
        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, icon }: { title: string, icon: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground gap-2">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-2">
        {icon}
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-[10px]">Lançar campanhas para ver dados reais aqui.</p>
    </div>
  );
}
