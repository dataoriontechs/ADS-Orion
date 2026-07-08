
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Rocket, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Play, 
  Pause, 
  Trash2, 
  MoreVertical, 
  Loader2,
  ExternalLink,
  Target,
  BarChart2,
  Save,
  Globe,
  User,
  Settings2,
  ChevronRight,
  Plus,
  MapPin,
  Tag,
  History as HistoryIcon,
  Info,
  Clock,
  Activity,
  Calendar,
  Zap,
  TrendingUp,
  MousePointer2,
  Heart,
  Share2,
  MessageCircle,
  Upload,
  Download,
  Bookmark,
  X,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Twitter
} from 'lucide-react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc, updateDoc, serverTimestamp, query, orderBy, addDoc, getDoc, setDoc, getDocs, arrayUnion } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function AdminCampaignsPage() {
  const db = useFirestore();
  const { user: adminUser } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('all');
  const [lastSync, setLastSync] = useState(new Date());
  
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [advertiser, setAdvertiser] = useState<any>(null);

  const [activateData, setActivateData] = useState({
    platform: '',
    externalId: '',
    externalLink: '',
    notes: ''
  });

  const [dailyMetrics, setDailyMetrics] = useState<Record<string, any>>({});

  useEffect(() => {
    async function checkRole() {
      if (adminUser && db) {
        const userDoc = await getDoc(doc(db, 'users', adminUser.uid));
        if (userDoc.exists() && userDoc.data().role?.toUpperCase() === 'ADMIN') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.push('/user');
        }
      }
    }
    if (adminUser) checkRole();
  }, [adminUser, db, router]);

  const campaignsQuery = useMemo(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
  }, [db, isAdmin]);

  const { data: rawCampaigns, loading } = useCollection(campaignsQuery);

  useEffect(() => {
    if (!loading) setLastSync(new Date());
  }, [rawCampaigns, loading]);

  const filteredCampaigns = useMemo(() => {
    let list = rawCampaigns.filter(c => 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.internalStatus?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (period !== 'all') {
      const now = new Date();
      let start = subDays(now, 3650);
      if (period === '7d') start = startOfDay(subDays(now, 7));
      if (period === '30d') start = startOfDay(subDays(now, 30));
      
      list = list.filter(c => {
        if (!c.createdAt?.seconds) return false;
        const cDate = new Date(c.createdAt.seconds * 1000);
        return isWithinInterval(cDate, { start, end: endOfDay(now) });
      });
    }

    return list;
  }, [rawCampaigns, searchTerm, period]);

  const handleUpdateStatus = (id: string, userStatus: string, internalStatus: string, logMsg: string) => {
    if (!db || !adminUser) return;
    setSaving(true);
    
    const campRef = doc(db, 'campaigns', id);
    const data = { 
      status: userStatus,
      internalStatus: internalStatus,
      updatedAt: serverTimestamp(),
      history: arrayUnion({
        type: 'status_change',
        date: new Date().toISOString(),
        user: adminUser.displayName || adminUser.email,
        details: logMsg
      })
    };

    updateDoc(campRef, data).then(() => {
      setLastSync(new Date());
      setSaving(false);
      toast({ title: "Status Atualizado" });
    });
  };

  const handleActivateManual = () => {
    if (!db || !editingCampaign || !adminUser) return;
    setSaving(true);

    const campRef = doc(db, 'campaigns', editingCampaign.id);
    const data = {
      status: 'Ativa',
      internalStatus: 'Em monitoramento',
      internalData: {
        ...activateData,
        publishedBy: adminUser.displayName || adminUser.email,
        publishedAt: new Date().toISOString()
      },
      updatedAt: serverTimestamp(),
      history: arrayUnion({
        type: 'publication',
        date: new Date().toISOString(),
        user: adminUser.displayName || adminUser.email,
        details: `Campanha ativada na plataforma ${activateData.platform}. ID: ${activateData.externalId}`
      })
    };

    updateDoc(campRef, data).then(() => {
      setLastSync(new Date());
      setIsActivateOpen(false);
      setActivateData({ platform: '', externalId: '', externalLink: '', notes: '' });
      toast({ title: "🚀 Campanha em Monitoramento!" });
      setSaving(false);
    });
  };

  const openDetails = async (campaign: any) => {
    setEditingCampaign(campaign);
    setIsDetailsOpen(true);
    if (db && campaign.userId) {
      const userSnap = await getDoc(doc(db, 'users', campaign.userId));
      if (userSnap.exists()) setAdvertiser(userSnap.data());
    }
  };

  const openMetrics = async (campaign: any) => {
    setEditingCampaign(campaign);
    setIsMetricsOpen(true);
    if (!db) return;
    const platforms = campaign.platforms || [];
    const metrics: any = {};
    const promises = platforms.map((p: string) => getDoc(doc(db, 'campaigns', campaign.id, 'platform_metrics', p)));
    const snapshots = await Promise.all(promises);
    snapshots.forEach((mSnap, index) => {
      const p = platforms[index];
      metrics[p] = mSnap.exists() ? mSnap.data() : { impressions: 0, clicks: 0, conversions: 0, spent: 0 };
    });
    setDailyMetrics(metrics);
  };

  const handleSaveDailyMetrics = () => {
    if (!db || !editingCampaign || !adminUser) return;
    setSaving(true);
    const campaignRef = doc(db, 'campaigns', editingCampaign.id);
    let totalImpressions = 0, totalClicks = 0, totalConversions = 0, totalSpent = 0;

    const platforms = editingCampaign.platforms || [];

    const savePromises = platforms.map((platform: string) => {
      const platformRef = doc(db, 'campaigns', editingCampaign.id, 'platform_metrics', platform);
      const data = dailyMetrics[platform] || { impressions: 0, clicks: 0, conversions: 0, spent: 0 };
      
      totalImpressions += Number(data.impressions || 0);
      totalClicks += Number(data.clicks || 0);
      totalConversions += Number(data.conversions || 0);
      totalSpent += Number(data.spent || 0);

      return setDoc(platformRef, { 
        ...data, 
        platform, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
    });

    Promise.all(savePromises).then(() => {
      updateDoc(campaignRef, {
        metrics: { 
          impressions: totalImpressions, 
          clicks: totalClicks, 
          conversions: totalConversions, 
          spent: totalSpent, 
          updatedAt: new Date().toISOString() 
        },
        updatedAt: serverTimestamp()
      }).then(() => {
        setLastSync(new Date());
        toast({ title: "Métricas Atualizadas" });
        setIsMetricsOpen(false);
        setSaving(false);
      });
    });
  };

  const handleMetricChange = (platform: string, field: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setDailyMetrics(prev => ({
      ...prev,
      [platform]: {
        ...(prev[platform] || {}),
        [field]: numValue
      }
    }));
  };

  if (isAdmin === null || (isAdmin && loading)) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-sm text-muted-foreground">Carregando Fluxo Operacional...</p>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold">Central de Publicação & Monitoramento</h2>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
             Painel Operacional Ativo • Sync: {format(lastSync, 'HH:mm:ss')}
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar campanha ou anunciante..." 
                className="pl-10 bg-white border-slate-200" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-[10px] uppercase font-bold text-muted-foreground border-slate-100">
                  <TableHead>Campanha</TableHead>
                  <TableHead>Status Operacional</TableHead>
                  <TableHead>Lançamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((c) => (
                  <TableRow key={c.id} className="hover:bg-slate-50 border-slate-100">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                           <User className="w-2.5 h-2.5" /> {c.userId?.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[9px] uppercase font-bold ${
                        c.internalStatus?.includes('Aguardando') ? 'bg-yellow-500/10 text-yellow-500' :
                        c.internalStatus === 'Em monitoramento' ? 'bg-green-500/10 text-green-500 animate-pulse' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {c.internalStatus || 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs opacity-60">
                        {c.createdAt?.seconds ? format(new Date(c.createdAt.seconds * 1000), 'dd/MM/yy') : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => openDetails(c)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 bg-white border-slate-200 shadow-xl">
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openMetrics(c)}>
                              <TrendingUp className="w-4 h-4 text-green-500" /> Métricas Diárias
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => { setEditingCampaign(c); setIsActivateOpen(true); }}>
                              <Rocket className="w-4 h-4 text-blue-500" /> Confirmar Publicação
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 cursor-pointer text-yellow-600" onClick={() => handleUpdateStatus(c.id, 'Pausada', 'Aguardando pausa operacional', 'Pausada pelo admin')}>
                              <Pause className="w-4 h-4" /> Solicitar Pausa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Alertas Prioritários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {filteredCampaigns.filter(c => c.internalStatus?.includes('Aguardando')).map(c => (
               <div key={c.id} className="p-3 bg-white border border-slate-100 rounded-xl flex gap-3 items-start shadow-sm hover:border-primary/40 transition-all cursor-pointer" onClick={() => openDetails(c)}>
                  <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500"><Zap className="w-4 h-4" /></div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold">{c.name}</div>
                    <p className="text-[10px] text-muted-foreground uppercase">{c.internalStatus}</p>
                  </div>
               </div>
             ))}
             {filteredCampaigns.filter(c => c.internalStatus?.includes('Aguardando')).length === 0 && (
               <div className="text-center py-10 text-muted-foreground text-xs italic">Sem pendências críticas.</div>
             )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL DE MÉTRICAS */}
      <Dialog open={isMetricsOpen} onOpenChange={setIsMetricsOpen}>
        <DialogContent className="max-w-2xl bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
              <TrendingUp className="text-primary" /> Atualizar Métricas Reais
            </DialogTitle>
            <DialogDescription>Insira os dados coletados diretamente das plataformas para a campanha <strong>{editingCampaign?.name}</strong>.</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-8 py-4">
              {editingCampaign?.platforms?.map((p: string) => (
                <div key={p} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg border border-slate-100">
                      {p === 'facebook' && <Facebook className="w-4 h-4 text-blue-600" />}
                      {p === 'instagram' && <Instagram className="w-4 h-4 text-pink-500" />}
                      {p === 'google' && <Globe className="w-4 h-4 text-blue-400" />}
                      {p === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                      {p === 'tiktok' && <Zap className="w-4 h-4 text-black" />}
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest">{p}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Impressões</Label>
                      <Input 
                        type="number" 
                        value={dailyMetrics[p]?.impressions || 0} 
                        onChange={(e) => handleMetricChange(p, 'impressions', e.target.value)} 
                        className="h-10 bg-white" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Cliques</Label>
                      <Input 
                        type="number" 
                        value={dailyMetrics[p]?.clicks || 0} 
                        onChange={(e) => handleMetricChange(p, 'clicks', e.target.value)} 
                        className="h-10 bg-white" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Conversões</Label>
                      <Input 
                        type="number" 
                        value={dailyMetrics[p]?.conversions || 0} 
                        onChange={(e) => handleMetricChange(p, 'conversions', e.target.value)} 
                        className="h-10 bg-white" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Gasto (R$)</Label>
                      <Input 
                        type="number" 
                        value={dailyMetrics[p]?.spent || 0} 
                        onChange={(e) => handleMetricChange(p, 'spent', e.target.value)} 
                        className="h-10 bg-white" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsMetricsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveDailyMetrics} disabled={saving} className="bg-primary hover:bg-primary/90 text-white font-bold gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar métricas consolidadas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE DETALHES */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl flex items-center gap-2">
              <Eye className="text-primary" /> Visão Geral do Anunciante
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
             <div className="space-y-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-primary tracking-[0.2em]">Criativo e Copy</Label>
                        <h3 className="text-xl font-black mt-2 leading-tight">{editingCampaign?.name}</h3>
                        <p className="text-sm text-muted-foreground mt-4 italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                          "{editingCampaign?.description}"
                        </p>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-primary tracking-[0.2em]">Destino Final</Label>
                        <div className="flex items-center gap-2 mt-2">
                           <Globe className="w-4 h-4 text-muted-foreground" />
                           <a href={editingCampaign?.destinationUrl} target="_blank" className="text-xs text-blue-600 hover:underline truncate max-w-xs">{editingCampaign?.destinationUrl}</a>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="p-5 bg-primary/5 rounded-[2rem] border border-primary/10">
                        <Label className="text-[10px] uppercase font-bold text-primary">Budget Operacional</Label>
                        <div className="text-3xl font-black text-primary mt-2">R$ {editingCampaign?.budget?.toLocaleString('pt-BR')}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Poder Real: R$ {editingCampaign?.realBudget?.toLocaleString('pt-BR')}</div>
                      </div>

                      <div className="space-y-3">
                         <Label className="text-[10px] uppercase font-bold text-muted-foreground">Segmentação Estratégica</Label>
                         <div className="flex flex-wrap gap-2">
                            {editingCampaign?.targeting?.keywords?.map((k: string) => (
                              <Badge key={k} variant="outline" className="bg-white text-[10px]">{k}</Badge>
                            ))}
                            {editingCampaign?.platforms?.map((p: string) => (
                              <Badge key={p} className="bg-primary text-white text-[9px] uppercase">{p}</Badge>
                            ))}
                         </div>
                         <div className="text-xs text-muted-foreground flex items-center gap-2 mt-2">
                            <MapPin className="w-3.5 h-3.5" />
                            {editingCampaign?.targeting?.locationType === 'national' ? 'Todo o Brasil' : 'Estados Selecionados'}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                   <Label className="text-[10px] uppercase font-bold text-muted-foreground block mb-4">Informações do Anunciante</Label>
                   <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {advertiser?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{advertiser?.name || 'Usuário Orion'}</div>
                        <div className="text-xs text-muted-foreground">{advertiser?.email}</div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Saldo em Conta</div>
                        <div className="text-sm font-bold text-green-600">R$ {advertiser?.balance?.toLocaleString('pt-BR')}</div>
                      </div>
                   </div>
                </div>
             </div>
          </ScrollArea>

          <DialogFooter>
            <Button className="w-full bg-slate-900 text-white font-bold h-12 rounded-xl" onClick={() => setIsDetailsOpen(false)}>Fechar Visualização</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE ATIVAÇÃO MANUAL */}
      <Dialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
              <Rocket className="text-blue-500" /> Confirmar Publicação
            </DialogTitle>
            <DialogDescription>Vincule os dados da plataforma externa para que o usuário acompanhe o status real.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label>Plataforma Utilizada</Label>
                <Select value={activateData.platform} onValueChange={v => setActivateData({...activateData, platform: v})}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {editingCampaign?.platforms?.map((p: string) => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label>ID Externo (Campaign ID)</Label>
                <Input 
                  placeholder="Ex: act_123456789" 
                  value={activateData.externalId} 
                  onChange={e => setActivateData({...activateData, externalId: e.target.value})} 
                  className="bg-white"
                />
             </div>
             <div className="space-y-2">
                <Label>Link Direto do Anúncio (Opcional)</Label>
                <Input 
                  placeholder="https://adsmanager.facebook.com/..." 
                  value={activateData.externalLink} 
                  onChange={e => setActivateData({...activateData, externalLink: e.target.value})} 
                  className="bg-white"
                />
             </div>
             <div className="space-y-2">
                <Label>Notas Internas</Label>
                <Textarea 
                  placeholder="Observações sobre a segmentação ou criativo..." 
                  value={activateData.notes} 
                  onChange={e => setActivateData({...activateData, notes: e.target.value})} 
                  className="bg-white min-h-[80px]"
                />
             </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsActivateOpen(false)}>Cancelar</Button>
            <Button onClick={handleActivateManual} disabled={saving || !activateData.platform || !activateData.externalId} className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 h-11 px-8 rounded-xl shadow-lg">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Ativar e Notificar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
