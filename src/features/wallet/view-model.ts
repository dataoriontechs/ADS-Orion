
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, setDoc, serverTimestamp, query, updateDoc } from 'firebase/firestore';
import { createPixPayment, createBoletoPayment, simulatePaymentApproval } from '@/app/actions/mercadopago';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export type PeriodType = 'all' | '7d' | '30d' | 'month' | 'custom';

/**
 * @fileOverview WalletViewModel (MVVM) - Gerencia estado financeiro e expiração de pagamentos
 */
export function useWalletViewModel() {
  const { user: currentUser } = useUser();
  const db = useFirestore();
  
  const [depositAmount, setDepositAmount] = useState('0,00');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('all');
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const [pixData, setPixData] = useState<any>(null);
  const [boletoData, setBoletoData] = useState<any>(null);
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(80);
  const [isExpired, setIsExpired] = useState(false);

  // Model references
  const userRef = useMemo(() => (db && currentUser ? doc(db, 'users', currentUser.uid) : null), [db, currentUser]);
  const { data: profile } = useDoc(userRef);

  const txRef = useMemo(() => (db && currentUser && currentTxId ? doc(db, 'users', currentUser.uid, 'transactions', currentTxId) : null), [db, currentUser, currentTxId]);
  const { data: currentTx } = useDoc(txRef);

  const settingsRef = useMemo(() => (db ? doc(db, 'settings', 'finance') : null), [db]);
  const { data: financeSettings } = useDoc(settingsRef);

  const mpSettingsRef = useMemo(() => (db ? doc(db, 'settings', 'mercadopago') : null), [db]);
  const { data: mpSettings } = useDoc(mpSettingsRef);

  const transactionsQuery = useMemo(() => {
    if (!db || !currentUser) return null;
    return query(collection(db, 'users', currentUser.uid, 'transactions'));
  }, [db, currentUser]);
  
  const { data: rawTransactions, loading: txLoading } = useCollection(transactionsQuery);

  // Atualiza timestamp de sincronização
  useEffect(() => {
    if (!txLoading) setLastUpdate(new Date());
  }, [rawTransactions, txLoading, currentTx, profile]);

  const transactions = useMemo(() => {
    let filtered = [...rawTransactions].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (period !== 'all') {
      const now = new Date();
      let start = subDays(now, 3650);
      let end = endOfDay(now);

      if (period === '7d') start = startOfDay(subDays(now, 7));
      if (period === '30d') start = startOfDay(subDays(now, 30));
      if (period === 'month') start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      if (period === 'custom' && customRange?.from) {
        start = startOfDay(customRange.from);
        if (customRange.to) end = endOfDay(customRange.to);
      }

      filtered = filtered.filter(t => {
        if (!t.createdAt?.seconds) return false;
        const tDate = new Date(t.createdAt.seconds * 1000);
        return isWithinInterval(tDate, { start, end });
      });
    }

    return filtered;
  }, [rawTransactions, period, customRange]);

  // Lógica de cronômetro e expiração automática no banco
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pixData && timeLeft > 0 && !isExpired && currentTx?.status !== 'approved') {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && pixData && !isExpired) {
      setIsExpired(true);
      // Atualiza o status no banco para não constar mais como pendente
      if (db && currentUser && currentTxId) {
        const txRef = doc(db, 'users', currentUser.uid, 'transactions', currentTxId);
        updateDoc(txRef, { 
          status: 'expired', 
          updatedAt: serverTimestamp() 
        }).catch(() => {});
      }
    }
    return () => clearInterval(timer);
  }, [pixData, timeLeft, isExpired, currentTx, db, currentUser, currentTxId]);

  const helpers = {
    formatCurrencyMask: (val: string) => {
      let cleanVal = val.replace(/\D/g, "");
      if (!cleanVal) return "0,00";
      const numericVal = (Number(cleanVal) / 100);
      return numericVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    getRawAmount: (val: string) => Number(val.replace(/\./g, "").replace(",", ".")),
    resetPaymentStates: () => {
      setPixData(null);
      setBoletoData(null);
      setCurrentTxId(null);
      setTimeLeft(80);
      setIsExpired(false);
      setLoading(false);
      setDepositAmount('0,00');
    }
  };

  const actions = {
    setPeriod,
    setCustomRange,
    handleDeposit: async () => {
      if (!currentUser || !db) return;
      const amount = helpers.getRawAmount(depositAmount);
      const minDepositValue = financeSettings?.minDeposit || 10;
      
      if (amount < minDepositValue) {
        return toast({ title: "Valor Mínimo", description: `O valor mínimo é R$ ${minDepositValue.toLocaleString('pt-BR')}`, variant: "destructive" });
      }

      setLoading(true);
      setIsExpired(false);
      setTimeLeft(80);

      try {
        const txId = `tx_${Date.now()}`;
        setCurrentTxId(txId);
        
        const result = paymentMethod === 'pix' 
          ? await createPixPayment(currentUser.uid, currentUser.email || '', profile?.name || 'Membro', amount, txId)
          : await createBoletoPayment(currentUser.uid, currentUser.email || '', profile?.name || 'Membro', amount, txId);

        if (result?.error) {
          toast({ title: "Erro no Processamento", description: result.error, variant: "destructive" });
          setLoading(false);
        } else {
          const txRef = doc(db, 'users', currentUser.uid, 'transactions', txId);
          const txData = {
            amount,
            type: 'in',
            method: paymentMethod,
            description: `Recarga via ${paymentMethod.toUpperCase()}`,
            status: 'pending',
            createdAt: serverTimestamp()
          };

          setDoc(txRef, txData).catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: txRef.path, operation: 'create', requestResourceData: txData })));

          if (paymentMethod === 'pix') setPixData(result);
          else setBoletoData(result);
          setLoading(false);
          setLastUpdate(new Date());
        }
      } catch (err) {
        toast({ title: "Falha técnica", variant: "destructive" });
        setLoading(false);
      }
    },
    handleSimulateApproval: async () => {
      if (!currentUser || !currentTxId || mpSettings?.environment === 'production') return;
      setSimulating(true);
      try {
        const amount = helpers.getRawAmount(depositAmount);
        await simulatePaymentApproval(currentUser.uid, currentTxId, amount, paymentMethod);
        setLastUpdate(new Date());
        toast({ title: "Simulação Concluída" });
      } catch (e: any) {
        toast({ title: "Falha", description: e.message, variant: "destructive" });
      } finally {
        setSimulating(false);
      }
    }
  };

  return {
    state: {
      depositAmount,
      paymentMethod,
      isDepositOpen,
      loading,
      simulating,
      pixData,
      boletoData,
      currentTxId,
      currentTx,
      timeLeft,
      isExpired,
      profile,
      financeSettings,
      mpSettings,
      transactions,
      txLoading,
      period,
      customRange,
      lastUpdate
    },
    actions: {
      setDepositAmount,
      setPaymentMethod,
      setIsDepositOpen,
      ...actions,
      ...helpers
    }
  };
}
