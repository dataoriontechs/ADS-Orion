
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bell, 
  Send, 
  Users, 
  Search, 
  Trash2, 
  Clock, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Rocket,
  Wallet,
  Settings,
  Zap,
  XCircle,
  Megaphone,
} from 'lucide-react';
import { useCollection, useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc, getDoc, writeBatch, getDocs, where } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

const NOTIFICATION_TYPES = [
  { id: 'info', label: 'Informação', color: 'bg-blue-500', icon: <Info className="w-4 h-4" /> },
  { id: 'success', label: 'Sucesso', color: 'bg-green-500', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'warning', label: 'Aviso', color: 'bg-orange-500', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'error', label: 'Erro', color: 'bg-red-500', icon: <XCircle className="w-4 h-4" /> },
  { id: 'update', label: 'Atualização', color: 'bg-purple-500', icon: <Rocket className="w-4 h-4" /> },
  { id: 'finance', label: 'Financeiro', color: 'bg-yellow-500', icon: <Wallet className="w-4 h-4" /> },
  { id: 'campaigns', label: 'Campanhas', color: 'bg-primary', icon: <Megaphone className="w-4 h-4" /> },
  { id: 'system', label: 'Sistema', color: 'bg-slate-500', icon: <Settings className="w-4 h-4" /> },
  { id: 'promotion', label: 'Promoção', color: 'bg-pink-500', icon: <Zap className="w-4 h-4" /> },
];

export default function AdminNotificationsPage() {
  const db = useFirestore();
  const { user: adminUser } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target: 'all', // all, role_user, specific_users
    type: 'info',
    priority: 'low',
    selectedUserIds: [] as string[]
  });

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

  const { data: users } = useCollection(db ? collection(db, 'users') : null);
  const notificationsQuery = useMemo(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'notifications_master'), orderBy('createdAt', 'desc'));
  }, [db, isAdmin]);

  const { data: history, loading: historyLoading } = useCollection(notificationsQuery);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    ).slice(0, 10);
  }, [users, userSearch]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !adminUser || !formData.title || !formData.message) return;
    setLoading(true);

    try {
      // 1. Criar Registro Master para o Admin
      const masterRef = await addDoc(collection(db, 'notifications_master'), {
        ...formData,
        sentBy: adminUser.displayName || adminUser.email,
        createdAt: serverTimestamp(),
        status: 'sent'
      });

      // 2. Determinar Destinatários
      let targetUids: string[] = [];
      if (formData.target === 'all') {
        const allUsersSnap = await getDocs(collection(db, 'users'));
        targetUids = allUsersSnap.docs.map(d => d.id);
      } else if (formData.target === 'role_user') {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'USER')));
        targetUids = usersSnap.docs.map(d => d.id);
      } else {
        targetUids = formData.selectedUserIds;
      }

      // 3. Batch Delivery (Processar em lotes de 500 para escala)
      const batch = writeBatch(db);
      targetUids.forEach(uid => {
        const userNotifRef = doc(collection(db, 'users', uid, 'notifications'));
        batch.set(userNotifRef, {
          masterId: masterRef.id,
          title: formData.title,
          message: formData.message,
          type: formData.type,
          priority: formData.priority,
          read: false,
          deleted: false,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();

      toast({ title: "Notificação Orquestrada!", description: `${targetUids.length} usuários receberão o comunicado em tempo real.` });
      setFormData({ title: '', message: '', target: 'all', type: 'info', priority: 'low', selectedUserIds: [] });
    } catch (error) {
      console.error(error);
      toast({ title: "Falha na Entrega", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'notifications_master', id));
    toast({ title: "Removido do histórico master" });
  };

  if (isAdmin === null || (isAdmin && historyLoading)) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-sm text-muted-foreground">Sincronizando central de avisos...</p>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-headline font-bold">Central de Notificações</h2>
          <p className="text-muted-foreground">Comunicação direta e orquestração de avisos em tempo real.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white border-slate-200 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="font-headline">Nova Mensagem</CardTitle>
            <CardDescription>Defina o conteúdo e o público-alvo da notificação.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Destinatários</Label>
                  <Select value={formData.target} onValueChange={v => setFormData({...formData, target: v})}>
                    <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Usuários</SelectItem>
                      <SelectItem value="role_user">Apenas Membros (USER)</SelectItem>
                      <SelectItem value="specific_users">Usuários Selecionados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Conteúdo</Label>
                  <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                    <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TYPES.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${t.color}`} />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.target === 'specific_users' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in slide-in-from-top-2">
                  <Label className="text-[10px] uppercase font-bold text-primary">Buscar e Selecionar Usuários</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Nome ou e-mail..." 
                      className="pl-10 h-10 bg-white" 
                      value={userSearch} 
                      onChange={e => setUserSearch(e.target.value)} 
                    />
                  </div>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {filteredUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{u.name || 'Sem Nome'}</span>
                            <span className="text-[10px] text-muted-foreground">{u.email}</span>
                          </div>
                          <Checkbox 
                            checked={formData.selectedUserIds.includes(u.id)} 
                            onCheckedChange={(checked) => {
                              setFormData({
                                ...formData, 
                                selectedUserIds: checked 
                                  ? [...formData.selectedUserIds, u.id] 
                                  : formData.selectedUserIds.filter(id => id !== u.id)
                              });
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="text-[10px] font-medium text-muted-foreground">
                    {formData.selectedUserIds.length} selecionados
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Prioridade de Exibição</Label>
                <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Padrão (Apenas no sino)</SelectItem>
                    <SelectItem value="high">Alta (Travar tela com Modal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Título do Comunicado</Label>
                <Input 
                  placeholder="Ex: Atualização Programada do Orquestrador" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                  className="h-11 bg-white border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem Detalhada</Label>
                <Textarea 
                  placeholder="Descreva o aviso de forma clara e objetiva..." 
                  className="min-h-[120px] bg-white border-slate-200"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold gap-2 rounded-xl shadow-lg">
                {loading ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />}
                Disparar Notificação Agora
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Histórico de Disparos</CardTitle>
            <CardDescription>Acompanhe o que já foi enviado para a rede.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.map((n) => {
              const type = NOTIFICATION_TYPES.find(t => t.id === n.type);
              return (
                <div key={n.id} className="p-4 border border-slate-100 bg-slate-50/30 rounded-2xl group hover:border-primary/20 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg text-white ${type?.color}`}>
                        {type?.icon}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{n.title}</div>
                        <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                           <Users className="w-2.5 h-2.5" /> Destino: {n.target === 'all' ? 'Toda a Rede' : n.target}
                        </div>
                      </div>
                    </div>
                    {n.priority === 'high' && <Badge variant="destructive" className="text-[8px] animate-pulse">URGENTE</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">{n.message}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleString('pt-BR') : '-'}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteHistory(n.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {history.length === 0 && (
              <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-2">
                <Bell className="w-12 h-12 opacity-10" />
                <p className="text-sm">Nenhum disparo realizado ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
