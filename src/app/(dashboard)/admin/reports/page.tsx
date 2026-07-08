
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Rocket, 
  Download, 
  Target, 
  Eye, 
  MousePointer2, 
  Globe,
  Loader2,
  PieChart as PieChartIcon,
  ArrowUpRight,
  Calendar,
  Clock
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
  PieChart as RechartsPieChart,
  Bar,
  BarChart
} from 'recharts';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const chartConfig = {
  investimento: { label: "Investimento Global (R$)", color: "hsl(var(--primary))" }
} satisfies ChartConfig;

export default function AdminReportsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [period, setPeriod] = useState('all');
  const [lastSync, setLastSync] = useState(new Date());

  useEffect(() => {
    async function checkRole() {
      if (user && db) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role?.toUpperCase() === 'ADMIN') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.push('/user');
        }
      }
    }
    if (user) checkRole();
  }, [user, db, router]);

  const campaignsQuery = useMemo(() => (db && isAdmin) ? query(collection(db, 'campaigns'), orderBy('createdAt', 'desc')) : null, [db, isAdmin]);
  const usersQuery = useMemo(() => (db && isAdmin) ? query(collection(db, 'users'), orderBy('createdAt', 'desc')) : null, [db, isAdmin]);

  const { data: rawCampaigns, loading: campLoading } = useCollection(campaignsQuery);
  const { data: allUsers, loading: userLoading } = useCollection(usersQuery);

  useEffect(() => {
    if (!campLoading && !userLoading) setLastSync(new Date());
  }, [rawCampaigns, allUsers, campLoading, userLoading]);

  const stats = useMemo(() => {
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

    const platformStats: Record<string, number> = {};
    campaigns.forEach(c => {
      c.platforms?.forEach((p: string) => {
        platformStats[p] = (platformStats[p] || 0) + (c.budget || 0);
      });
    });

    const pieData = Object.entries(platformStats).map(([name, spent], index) => ({
      name: name.toUpperCase(),
      value: spent,
      color: index === 0 ? 'hsl(var(--primary))' : index === 1 ? 'hsl(var(--accent))' : '#22c55e'
    }));

    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    const dailyMap: Record<string, number> = {};
    campaigns.forEach(c => {
      if (c.createdAt?.seconds) {
        const day = days[new Date(c.createdAt.seconds * 1000).getDay()];
        dailyMap[day] = (dailyMap[day] || 0) + (c.budget || 0);
      }
    });

    const trendData = days.map(day => ({ day, investimento: dailyMap[day] || 0 }));

    return {
      totalSpent,
      totalClicks,
      totalImpressions,
      totalConversions,
      pieData,
      trendData,
      avgCpc: totalClicks > 0 ? (totalSpent / totalClicks) : 0,
      campaigns
    };
  }, [rawCampaigns, period]);

  if (isAdmin === null || (isAdmin && (campLoading || userLoading))) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-sm text-muted-foreground">Consolidando rede global...</p>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold">Analytics da Rede</h2>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
             Global Intelligence • Última Carga: {format(lastSync, 'HH:mm:ss')}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] bg-white border-slate-200 h-11 rounded-xl shadow-sm">
              <Calendar className="w-4 h-4 mr-2 opacity-40" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo Histórico</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-white/5 bg-card gap-2">
            <Download className="w-4 h-4" /> Global CSV
          </Button>
        </div>
      </div>

      {!stats ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
          <PieChartIcon className="w-16 h-16 opacity-10" />
          <p className="text-muted-foreground">Sem dados para o período.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <AdminStatCard title="Volume Investido" value={`R$ ${stats.totalSpent.toLocaleString('pt-BR')}`} icon={<TrendingUp className="text-primary" />} trend={`No período: ${period}`} />
            <AdminStatCard title="Audiência Impactada" value={stats.totalImpressions.toLocaleString('pt-BR')} icon={<Eye className="text-accent" />} trend="Impressões Reais" />
            <AdminStatCard title="Engajamento" value={stats.totalClicks.toLocaleString('pt-BR')} icon={<MousePointer2 className="text-green-500" />} trend="Cliques Brutos" />
            <AdminStatCard title="CPC Médio" value={`R$ ${stats.avgCpc.toFixed(2)}`} icon={<Target className="text-primary" />} trend="Média da Rede" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 glass border-white/5">
              <CardHeader><CardTitle className="font-headline">Tendência Semanal de Investimento</CardTitle></CardHeader>
              <CardContent className="h-[350px]">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={stats.trendData}>
                    <defs>
                      <linearGradient id="colorAdminInvest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="investimento" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAdminInvest)" />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="glass border-white/5">
              <CardHeader><CardTitle className="font-headline">Market Share Plataformas</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {stats.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-3 mt-4">
                  {stats.pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold">R$ {item.value.toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function AdminStatCard({ title, value, icon, trend }: any) {
  return (
    <Card className="bg-card/50 border-white/5 hover:border-primary/20 transition-all group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-secondary rounded-lg group-hover:scale-110 transition-transform">{icon}</div>
          <Badge variant="outline" className="text-[8px] border-primary/20 text-primary">LIVE</Badge>
        </div>
        <div className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-tight">{title}</div>
        <div className="text-2xl font-bold font-headline">{value}</div>
        <div className="text-[10px] text-primary font-bold mt-2 uppercase tracking-widest">{trend}</div>
      </CardContent>
    </Card>
  );
}
