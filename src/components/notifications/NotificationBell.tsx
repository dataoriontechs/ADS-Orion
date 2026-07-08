
'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Bell, 
  Trash2, 
  Clock, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Rocket, 
  Wallet, 
  Settings, 
  Zap, 
  Megaphone, 
  MailOpen
} from 'lucide-react';
import { useCollection, useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

const NOTIFICATION_MAP: Record<string, { icon: any, color: string }> = {
  info: { icon: Info, color: 'text-blue-500' },
  success: { icon: CheckCircle2, color: 'text-green-500' },
  warning: { icon: AlertTriangle, color: 'text-orange-500' },
  error: { icon: XCircle, color: 'text-red-500' },
  update: { icon: Rocket, color: 'text-purple-500' },
  finance: { icon: Wallet, color: 'text-yellow-600' },
  campaigns: { icon: Megaphone, color: 'text-primary' },
  system: { icon: Settings, color: 'text-slate-500' },
  promotion: { icon: Zap, color: 'text-pink-500' },
};

export function NotificationBell() {
  const { user } = useUser();
  const db = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [lastCount, setLastCount] = useState(0);

  // Consulta simplificada para evitar erro de índice composto
  const notificationsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: rawNotifications } = useCollection(notificationsQuery);

  // Filtra em memória para garantir funcionamento imediato
  const notifications = useMemo(() => 
    rawNotifications.filter(n => !n.deleted)
  , [rawNotifications]);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length
  , [notifications]);

  useEffect(() => {
    if (notifications.length > lastCount && lastCount > 0) {
      const newNotif = notifications[0];
      if (!newNotif.read) {
        toast({
          title: newNotif.title,
          description: newNotif.message,
        });
      }
    }
    setLastCount(notifications.length);
  }, [notifications, lastCount]);

  const markAsRead = async (id: string) => {
    if (!db || !user) return;
    await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true });
  };

  const markAllAsRead = async () => {
    if (!db || !user || unreadCount === 0) return;
    const batch = writeBatch(db);
    const unreadOnes = notifications.filter(n => !n.read);
    unreadOnes.forEach(n => {
      const ref = doc(db, 'users', user.uid, 'notifications', n.id);
      batch.update(ref, { read: true });
    });
    await batch.commit();
    toast({ title: "Todas marcadas como lidas" });
  };

  const deleteNotification = async (id: string) => {
    if (!db || !user) return;
    await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { deleted: true });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 border-2 border-white animate-in zoom-in">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 bg-white border-slate-200 shadow-2xl rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-headline font-bold text-sm">Notificações</h3>
            {unreadCount > 0 && <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">{unreadCount} novas</Badge>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Marcar tudo como lido" onClick={markAllAsRead}>
              <MailOpen className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => {
                const Config = NOTIFICATION_MAP[n.type] || NOTIFICATION_MAP.info;
                const Icon = Config.icon;
                
                return (
                  <div 
                    key={n.id} 
                    className={`p-4 flex gap-4 transition-colors group cursor-pointer ${!n.read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-slate-50'}`}
                    onClick={() => !n.read && markAsRead(n.id)}
                  >
                    <div className={`mt-1 shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm ${Config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</span>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[9px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> 
                          {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                        </span>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-6 w-6 text-muted-foreground hover:text-red-500"
                             onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                           >
                             <Trash2 className="w-3 h-3" />
                           </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                <Bell className="w-6 h-6 opacity-20" />
              </div>
              <div>
                <p className="text-sm font-bold">Tudo limpo por aqui!</p>
                <p className="text-[11px]">Você não tem notificações no momento.</p>
              </div>
            </div>
          )}
        </ScrollArea>
        
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <Button variant="link" className="w-full h-auto py-1 text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors">
            Ver todas as mensagens
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
