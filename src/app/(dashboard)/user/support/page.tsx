
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Send,
  HelpCircle,
  History,
  MessageCircle,
  Calendar,
  Trash2,
  X
} from 'lucide-react';
import { useCollection, useFirestore, useUser, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export default function UserSupportPage() {
  const db = useFirestore();
  const { user } = useUser();
  
  const userRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(userRef);

  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [period, setPeriod] = useState('all');
  const [lastSync, setLastSync] = useState(new Date());
  
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });

  const ticketsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'tickets'),
      where('userId', '==', user.uid)
    );
  }, [db, user]);

  const { data: rawTickets, loading: ticketsLoading } = useCollection(ticketsQuery);

  useEffect(() => {
    if (!ticketsLoading) setLastSync(new Date());
  }, [rawTickets, ticketsLoading]);

  const tickets = useMemo(() => {
    let list = [...rawTickets];

    if (period !== 'all') {
      const now = new Date();
      let start = subDays(now, 3650);
      if (period === '7d') start = startOfDay(subDays(now, 7));
      if (period === '30d') start = startOfDay(subDays(now, 30));
      
      const interval = { start, end: endOfDay(now) };
      list = list.filter(t => {
        if (!t.createdAt?.seconds) return false;
        const tDate = new Date(t.createdAt.seconds * 1000);
        return isWithinInterval(tDate, interval);
      });
    }

    return list.sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [rawTickets, period]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !formData.subject || !formData.message) return;
    setLoading(true);

    const ticketData = {
      userId: user.uid,
      userName: profile?.displayName || user.displayName || user.email || 'Usuário Orion',
      subject: formData.subject,
      message: formData.message,
      priority: formData.priority,
      status: 'open',
      adminReply: '',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'tickets'), ticketData);
      
      await addDoc(collection(db, 'logs'), {
        userId: user.uid,
        action: 'SUPPORT_TICKET_CREATED',
        details: `Ticket aberto: ${formData.subject}`,
        type: 'info',
        createdAt: serverTimestamp()
      });

      toast({ title: "Ticket Aberto!", description: "Sua mensagem foi enviada para análise administrativa." });
      setFormData({ subject: '', message: '', priority: 'medium' });
      setIsDialogOpen(false);
      setLastSync(new Date());
    } catch (err: any) {
      toast({ title: "Erro ao Enviar", description: "Ocorreu uma falha na conexão com a central.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!db) return;
    if (confirm("Deseja remover este chamado do seu histórico?")) {
      try {
        await deleteDoc(doc(db, 'tickets', id));
        toast({ title: "Chamado removido com sucesso" });
        setLastSync(new Date());
      } catch (err) {
        toast({ title: "Erro ao remover", variant: "destructive" });
      }
    }
  };

  const handleDeleteAllTickets = async () => {
    if (!db || !user || tickets.length === 0) return;
    if (confirm(`Deseja remover TODOS os ${tickets.length} chamados exibidos no período atual?`)) {
      setLoading(true);
      try {
        const batch = writeBatch(db);
        tickets.forEach(t => {
          batch.delete(doc(db, 'tickets', t.id));
        });
        await batch.commit();
        toast({ title: "Histórico de chamados limpo com sucesso" });
        setLastSync(new Date());
      } catch (err) {
        toast({ title: "Erro ao limpar histórico", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
  };

  if (ticketsLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando Atendimento...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold flex items-center gap-3">
            <MessageSquare className="text-primary w-8 h-8" />
            Central de Ajuda
          </h2>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             Live Support • Atualizado às {format(lastSync, 'HH:mm:ss')}
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-8 rounded-full shadow-lg">
                <PlusCircle className="mr-2 w-5 h-5" /> Novo Chamado
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-headline text-xl text-primary">Novo Ticket de Suporte</DialogTitle>
                <DialogDescription>Descreva seu problema para que nossa equipe técnica possa atuar.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTicket} className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-primary">Assunto do Chamado</Label>
                  <Input 
                    placeholder="Ex: Dúvida sobre faturamento ou orquestração" 
                    value={formData.subject} 
                    onChange={e => setFormData({...formData, subject: e.target.value})} 
                    className="bg-white border-slate-200 h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-primary">Nível de Urgência</Label>
                  <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                    <SelectTrigger className="bg-white border-slate-200 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="low">Baixa - Dúvida técnica</SelectItem>
                      <SelectItem value="medium">Média - Erro na plataforma</SelectItem>
                      <SelectItem value="high">Alta - Urgência financeira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-primary">Mensagem Detalhada</Label>
                  <Textarea 
                    placeholder="Explique detalhadamente sua dúvida ou problema..." 
                    value={formData.message} 
                    onChange={e => setFormData({...formData, message: e.target.value})} 
                    className="min-h-[120px] bg-white border-slate-200 leading-relaxed"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 bg-primary text-white font-bold text-lg rounded-xl shadow-lg">
                  {loading ? <Loader2 className="animate-spin mr-2" /> : <><Send className="mr-2 w-4 h-4" /> Enviar Mensagem</>}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold font-headline flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Histórico de Chamados
            </h3>
            {tickets.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] uppercase font-bold text-red-500 hover:bg-red-50"
                onClick={handleDeleteAllTickets}
                disabled={loading}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Limpar Histórico
              </Button>
            )}
          </div>
          
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="bg-white border-slate-200 hover:border-primary/20 transition-all overflow-hidden group shadow-sm relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 hover:bg-red-50"
                onClick={() => handleDeleteTicket(ticket.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/30">
                <div className="flex justify-between items-start mr-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{ticket.subject}</span>
                      <Badge variant="outline" className={`text-[9px] uppercase font-bold tracking-widest ${
                        ticket.status === 'open' ? 'border-red-500 text-red-500 bg-red-500/5 animate-pulse' :
                        ticket.status === 'resolved' ? 'border-green-500 text-green-500 bg-green-500/5' :
                        'border-primary text-primary bg-primary/5'
                      }`}>
                        {ticket.status === 'open' ? 'Aberto' : 'Resolvido'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ticket.createdAt?.seconds ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : 'Agora'}</span>
                      <span>•</span>
                      <span className="font-mono">ID: #{ticket.id.slice(0, 8)}</span>
                    </div>
                  </div>
                  {ticket.priority === 'high' && (
                    <Badge variant="destructive" className="text-[8px] uppercase font-bold shadow-lg shadow-red-500/20">Urgente</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                    Sua Solicitação:
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90 bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                    "{ticket.message}"
                  </p>
                </div>
                
                {ticket.adminReply && ticket.adminReply.trim().length > 0 ? (
                  <div className="p-5 bg-primary/5 border-l-4 border-primary rounded-r-xl space-y-3 animate-in slide-in-from-left-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                        <MessageCircle className="w-4 h-4" /> Resposta Orion AI Team
                      </div>
                      <div className="text-[9px] text-muted-foreground font-mono">
                        {ticket.updatedAt?.seconds ? new Date(ticket.updatedAt.seconds * 1000).toLocaleString('pt-BR') : '-'}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed italic">
                      "{ticket.adminReply}"
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[10px] text-primary/60 font-bold uppercase tracking-widest px-4 py-4 bg-primary/5 rounded-xl border border-primary/10">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Aguardando análise da equipe técnica...
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {tickets.length === 0 && !ticketsLoading && (
            <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl border border-slate-100">
                <HelpCircle className="w-10 h-10 text-slate-200" />
              </div>
              <div className="max-w-xs mx-auto space-y-2">
                <h4 className="font-bold text-lg">Sem histórico</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">Você ainda não abriu nenhum chamado de suporte ou não há chamados no período selecionado.</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20 overflow-hidden relative shadow-none">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
            <CardHeader>
              <CardTitle className="text-lg font-headline">Status da Infraestrutura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusIndicator label="Central de Suporte" status="online" />
              <StatusIndicator label="Rede de Orquestração" status="online" />
              <StatusIndicator label="Processador Mercado Pago" status="online" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusIndicator({ label, status }: { label: string, status: 'online' | 'warning' | 'offline' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-primary/5 last:border-0">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-green-500 tracking-widest">Operacional</span>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </div>
    </div>
  );
}
