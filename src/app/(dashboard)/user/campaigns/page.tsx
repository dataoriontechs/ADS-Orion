
'use client';

import { useCampaignsViewModel } from '@/features/campaigns/view-model';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, MoreVertical, Play, Pause, Trash2, Rocket, Loader2, Edit2, Eye, Calendar, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

/**
 * @fileOverview View (MVVM) - CampaignsPage - Atualizado com filtros
 */
export default function CampaignsPage() {
  const { state, actions } = useCampaignsViewModel();

  if (state.loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold">Minhas Campanhas</h2>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             Dados sincronizados • Última carga: {format(state.lastUpdate, 'HH:mm:ss')}
          </div>
        </div>
        <Link href="/user/campaigns/new">
          <Button className="rounded-full shadow-lg h-11 px-8 bg-primary hover:bg-primary/90 font-bold">
            <PlusCircle className="mr-2 w-5 h-5" /> Nova Orquestração
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Filtrar por nome do anúncio..." 
            className="pl-10 h-12 bg-white border-slate-200 shadow-sm" 
            value={state.searchTerm} 
            onChange={e => actions.setSearchTerm(e.target.value)} 
          />
        </div>
        <Select value={state.period} onValueChange={(v: any) => actions.setPeriod(v)}>
          <SelectTrigger className="w-full md:w-[220px] h-12 bg-white border-slate-200 shadow-sm rounded-xl px-4">
            <Calendar className="w-4 h-4 mr-2 opacity-40" />
            <SelectValue placeholder="Filtrar por Data" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo histórico</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {state.filteredCampaigns.map((campaign) => {
          const objectives = Array.isArray(campaign.objective) ? campaign.objective : [campaign.objective].filter(Boolean);
          
          return (
            <Card key={campaign.id} className="bg-white overflow-hidden border-slate-200 hover:border-primary/20 transition-all group shadow-sm">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="p-6 flex-1 border-r border-slate-100">
                    <Link href={`/user/campaigns/${campaign.id}`} className="hover:text-primary transition-colors block">
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{campaign.name}</h3>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                      <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full uppercase font-bold text-[9px] border-none ${
                        campaign.status === 'Ativa' ? 'bg-green-500/10 text-green-500' :
                        campaign.status === 'Pausada' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-slate-100 text-muted-foreground'
                      }`}>{campaign.status}</Badge>
                      
                      <div className="flex gap-1">
                        {objectives.map((obj: string) => (
                          <Badge key={obj} variant="secondary" className="text-[8px] bg-primary/10 text-primary border-primary/20 h-4 uppercase">
                            {obj}
                          </Badge>
                        ))}
                      </div>
                      <span className="opacity-40">•</span>
                      <span className="text-[10px] font-medium">{campaign.durationDays} dias</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8 p-6 flex-[1.5]">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Investimento</div>
                      <div className="text-sm font-bold">R$ {campaign.budget?.toLocaleString('pt-BR')}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Engajamento Real</div>
                      <div className="text-sm font-bold text-primary">{campaign.metrics?.clicks?.toLocaleString('pt-BR') || 0} clicks</div>
                    </div>
                    <div className="flex justify-end items-center gap-3">
                      <Button variant="outline" size="sm" className="h-10 gap-2 rounded-full font-bold px-6 border-slate-200 hover:bg-primary hover:text-white transition-all" asChild>
                        <Link href={`/user/campaigns/${campaign.id}`}>
                          <Eye className="w-4 h-4" /> Resultados
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-slate-50"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200">
                          <DropdownMenuItem className="cursor-pointer gap-2" asChild>
                            <Link href={`/user/campaigns/${campaign.id}/edit`}>
                              <Edit2 className="w-4 h-4" /> Ajustar Orquestração
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => actions.toggleStatus(campaign.id, campaign.status, campaign.name)}>
                            {campaign.status === 'Ativa' ? <><Pause className="w-4 h-4 text-yellow-500" /> Pausar Anúncio</> : <><Play className="w-4 h-4 text-green-500" /> Ativar Agora</>}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100" />
                          <DropdownMenuItem className="text-red-500 gap-2 cursor-pointer" onClick={() => actions.handleDelete(campaign.id, campaign.name)}>
                            <Trash2 className="w-4 h-4" /> Encerrar Campanha
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {state.filteredCampaigns.length === 0 && (
          <div className="text-center py-24 border border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
            <Rocket className="w-16 h-16 text-primary opacity-10 mx-auto mb-6" />
            <div className="max-w-xs mx-auto space-y-2">
              <h4 className="text-xl font-bold">Nenhuma orquestração</h4>
              <p className="text-sm text-muted-foreground mb-6">Ajuste os filtros ou crie uma nova campanha.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
