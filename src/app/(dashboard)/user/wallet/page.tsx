
'use client';

import { useWalletViewModel } from '@/features/wallet/view-model';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  PlusCircle, 
  FileText, 
  Zap,
  Loader2,
  CheckCircle2,
  Clock,
  Copy,
  Barcode,
  History,
  ShieldCheck,
  ExternalLink,
  Download,
  AlertCircle,
  Beaker,
  XCircle,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function WalletPage() {
  const { state, actions } = useWalletViewModel();

  if (state.txLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  const minDepositValue = state.financeSettings?.minDeposit || 10;
  const isProduction = state.mpSettings?.environment === 'production';
  const isAdmin = state.profile?.role === 'ADMIN';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold flex items-center gap-3">
            <Wallet className="text-primary w-8 h-8" />
            Minha Carteira
          </h2>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             Sincronização em tempo real • Atualizado às {format(state.lastUpdate, 'HH:mm:ss')}
          </div>
        </div>

        <Dialog open={state.isDepositOpen} onOpenChange={(open) => {
          actions.setIsDepositOpen(open);
          if (!open) actions.resetPaymentStates();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 rounded-full shadow-lg">
              <PlusCircle className="mr-2 w-5 h-5" /> Adicionar Saldo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 sm:max-w-[450px] p-0 overflow-hidden rounded-[2rem]">
            {!state.pixData && !state.boletoData ? (
              <div className="p-8">
                <DialogHeader>
                  <DialogTitle className="font-headline text-xl text-primary">Recarregar Créditos</DialogTitle>
                  <DialogDescription>Valor mínimo de R$ {minDepositValue.toLocaleString('pt-BR')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-primary">Quanto deseja investir?</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">R$</span>
                      <Input value={state.depositAmount} onChange={e => actions.setDepositAmount(actions.formatCurrencyMask(e.target.value))} className="h-16 pl-16 bg-white border-slate-200 text-2xl font-bold font-headline" />
                    </div>
                  </div>
                  <RadioGroup value={state.paymentMethod} onValueChange={actions.setPaymentMethod} className="space-y-3">
                    <PaymentOption id="pix" label="PIX Instantâneo" icon={<Zap className="text-primary w-5 h-5" />} active={state.paymentMethod === 'pix'} />
                    <PaymentOption id="boleto" label="Boleto Bancário" icon={<FileText className="text-primary w-5 h-5" />} active={state.paymentMethod === 'boleto'} />
                  </RadioGroup>
                  <Button onClick={actions.handleDeposit} disabled={state.loading || actions.getRawAmount(state.depositAmount) < minDepositValue} className="w-full h-14 bg-primary text-white font-bold text-lg rounded-2xl shadow-xl shadow-primary/20">
                    {state.loading ? <Loader2 className="animate-spin mr-2" /> : 'Confirmar e Gerar'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="bg-slate-50 border-b border-slate-100 p-6">
                   <DialogHeader>
                      <DialogTitle className="text-center font-headline text-lg">
                        {state.currentTx?.status === 'approved' ? 'Pagamento Confirmado!' : 'Aguardando Pagamento'}
                      </DialogTitle>
                   </DialogHeader>
                   
                   {!isProduction && !state.isExpired && state.currentTx?.status !== 'approved' && isAdmin && (
                     <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-blue-700 font-bold text-[10px] uppercase tracking-widest"><Beaker className="w-3.5 h-3.5" /> Modo Sandbox Ativo</div>
                        <Button onClick={actions.handleSimulateApproval} disabled={state.simulating} className="w-full h-8 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg mt-2">
                          {state.simulating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckCircle2 className="w-3 h-3 mr-2" />} SIMULAR APROVAÇÃO (ADMIN)
                        </Button>
                     </div>
                   )}

                   {isProduction && state.currentTx?.status !== 'approved' && (
                     <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl flex gap-3 items-center">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        <p className="text-[10px] text-green-700 font-bold uppercase tracking-widest leading-tight">Transação Real Segura via Mercado Pago</p>
                     </div>
                   )}
                </div>

                <div className="p-8">
                  {state.currentTx?.status === 'approved' ? (
                    <div className="text-center py-10 space-y-6 animate-in zoom-in-95">
                      <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="w-12 h-12" /></div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-slate-900">Sucesso!</h3>
                        <p className="text-sm text-muted-foreground">R$ {actions.getRawAmount(state.depositAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} creditados em sua conta.</p>
                      </div>
                      <Button onClick={() => actions.setIsDepositOpen(false)} className="w-full h-12 rounded-xl bg-primary font-bold">Voltar ao Painel</Button>
                    </div>
                  ) : state.isExpired ? (
                    <div className="text-center py-10 space-y-6 animate-in zoom-in-95">
                      <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto"><XCircle className="w-12 h-12" /></div>
                      <div className="space-y-2"><h3 className="text-xl font-bold">Cobrança Expirada</h3><p className="text-sm text-muted-foreground">O tempo limite foi atingido. Gere uma nova para prosseguir.</p></div>
                      <Button onClick={actions.resetPaymentStates} className="w-full h-12 rounded-xl bg-primary font-bold gap-2"><RefreshCw className="w-4 h-4" /> Gerar Novo Pagamento</Button>
                    </div>
                  ) : state.pixData ? (
                    <div className="space-y-6 text-center animate-in zoom-in-95">
                       <div className="flex flex-col items-center gap-2">
                          <Badge variant="outline" className="border-primary text-primary font-bold animate-pulse px-4 py-1">Aguardando PIX</Badge>
                          <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Expira em: <span className={state.timeLeft < 20 ? 'text-red-500' : 'text-primary'}>{state.timeLeft}s</span></div>
                       </div>
                       <div className="mx-auto bg-white p-4 rounded-2xl w-fit shadow-2xl border-4 border-primary/5">
                          {state.pixData.qr_code_base64 && <Image src={`data:image/png;base64,${state.pixData.qr_code_base64}`} alt="QR Code PIX" width={220} height={220} className="rounded-lg" />}
                       </div>
                       <div className="space-y-3 px-4">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Código Copia e Cola</p>
                          <div className="flex gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 group">
                             <input readOnly value={state.pixData.qr_code} className="bg-transparent border-none text-[10px] flex-1 outline-none truncate font-mono" />
                             <Button onClick={() => { navigator.clipboard.writeText(state.pixData.qr_code); toast({ title: "Copiado!" }); }} size="icon" variant="ghost" className="h-8 w-8 text-primary"><Copy className="w-4 h-4" /></Button>
                          </div>
                       </div>
                    </div>
                  ) : state.boletoData ? (
                    <div className="space-y-6 text-center animate-in zoom-in-95">
                       <div className="mx-auto bg-primary/10 p-8 rounded-full w-fit"><Barcode className="w-12 h-12 text-primary" /></div>
                       <div className="space-y-4 px-4 text-left">
                          <div className="space-y-2">
                             <Label className="text-[10px] uppercase font-bold text-muted-foreground block text-center">Linha Digitável</Label>
                             <div className="flex gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <input readOnly value={state.boletoData.barcode} className="bg-transparent border-none text-[10px] flex-1 outline-none font-mono" />
                                <Button onClick={() => { navigator.clipboard.writeText(state.boletoData.barcode); toast({ title: "Copiado!" }); }} size="icon" variant="ghost" className="text-primary"><Copy className="w-4 h-4" /></Button>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                             <Button variant="outline" asChild className="h-12 font-bold border-slate-200"><a href={state.boletoData.external_resource_url} target="_blank"><ExternalLink className="w-4 h-4 mr-2" /> Visualizar</a></Button>
                             <Button className="h-12 font-bold bg-primary text-white" asChild><a href={state.boletoData.external_resource_url} download><Download className="w-4 h-4 mr-2" /> PDF</a></Button>
                          </div>
                       </div>
                    </div>
                  ) : null}
                </div>
                
                {state.currentTx?.status !== 'approved' && (
                  <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-center">
                    <Button variant="ghost" onClick={() => actions.setIsDepositOpen(false)} className="text-[10px] font-bold uppercase tracking-widest opacity-60">Cancelar e Sair</Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Wallet className="w-32 h-32 text-primary" /></div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Saldo Disponível</div>
          <div className="text-6xl font-bold font-headline text-primary tracking-tighter mb-4">
            R$ {(state.profile?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
             <ShieldCheck className="w-4 h-4" /> Conta Orion Verificada
          </div>
        </Card>

        <Card className="md:col-span-2 bg-white border-slate-200 shadow-sm flex flex-col h-[450px]">
          <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Extrato de Movimentações</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={state.period} onValueChange={(v: any) => actions.setPeriod(v)}>
                <SelectTrigger className="w-[140px] h-9 bg-slate-50 border-none text-[10px] font-bold uppercase">
                  <Calendar className="w-3 h-3 mr-2 opacity-40" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tudo</SelectItem>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <div className="flex-1 overflow-auto">
            {state.transactions.length > 0 ? (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-widest"><tr><th className="p-4">Data</th><th className="p-4">Descrição</th><th className="p-4 text-right">Valor</th><th className="p-4 text-right">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {state.transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-4 text-muted-foreground font-mono">{t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="p-4 font-bold">{t.description}</td>
                      <td className={`p-4 font-bold text-right ${t.type === 'in' ? 'text-green-600' : 'text-slate-900'}`}>{t.type === 'in' ? '+' : '-'} R$ {t.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right">
                        <Badge variant="secondary" className={`text-[9px] uppercase font-bold ${
                          t.status === 'approved' ? 'bg-green-500/10 text-green-600' : 
                          t.status === 'pending' ? 'bg-blue-500/10 text-blue-600 animate-pulse' : 
                          t.status === 'expired' ? 'bg-slate-100 text-slate-400' :
                          'bg-slate-100'
                        }`}>
                          {t.status === 'approved' ? 'Pago' : t.status === 'pending' ? 'Pendente' : t.status === 'expired' ? 'Expirado' : t.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
                 <History className="w-12 h-12 opacity-10" />
                 <p className="text-[10px] uppercase font-bold tracking-widest">Nenhuma transação no período</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function PaymentOption({ id, label, icon, active }: any) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${active ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <div className="flex items-center gap-3"><RadioGroupItem value={id} id={id} /><Label htmlFor={id} className="font-bold cursor-pointer">{label}</Label></div>
      {icon}
    </div>
  );
}
