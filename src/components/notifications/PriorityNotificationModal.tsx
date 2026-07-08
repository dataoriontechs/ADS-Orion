
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCollection, useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { AlertCircle, Megaphone, Info, Zap, Rocket, CheckCircle2 } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  high: AlertCircle,
  campaigns: Megaphone,
  info: Info,
  promotion: Zap,
  update: Rocket,
  success: CheckCircle2
};

export function PriorityNotificationModal() {
  const { user } = useUser();
  const db = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [currentNotif, setCurrentNotif] = useState<any>(null);

  // Consulta simplificada para evitar erro de índice composto
  const priorityQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: notifications } = useCollection(priorityQuery);

  // Filtra em memória para identificar notificações prioritárias não lidas
  useEffect(() => {
    const highPriorityNotif = notifications.find(n => 
      n.priority === 'high' && !n.read && !n.deleted
    );

    if (highPriorityNotif) {
      setCurrentNotif(highPriorityNotif);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [notifications]);

  const handleClose = async () => {
    if (currentNotif && db && user) {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', currentNotif.id), {
        read: true
      });
      setIsOpen(false);
    }
  };

  if (!currentNotif) return null;

  const Icon = ICON_MAP[currentNotif.type] || AlertCircle;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[450px] bg-white border-slate-200 rounded-[2rem] overflow-hidden p-0">
        <div className="bg-primary/5 p-8 flex flex-col items-center text-center border-b border-slate-100">
           <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary mb-6 animate-bounce">
              <Icon className="w-8 h-8" />
           </div>
           <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-2 uppercase font-bold tracking-widest text-[9px]">
             Comunicado Urgente
           </Badge>
           <DialogHeader>
             <DialogTitle className="font-headline text-2xl font-black text-slate-900 tracking-tighter leading-tight">
               {currentNotif.title}
             </DialogTitle>
           </DialogHeader>
        </div>
        
        <div className="p-8">
           <DialogDescription className="text-slate-600 text-sm leading-relaxed text-center font-medium">
             {currentNotif.message}
           </DialogDescription>
        </div>

        <DialogFooter className="p-8 pt-0">
          <Button 
            onClick={handleClose} 
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl shadow-xl shadow-primary/20"
          >
            Entendido, prosseguir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
