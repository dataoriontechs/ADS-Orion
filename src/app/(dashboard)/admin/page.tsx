
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { doc, getDoc, collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Rocket, 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  Loader2,
  ArrowUpRight,
  Bell,
  Clock,
  History,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [period, setPeriod] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    async function checkRole() {
      if (user && db) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'ADMIN') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.push('/user');
        }
      }
    }
    if (!authLoading && user) checkRole();
    else if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, db, router]);

  const usersQuery = useMemo(() => (db && isAdmin) ? collection(db, 'users') : null, [db, isAdmin]);
  const campaignsQuery = useMemo(() => (db && isAdmin) ? collection(db, 'campaigns') : null, [db, isAdmin]);
  const logsQuery = useMemo(() => (db && isAdmin) ? query(collection(db, 'logs'), orderBy('createdAt', 'desc'), limit(10)) : null, [db, isAdmin]);
  
  const { data: allUsers, loading: usersLoading } = useCollection(usersQuery);
  const { data: allCampaigns, loading: campaignsLoading } = useCollection(campaignsQuery);
  const { data: recentLogs, loading: logsLoading } = useCollection(logsQuery);

  useEffect(() => {
    if (!campaignsLoading && !usersLoading) setLastUpdate(new Date());
  }, [allCampaigns, allUsers, campaignsLoading, usersLoading]);

  const stats = useMemo(() => {
    let campaigns = [...allCampaigns];
    
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

    const activeCampaigns = campaigns.filter(c => c.status === 'Ativa').length;
    const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
    const orionFees = totalBudget * 0.15;

    return {
      totalUsers: allUsers.length,
      activeCampaigns,
      grossRevenue: totalBudget,
      fees: orionFees
    };
  }, [allUsers, allCampaigns, period]);

  if (authLoading || isAdmin === null || (isAdmin && (usersLoading || campaignsLoading || logsLoading))) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
        <p className="text-sm text-muted-foreground animate-pulse">Carregando central de comando...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const operationalAlerts = allCampaigns.filter(c => c.internalStatus?.includes('Aguardando'));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold text-primary">Visão Global Admin</h2>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
             Monitoramento Ativo • Sync: {format(lastUpdate, 'HH:mm:ss')}
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] bg-white border-slate-200 h-10 rounded-xl">
              <Calendar className="w-4 h-4 mr-2 opacity-40" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Histórico Total</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 py-1.5 px-4 font-bold uppercase text-[10px]">
            <ShieldCheck className="w-3 h-3 mr-2" /> Núcleo Ativo
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Usuários Totais" value={stats.totalUsers} trend="Membros Reais" icon={<Users />} />
        <MetricCard title="Anúncios Ativos" value={stats.activeCampaigns} trend="Rodando agora" icon={<Rocket />} />
        <MetricCard title="Volume Total" value={`R$ ${stats.grossRevenue.toLocaleString('pt-BR')}`} trend="Investimento Bruto" icon={<Wallet />} />
        <MetricCard title="Taxas Geradas" value={`R$ ${stats.fees.toLocaleString('pt-BR')}`} trend="Receita Orion (15%)" icon={<TrendingUp />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass border-white/5">
          <CardHeader>
            <div className="flex items-center justify-between">
               <CardTitle className="font-headline flex items-center gap-2">
                 <Bell className="w-5 h-5 text-primary" />
                 Ações do Usuário (Central de Notificações)
               </CardTitle>
               {operationalAlerts.length > 0 && <Badge className="bg-red-500 animate-pulse">{operationalAlerts.length}</Badge>}
            </div>
            <CardDescription>Eventos que exigem execução manual nas plataformas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {operationalAlerts.map(c => (
                  <div key={c.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group hover:border-primary/30 transition-all">
                    <div className="space-y-1">
                       <div className="text-sm font-bold">{c.name}</div>
                       <Badge variant="secondary" className="text-[8px] uppercase">{c.internalStatus}</Badge>
                       <div className="text-[10px] text-muted-foreground">Usuário: {c.userId.slice(0, 8)}...</div>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 border-white/10" onClick={() => router.push('/admin/campaigns')}>
                       Resolver <ArrowUpRight className="w-3 h-3 ml-2" />
                    </Button>
                  </div>
                ))}
                {operationalAlerts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                    <CheckCircle2 className="w-10 h-10 opacity-10" />
                    <p className="text-sm font-medium">Nenhuma pendência operacional ativa.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
               <History className="w-5 h-5 text-primary" />
               Log de Auditoria Recente
            </CardTitle>
            <CardDescription>Registro cronológico de todas as modificações no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {recentLogs.map(log => (
                  <div key={log.id} className="p-3 border-b border-white/5 flex gap-4 items-start last:border-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      log.type === 'critical' ? 'bg-red-500/10 text-red-500' : 
                      log.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-primary/10 text-primary'
                    }`}>
                       <Clock className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold uppercase tracking-tighter">{log.action}</div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{log.details}</p>
                      <div className="text-[9px] font-mono opacity-40">{log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toLocaleString('pt-BR') : '-'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon }: any) {
  return (
    <Card className="bg-card/50 border-white/5 hover:border-primary/30 transition-all group">
      <CardContent className="p-6">
        <div className="flex justify-between mb-4">
          <div className="p-2 bg-secondary rounded-lg text-primary group-hover:scale-110 transition-transform">{icon}</div>
        </div>
        <div className="text-sm text-muted-foreground mb-1 font-medium">{title}</div>
        <div className="text-2xl font-bold font-headline">{value}</div>
        <div className="text-[10px] text-primary mt-2 font-bold uppercase tracking-wider">{trend}</div>
      </CardContent>
    </Card>
  );
}
