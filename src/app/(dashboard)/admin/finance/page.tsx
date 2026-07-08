
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Download,
  TrendingUp,
  Settings,
  CreditCard,
  Loader2,
  PieChart as PieIcon,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Save,
  DollarSign,
  Zap,
  Rocket,
  CheckCircle2,
  User,
  Calendar
} from 'lucide-react';
import { useCollection, useFirestore, useUser, useDoc } from '@/firebase';
import { collection, query, limit, collectionGroup, getDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export default function AdminFinancePage() {
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [period, setPeriod] = useState('all');
  const [lastSync, setLastSync] = useState(new Date());
  const [savingSettings, setSavingSettings] = useState(false);
  const [minDeposit, setMinDeposit] = useState('10,00');

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

  const transactionsQuery = useMemo(() => {
    if (!db || isAdmin !== true) return null;
    return query(collectionGroup(db, 'transactions'), limit(500));
  }, [db, isAdmin]);

  const campaignsQuery = useMemo(() => {
    if (!db || isAdmin !== true) return null;
    return query(collection(db, 'campaigns'));
  }, [db, isAdmin]);

  const usersQuery = useMemo(() => {
    if (!db || isAdmin !== true) return null;
    return query(collection(db, 'users'));
  }, [db, isAdmin]);

  const { data: rawTransactions, loading: txLoading } = useCollection(transactionsQuery);
  const { data: rawCampaigns, loading: campLoading } = useCollection(campaignsQuery);
  const { data: users, loading: usersLoading } = useCollection(usersQuery);

  useEffect(() => {
    if (!txLoading && !campLoading) setLastSync(new Date());
  }, [rawTransactions, rawCampaigns, txLoading, campLoading]);

  const stats = useMemo(() => {
    let txs = [...(rawTransactions || [])];
    let campaigns = [...(rawCampaigns || [])];

    if (period !== 'all') {
      const now = new Date();
      let start = subDays(now, 3650);
      if (period === '7d') start = startOfDay(subDays(now, 7));
      if (period === '30d') start = startOfDay(subDays(now, 30));
      
      const interval = { start, end: endOfDay(now) };
      txs = txs.filter(t => t.createdAt?.seconds && isWithinInterval(new Date(t.createdAt.seconds * 1000), interval));
      campaigns = campaigns.filter(c => c.createdAt?.seconds && isWithinInterval(new Date(c.createdAt.seconds * 1000), interval));
    }

    const totalDeposited = txs
      .filter(t => t.type === 'in' && t.status === 'approved')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    
    const totalSpentInAds = campaigns.reduce((acc, c) => acc + (c.metrics?.spent || 0), 0);
    const platformRevenue = totalDeposited * 0.15;

    return {
      totalDeposited,
      totalSpentInAds,
      platformRevenue,
      activeCampaigns: campaigns.filter(c => c.status === 'Ativa' || c.status === 'Em veiculação').length,
      finishedCampaigns: campaigns.filter(c => c.status === 'Finalizada').length,
      activeUsers: (users || []).length,
      txs
    };
  }, [rawTransactions, rawCampaigns, users, period]);

  const formatCurrencyMask = (val: string) => {
    let cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) return "0,00";
    const numericVal = (Number(cleanVal) / 100);
    return numericVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSaveMinDeposit = async () => {
    if (!db || !user || !isAdmin) return;
    setSavingSettings(true);
    const numericMin = Number(minDeposit.replace(/\./g, "").replace(",", "."));
    await setDoc(doc(db, 'settings', 'finance'), { minDeposit: numericMin, updatedAt: serverTimestamp() }, { merge: true });
    setLastSync(new Date());
    toast({ title: "Regra Atualizada" });
    setSavingSettings(false);
  };

  if (isAdmin === null || (isAdmin && (txLoading || campLoading || usersLoading))) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-sm text-muted-foreground">Consolidando ecossistema financeiro...</p>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold text-primary">Fluxo de Caixa Global</h2>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
             Auditoria em tempo real • Atualizado às {format(lastSync, 'HH:mm:ss')}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] bg-white border-slate-200 h-11 rounded-xl shadow-sm">
              <Calendar className="w-4 h-4 mr-2 opacity-40" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Histórico Total</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Valor Recebido (Bruto)" value={`R$ ${stats.totalDeposited.toLocaleString('pt-BR')}`} icon={<ArrowUpRight className="text-green-500" />} subtitle={`Recargas no período (${period})`} />
        <MetricCard title="Investido em Anúncios" value={`R$ ${stats.totalSpentInAds.toLocaleString('pt-BR')}`} icon={<Zap className="text-primary" />} subtitle="Consumo real em plataformas" />
        <MetricCard title="Receita ADS Orion" value={`R$ ${stats.platformRevenue.toLocaleString('pt-BR')}`} icon={<TrendingUp className="text-accent" />} subtitle="Margem de serviço (15%)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-card/50 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline">Movimentações ({stats.txs.length})</CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input placeholder="Filtrar..." className="pl-8 h-8 bg-white/5 text-xs" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="border-white/5">
                <TableRow className="text-[10px] uppercase font-bold text-muted-foreground border-white/5">
                  <TableHead>Membro</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.txs.slice(0, 50).map((t: any) => (
                  <TableRow key={t.id} className="hover:bg-white/5 border-white/5 transition-colors">
                    <TableCell className="text-xs font-medium">{t.userId?.slice(0, 8) || 'Desconhecido'}...</TableCell>
                    <TableCell className={`text-xs font-bold ${t.type === 'in' ? 'text-green-500' : 'text-foreground'}`}>
                      {t.type === 'in' ? '+' : '-'} R$ {t.amount?.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-[10px] font-mono opacity-60">
                       {t.createdAt?.seconds ? format(new Date(t.createdAt.seconds * 1000), 'dd/MM HH:mm') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={`text-[8px] uppercase ${t.status === 'approved' ? 'border-green-500 text-green-500' : 'border-blue-500 text-blue-500'}`}>
                        {t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Parâmetros de Rede</CardTitle>
            <CardDescription>Configurações globais de faturamento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Mínimo p/ Depósito (R$)</Label>
              <Input value={minDeposit} onChange={e => setMinDeposit(formatCurrencyMask(e.target.value))} className="h-12 text-xl font-bold bg-background" />
            </div>
            <Button onClick={handleSaveMinDeposit} disabled={savingSettings} className="w-full h-11 bg-primary font-bold">
              {savingSettings ? <Loader2 className="animate-spin" /> : 'Atualizar Regra'}
            </Button>
            <div className="pt-6 border-t border-primary/10">
              <div className="flex justify-between text-xs mb-2"><span>Taxa Orion</span> <span className="font-bold">15%</span></div>
              <div className="h-1.5 w-full bg-white/5 rounded-full"><div className="h-full bg-primary w-[15%]" /></div>
              <p className="text-[9px] text-muted-foreground mt-3 italic">Taxa aplicada sobre todo volume para orquestração e IA.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, subtitle }: any) {
  return (
    <Card className="bg-card/50 border-white/5 hover:border-primary/30 transition-all overflow-hidden relative group">
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-secondary rounded-lg group-hover:scale-110 transition-transform">{icon}</div>
        </div>
        <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">{title}</div>
        <div className="text-2xl font-bold font-headline">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-1 font-medium">{subtitle}</div>
      </CardContent>
    </Card>
  );
}
