'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Search, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Loader2,
  Send,
  Trash2,
  Filter,
  MessageCircle
} from 'lucide-react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp, addDoc, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function AdminSupportPage() {
  const db = useFirestore();
  const { user: adminUser } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const ticketsQuery = useMemo(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
  }, [db, isAdmin]);

  const { data: tickets, loading: ticketsLoading } = useCollection(ticketsQuery);

  const filteredTickets = tickets.filter(t => 
    t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateStatus = async (id: string, status: string, subject: string) => {
    if (!db || !adminUser) return;
    
    updateDoc(doc(db, 'tickets', id), { 
      status: status,
      updatedAt: serverTimestamp() 
    })
      .then(() => {
        toast({ title: "Status Atualizado", description: `Ticket #${id.slice(0,5)} agora está ${status}.` });
        
        // Log da ação
        addDoc(collection(db, 'logs'), {
          userId: adminUser.uid,
          userName: adminUser.displayName || adminUser.email,
          action: 'TICKET_STATUS_CHANGE',
          details: `Administrador alterou status do ticket "${subject}" para ${status}.`,
          type: 'info',
          createdAt: serverTimestamp()
        });
      })
      .catch((err) => {
        const error = new FirestorePermissionError({
          path: `tickets/${id}`,
          operation: 'update',
          requestResourceData: { status }
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', error);
      });
  };

  const handleReply = async () => {
    if (!db || !selectedTicket || !replyMessage || !adminUser) return;
    setLoading(true);

    const updateData = {
      adminReply: replyMessage,
      status: 'resolved',
      updatedAt: serverTimestamp()
    };

    updateDoc(doc(db, 'tickets', selectedTicket.id), updateData)
      .then(() => {
        // Registro de Log de Auditoria
        addDoc(collection(db, 'logs'), {
          userId: adminUser.uid,
          userName: adminUser.displayName || adminUser.email,
          action: 'TICKET_REPLY',
          details: `Resposta enviada para o ticket "${selectedTicket.subject}" do usuário ${selectedTicket.userName}.`,
          type: 'info',
          createdAt: serverTimestamp()
        });

        toast({ title: "Resposta Enviada", description: "O usuário receberá a mensagem no painel dele." });
        setIsReplyOpen(false);
        setReplyMessage('');
        setSelectedTicket(null);
      })
      .catch((err) => {
        const error = new FirestorePermissionError({
          path: `tickets/${selectedTicket.id}`,
          operation: 'update',
          requestResourceData: updateData
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', error);
      })
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'tickets', id))
      .then(() => toast({ title: "Ticket excluído do banco" }))
      .catch(() => {
        const error = new FirestorePermissionError({ path: `tickets/${id}`, operation: 'delete' });
        errorEmitter.emit('permission-error', error);
      });
  };

  if (isAdmin === null || (isAdmin && ticketsLoading)) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-sm text-muted-foreground font-medium">Sincronizando central de chamados...</p>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Suporte ao Cliente</h2>
          <p className="text-muted-foreground">Gerencie tickets e responda usuários diretamente da base real.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            {tickets.filter(t => t.status === 'open').length} Pendentes Agora
          </Badge>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por assunto, usuário ou ID do chamado..." 
              className="pl-10 h-11 bg-white border-slate-200 shadow-sm" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <Button variant="outline" className="gap-2 border-slate-200 h-11 px-6">
            <Filter className="w-4 h-4" /> Filtros
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-5 border border-slate-100 bg-white rounded-2xl group hover:border-primary/30 transition-all shadow-sm">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                      {ticket.userName?.charAt(0) || <User className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{ticket.subject}</span>
                        <Badge variant="outline" className={`text-[8px] uppercase font-bold ${
                          ticket.status === 'open' ? 'border-red-500 text-red-500 bg-red-500/5 animate-pulse' :
                          ticket.status === 'resolved' ? 'border-green-500 text-green-500 bg-green-500/5' :
                          'border-primary text-primary bg-primary/5'
                        }`}>
                          {ticket.status === 'open' ? 'Aberto' : ticket.status === 'in_progress' ? 'Em Andamento' : ticket.status === 'resolved' ? 'Resolvido' : ticket.status}
                        </Badge>
                        {ticket.priority === 'high' && (
                          <Badge variant="destructive" className="text-[8px] uppercase font-bold px-1.5 py-0 text-white">URGENTE</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="font-medium text-slate-900">{ticket.userName}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">{ticket.userId}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ticket.createdAt?.seconds ? new Date(ticket.createdAt.seconds * 1000).toLocaleString('pt-BR') : '-'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-4 italic bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-3">
                        "{ticket.message}"
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-slate-200 hover:bg-primary hover:text-white gap-2 h-10 px-4"
                      onClick={() => { setSelectedTicket(ticket); setIsReplyOpen(true); }}
                    >
                      <MessageSquare className="w-4 h-4" /> Responder
                    </Button>
                    <Select onValueChange={(v) => handleUpdateStatus(ticket.id, v, ticket.subject)}>
                      <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 text-xs">
                        <SelectValue placeholder="Alterar Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="open">Aberto</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="resolved">Resolvido</SelectItem>
                        <SelectItem value="closed">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-red-500 h-10 w-10 transition-colors"
                      onClick={() => handleDelete(ticket.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {ticket.adminReply && (
                  <div className="mt-4 p-4 bg-primary/5 border-l-2 border-primary rounded-r-xl group-hover:bg-primary/10 transition-colors">
                    <div className="text-[10px] font-bold text-primary uppercase mb-2 flex items-center gap-2">
                      <MessageCircle className="w-3 h-3" /> Sua Resposta Registrada:
                    </div>
                    <p className="text-sm italic text-slate-900/80">{ticket.adminReply}</p>
                    <div className="text-[9px] text-muted-foreground mt-2 text-right">
                      Respondido em: {ticket.updatedAt?.seconds ? new Date(ticket.updatedAt.seconds * 1000).toLocaleString('pt-BR') : '-'}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="text-center py-24 flex flex-col items-center gap-4 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                   <MessageSquare className="w-8 h-8 opacity-20" />
                </div>
                <p>Nenhum chamado de suporte encontrado na base de dados.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent className="bg-white border-slate-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl flex items-center gap-2">
              <MessageCircle className="text-primary w-6 h-6" />
              Responder ao Chamado
            </DialogTitle>
            <DialogDescription>A resposta será enviada para o painel de <strong>{selectedTicket?.userName}</strong> e o chamado será dado como resolvido.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
              <div className="text-[10px] font-bold uppercase text-primary tracking-widest">Pergunta do Usuário:</div>
              <p className="text-sm font-medium leading-relaxed">{selectedTicket?.message}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-primary font-bold">Sua Resposta Administrativa</Label>
              <Textarea 
                placeholder="Escreva aqui sua orientação, solução ou resposta para o usuário..." 
                className="min-h-[150px] bg-white border-slate-200 text-sm leading-relaxed"
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsReplyOpen(false)}>Descartar</Button>
            <Button 
              onClick={handleReply} 
              disabled={loading || !replyMessage} 
              className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-10 gap-2 text-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />}
              Registrar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}