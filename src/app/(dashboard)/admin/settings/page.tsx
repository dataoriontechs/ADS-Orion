'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Wallet, 
  Save, 
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  CreditCard,
  Zap,
  Globe,
  TestTube
} from 'lucide-react';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminSettingsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [minDeposit, setMinDeposit] = useState('10,00');

  const [mpSettings, setMpSettings] = useState({
    environment: 'sandbox',
    liveAccessToken: '',
    livePublicKey: '',
    testAccessToken: '',
    testPublicKey: '',
  });

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

  const financeRef = useMemo(() => (db && isAdmin === true ? doc(db, 'settings', 'finance') : null), [db, isAdmin]);
  const mpRef = useMemo(() => (db && isAdmin === true ? doc(db, 'settings', 'mercadopago') : null), [db, isAdmin]);

  const { data: financeSettings, loading: fLoading } = useDoc(financeRef);
  const { data: dbMpSettings, loading: mLoading } = useDoc(mpRef);

  useEffect(() => {
    if (financeSettings?.minDeposit) {
      setMinDeposit(financeSettings.minDeposit.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    }
    if (dbMpSettings) {
      setMpSettings({
        environment: dbMpSettings.environment || 'sandbox',
        liveAccessToken: dbMpSettings.liveAccessToken || '',
        livePublicKey: dbMpSettings.livePublicKey || '',
        testAccessToken: dbMpSettings.testAccessToken || '',
        testPublicKey: dbMpSettings.testPublicKey || '',
      });
    }
  }, [financeSettings, dbMpSettings]);

  const formatCurrencyMask = (val: string) => {
    let cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) return "0,00";
    const numericVal = (Number(cleanVal) / 100);
    return numericVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSaveFinance = async () => {
    if (!db || !user || !isAdmin) return;
    setLoading(true);
    const numericMin = Number(minDeposit.replace(/\./g, "").replace(",", "."));
    await setDoc(doc(db, 'settings', 'finance'), { minDeposit: numericMin, updatedAt: serverTimestamp() }, { merge: true });
    toast({ title: "Configurações Financeiras Salvas" });
    setLoading(false);
  };

  const handleSaveMP = async () => {
    if (!db || !user || !isAdmin) return;
    setLoading(true);
    await setDoc(doc(db, 'settings', 'mercadopago'), { ...mpSettings, updatedAt: serverTimestamp() }, { merge: true });
    toast({ title: "Módulo Mercado Pago Atualizado para Produção" });
    setLoading(false);
  };

  if (isAdmin === null || (isAdmin && (fLoading || mLoading))) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-sm text-muted-foreground">Sincronizando núcleo de comando...</p>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-headline font-bold flex items-center gap-3 text-primary">
          <Settings className="w-8 h-8" />
          Configurações da Rede
        </h2>
        <p className="text-muted-foreground">Gerencie parâmetros globais de funcionamento da Orion.</p>
      </div>

      <Tabs defaultValue="finance" className="space-y-6">
        <TabsList className="bg-card border border-white/5 p-1 h-12">
          <TabsTrigger value="finance" className="gap-2 px-6"><Wallet className="w-4 h-4" /> Financeiro</TabsTrigger>
          <TabsTrigger value="mercadopago" className="gap-2 px-6"><CreditCard className="w-4 h-4" /> Mercado Pago</TabsTrigger>
        </TabsList>

        <TabsContent value="finance">
          <Card className="bg-card/50 border-white/5">
            <CardHeader>
              <CardTitle className="font-headline">Regras de Depósito</CardTitle>
              <CardDescription>Defina o valor mínimo permitido para recargas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Valor Mínimo (R$)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
                  <Input type="text" value={minDeposit} onChange={e => setMinDeposit(formatCurrencyMask(e.target.value))} className="h-14 pl-12 text-xl font-bold bg-white/5 border-primary/20" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-white/5 pt-6">
              <Button onClick={handleSaveFinance} disabled={loading} className="w-full h-12 bg-primary font-bold gap-2">
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                Salvar Regras Financeiras
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="mercadopago">
          <Card className="bg-card/50 border-white/5">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">Integração Checkout Pro (V4.0)</CardTitle>
              <CardDescription>Gerencie as chaves oficiais para operação em produção.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold">
                    {mpSettings.environment === 'production' ? <Globe className="text-green-500 w-4 h-4" /> : <TestTube className="text-blue-500 w-4 h-4" />}
                    Ambiente Atual: <span className="uppercase">{mpSettings.environment}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">O modo Produção exige chaves APP_USR.</p>
                </div>
                <Switch 
                  checked={mpSettings.environment === 'production'} 
                  onCheckedChange={(checked) => setMpSettings({...mpSettings, environment: checked ? 'production' : 'sandbox'})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase text-green-500 tracking-widest border-b border-green-500/10 pb-2">Credenciais Produção</h4>
                    <div className="space-y-2">
                      <Label className="text-xs">Live Public Key</Label>
                      <Input value={mpSettings.livePublicKey} onChange={e => setMpSettings({...mpSettings, livePublicKey: e.target.value})} className="bg-white/5 border-white/10" placeholder="APP_USR-..." />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Live Access Token</Label>
                      <Input type="password" value={mpSettings.liveAccessToken} onChange={e => setMpSettings({...mpSettings, liveAccessToken: e.target.value})} className="bg-white/5 border-white/10" placeholder="APP_USR-..." />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase text-blue-500 tracking-widest border-b border-blue-500/10 pb-2">Credenciais Sandbox</h4>
                    <div className="space-y-2">
                      <Label className="text-xs">Test Public Key</Label>
                      <Input value={mpSettings.testPublicKey} onChange={e => setMpSettings({...mpSettings, testPublicKey: e.target.value})} className="bg-white/5 border-white/10" placeholder="TEST-..." />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Test Access Token</Label>
                      <Input type="password" value={mpSettings.testAccessToken} onChange={e => setMpSettings({...mpSettings, testAccessToken: e.target.value})} className="bg-white/5 border-white/10" placeholder="TEST-..." />
                    </div>
                 </div>
              </div>

              <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong>Atenção:</strong> Ao ativar o ambiente de produção, certifique-se de que a conta vendedora concluiu a homologação no painel do Mercado Pago. O simulador de aprovação será desativado automaticamente.
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-white/5 pt-6">
              <Button onClick={handleSaveMP} disabled={loading} className="w-full h-12 bg-primary font-bold gap-2">
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                Salvar Configurações Produção
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
