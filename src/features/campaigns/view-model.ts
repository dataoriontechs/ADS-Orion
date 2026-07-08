
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, updateDoc, doc, arrayUnion, serverTimestamp, addDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export type PeriodType = 'all' | '7d' | '30d' | 'month' | 'custom';

/**
 * @fileOverview CampaignsViewModel (MVVM) - Atualizado com filtros de data
 */
export function useCampaignsViewModel() {
  const { user } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState<PeriodType>('all');
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const campaignsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'campaigns'),
      where('userId', '==', user.uid)
    );
  }, [db, user]);

  const { data: rawCampaigns, loading } = useCollection(campaignsQuery);

  // Atualiza timestamp de sincronização quando os dados mudam
  useEffect(() => {
    if (!loading) setLastUpdate(new Date());
  }, [rawCampaigns, loading]);

  const campaigns = useMemo(() => {
    let filtered = [...rawCampaigns]
      .filter(c => c.status !== 'Excluída')
      .sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

    if (period !== 'all') {
      const now = new Date();
      let start = subDays(now, 3650); // Fallback
      let end = endOfDay(now);

      if (period === '7d') start = startOfDay(subDays(now, 7));
      if (period === '30d') start = startOfDay(subDays(now, 30));
      if (period === 'month') start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      if (period === 'custom' && customRange?.from) {
        start = startOfDay(customRange.from);
        if (customRange.to) end = endOfDay(customRange.to);
      }

      filtered = filtered.filter(c => {
        if (!c.createdAt?.seconds) return false;
        const cDate = new Date(c.createdAt.seconds * 1000);
        return isWithinInterval(cDate, { start, end });
      });
    }

    return filtered;
  }, [rawCampaigns, period, customRange]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [campaigns, searchTerm]);

  const actions = {
    setPeriod,
    setCustomRange,
    handleDelete: async (id: string, name: string) => {
      if (!db || !user) return;
      if (confirm("Deseja encerrar e excluir este anúncio? A ação enviará uma notificação para encerramento operacional imediato.")) {
        try {
          const campRef = doc(db, 'campaigns', id);
          await updateDoc(campRef, { 
            status: 'Excluída',
            internalStatus: 'Aguardando encerramento operacional',
            updatedAt: serverTimestamp(),
            history: arrayUnion({
              type: 'user_delete',
              date: new Date().toISOString(),
              user: user.displayName || user.email,
              details: 'O usuário excluiu a campanha. Aguardando encerramento nas plataformas externas.'
            })
          });

          await addDoc(collection(db, 'logs'), {
            userId: user.uid,
            userName: user.displayName || user.email,
            action: 'CAMPAIGN_DELETED_BY_USER',
            details: `Campanha "${name}" movida para encerramento operacional.`,
            type: 'warning',
            createdAt: serverTimestamp()
          });

          setLastUpdate(new Date());
          toast({ title: "Campanha em encerramento", description: "O anúncio sairá do ar em instantes." });
        } catch (error) {
          toast({ title: "Erro ao excluir", variant: "destructive" });
        }
      }
    },
    toggleStatus: async (id: string, currentStatus: string, name: string) => {
      if (!db || !user) return;
      const isPausing = currentStatus === 'Ativa';
      const newStatus = isPausing ? 'Pausada' : 'Ativa';
      const internalStatus = isPausing ? 'Aguardando pausa operacional' : 'Aguardando publicação';
      
      try {
        const campRef = doc(db, 'campaigns', id);
        await updateDoc(campRef, { 
          status: newStatus,
          internalStatus: internalStatus,
          updatedAt: serverTimestamp(),
          history: arrayUnion({
            type: isPausing ? 'user_pause' : 'user_resume',
            date: new Date().toISOString(),
            user: user.displayName || user.email,
            details: isPausing ? 'Usuário pausou a campanha no painel.' : 'Usuário reativou a campanha no painel.'
          })
        });

        await addDoc(collection(db, 'logs'), {
          userId: user.uid,
          userName: user.displayName || user.email,
          action: isPausing ? 'CAMPAIGN_PAUSED_BY_USER' : 'CAMPAIGN_RESUMED_BY_USER',
          details: `Campanha "${name}" alterada para ${newStatus}.`,
          type: 'info',
          createdAt: serverTimestamp()
        });

        setLastUpdate(new Date());
        toast({ 
          title: `Campanha ${newStatus}`, 
          description: isPausing ? "Solicitação de pausa enviada para operação." : "Solicitação de reativação enviada."
        });
      } catch (error) {
        toast({ title: "Erro ao alterar status", variant: "destructive" });
      }
    }
  };

  return {
    state: {
      searchTerm,
      campaigns,
      filteredCampaigns,
      loading,
      period,
      customRange,
      lastUpdate
    },
    actions: {
      setSearchTerm,
      ...actions
    }
  };
}
