
"use client";

import { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Rocket, 
  ArrowRight, 
  ArrowLeft,
  Facebook,
  Instagram,
  Target,
  ShoppingBag,
  MessageCircle,
  Eye,
  MousePointer2,
  Loader2,
  Upload,
  Check,
  MapPin,
  Globe,
  Search,
  X,
  PlusCircle,
  Hash,
  ChevronDown,
  Wallet,
  Sparkles,
  Info,
  Youtube,
  Linkedin,
  Twitter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { uploadToCloudinary } from '@/app/actions/cloudinary';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' }, { value: 'AL', label: 'Alagoas' }, { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' }, { value: 'BA', label: 'Bahia' }, { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' }, { value: 'ES', label: 'Espírito Santo' }, { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' }, { value: 'MT', label: 'Mato Grosso' }, { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' }, { value: 'PA', label: 'Pará' }, { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' }, { value: 'PE', label: 'Pernambuco' }, { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' }, { value: 'RN', label: 'Rio Grande do Norte' }, { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' }, { value: 'RR', label: 'Roraima' }, { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' }, { value: 'SE', label: 'Sergipe' }, { value: 'TO', label: 'Tocantins' }
];

const OBJECTIVES = [
  { id: 'traffic', label: 'Mais Tráfego', desc: 'Levar o máximo de pessoas para seu link.', icon: <MousePointer2 className="w-5 h-5" /> },
  { id: 'conversions', label: 'Conversões', desc: 'Focar em cadastros e leads qualificados.', icon: <Target className="w-5 h-5" /> },
  { id: 'sales', label: 'Vendas Diretas', desc: 'Maximizar vendas no seu e-commerce.', icon: <ShoppingBag className="w-5 h-5" /> },
  { id: 'views', label: 'Visualizações', desc: 'Aumentar o reconhecimento de marca.', icon: <Eye className="w-5 h-5" /> },
  { id: 'engagement', label: 'Engajamento', desc: 'Mais curtidas, comentários e seguidores.', icon: <MessageCircle className="w-5 h-5" /> },
];

const PLATFORMS_CONFIG = [
  { id: 'google', label: 'Google Ads', icon: <Globe className="text-blue-400" /> },
  { id: 'youtube', label: 'YouTube Ads', icon: <Youtube className="text-red-500" /> },
  { id: 'facebook', label: 'Facebook Ads', icon: <Facebook className="text-blue-600" /> },
  { id: 'instagram', label: 'Instagram Ads', icon: <Instagram className="text-pink-500" /> },
  { id: 'tiktok', label: 'TikTok Ads', icon: <span className="text-xl">🎵</span> },
  { id: 'twitter', label: 'X (Twitter)', icon: <Twitter className="text-white" /> },
  { id: 'kwai', label: 'Kwai Ads', icon: <span className="text-xl">🎬</span> },
  { id: 'linkedin', label: 'LinkedIn Ads', icon: <Linkedin className="text-blue-700" /> },
  { id: 'pinterest', label: 'Pinterest Ads', icon: <span className="text-xl">📌</span> },
];

export default function NewCampaignWizard() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(userRef);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [creativeType, setCreativeType] = useState<'image' | 'video' | null>(null);
  const [fileToUpload, setFileToUpload] = useState<string | null>(null);

  const [locationType, setLocationType] = useState<'national' | 'states'>('national');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]); 
  const [citiesByState, setCitiesByState] = useState<Record<string, any[]>>({});
  const [loadingCities, setLoadingCities] = useState<Record<string, boolean>>({});
  const [citySearch, setCitySearch] = useState('');

  const [keywords, setKeywords] = useState<string[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState('');

  const [formData, setFormData] = useState({
    objectives: [] as string[],
    title: '',
    description: '',
    destinationUrl: '',
    platforms: [] as string[],
    ageRange: 'adult',
    gender: 'all',
    interests: '',
    totalBudget: '0',
    durationDays: '10'
  });

  const toggleObjective = (id: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.includes(id)
        ? prev.objectives.filter(objId => objId !== id)
        : [...prev.objectives, id]
    }));
  };

  useEffect(() => {
    const fetchCities = async (uf: string) => {
      if (citiesByState[uf] || loadingCities[uf]) return;
      setLoadingCities(prev => ({ ...prev, [uf]: true }));
      try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
        const data = await response.json();
        setCitiesByState(prev => ({ ...prev, [uf]: data.map((c: any) => ({ name: c.nome, state: uf })) }));
      } catch (error) {
        console.error("Erro ao buscar cidades:", error);
      } finally {
        setLoadingCities(prev => ({ ...prev, [uf]: false }));
      }
    };

    if (locationType === 'states') {
      selectedStates.forEach(uf => fetchCities(uf));
    }
  }, [selectedStates, locationType, citiesByState, loadingCities]);

  const formatCurrencyMask = (val: string) => {
    let cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) return "0,00";
    const numericVal = (Number(cleanVal) / 100);
    return numericVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getRawBudget = (val: string) => Number(val.replace(/\./g, "").replace(",", "."));

  const nextStep = () => {
    if (step === 1 && formData.objectives.length === 0) return toast({ title: "Atenção", description: "Escolha ao menos um objetivo." });
    if (step === 2 && (!formData.title || !formData.destinationUrl)) return toast({ title: "Atenção", description: "Preencha o título e a URL de destino." });
    if (step === 3 && formData.platforms.length === 0) return toast({ title: "Atenção", description: "Selecione ao menos uma plataforma." });
    if (step === 4 && locationType === 'states' && selectedStates.length === 0) return toast({ title: "Atenção", description: "Selecione ao menos um estado." });
    if (step === 4 && keywords.length === 0) return toast({ title: "Mínimo 1 Palavra-chave", description: "Informe ao menos uma palavra-chave para segmentação.", variant: "destructive" });
    if (step === 5) {
        const budget = getRawBudget(formData.totalBudget);
        if (budget <= 0) return toast({ title: "Orçamento Inválido", description: "Informe quanto deseja investir." });
        if (budget > (profile?.balance || 0)) return toast({ title: "Saldo Insuficiente", description: "Recarregue sua carteira para continuar.", variant: "destructive" });
    }
    setStep(s => s + 1);
  };

  const handleFinish = async () => {
    if (!user || !db || !profile) return;
    const visualBudget = getRawBudget(formData.totalBudget);
    
    setLoading(true);
    try {
        let finalCreativeUrl = "";
        if (fileToUpload) {
          const uploadRes = await uploadToCloudinary(fileToUpload, 'campaigns');
          finalCreativeUrl = uploadRes.url;
        }

        const realBudgetTotal = visualBudget * 0.85;

        const campaignData = {
          name: formData.title,
          objective: formData.objectives,
          description: formData.description,
          destinationUrl: formData.destinationUrl,
          platforms: formData.platforms,
          targeting: {
            locationType,
            selectedStates: locationType === 'national' ? [] : selectedStates,
            selectedCities: locationType === 'national' ? [] : selectedCities,
            keywords,
            ageRange: formData.ageRange,
            gender: formData.gender,
            interests: formData.interests
          },
          creativeUrl: finalCreativeUrl,
          creativeType: creativeType || "image",
          budget: visualBudget,
          realBudget: realBudgetTotal,
          durationDays: parseInt(formData.durationDays) || 10,
          userId: user.uid,
          status: 'Ativa',
          internalStatus: 'Aguardando publicação',
          history: [{
            type: 'creation',
            date: new Date().toISOString(),
            user: profile.displayName || user.email,
            details: 'Campanha orquestrada e ativada pelo usuário.'
          }],
          metrics: { impressions: 0, clicks: 0, conversions: 0, spent: 0, updatedAt: new Date().toISOString() },
          createdAt: serverTimestamp()
        };

        // 1. Criar Campanha
        await addDoc(collection(db, 'campaigns'), campaignData);

        // 2. Registrar Transação (Segurança: usa subcoleção do usuário logado)
        await addDoc(collection(db, 'users', user.uid, 'transactions'), {
            userId: user.uid,
            amount: visualBudget,
            internalAmount: realBudgetTotal,
            type: 'out',
            method: 'campaign_spend',
            description: `Investimento: ${formData.title}`,
            status: 'completed',
            createdAt: serverTimestamp()
        });

        // 3. Deduzir Saldo
        await updateDoc(doc(db, 'users', user.uid), {
            balance: increment(-visualBudget),
            internalBalance: increment(-realBudgetTotal),
            updatedAt: serverTimestamp()
        });

        toast({ title: "🚀 Orquestração Iniciada!", description: "Sua campanha está sendo processada pela rede global." });
        router.push('/user/campaigns');
    } catch (err: any) {
        toast({ title: "Erro na Ativação", description: "Não foi possível processar sua campanha agora. Verifique sua conexão.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const addKeyword = () => {
    const kw = currentKeyword.trim();
    if (!kw) return;
    if (kw.length < 2) return toast({ title: "Palavra-chave muito curta", description: "Mínimo 2 caracteres." });
    if (keywords.length >= 50) return toast({ title: "Limite atingido", description: "Máximo 50 palavras-chave." });
    if (keywords.includes(kw)) return setCurrentKeyword('');
    
    setKeywords([...keywords, kw]);
    setCurrentKeyword('');
  };

  const toggleCity = (city: string, uf: string) => {
    const fullCity = `${city} - ${uf}`;
    setSelectedCities(prev => 
      prev.includes(fullCity) ? prev.filter(c => c !== fullCity) : [...prev, fullCity]
    );
  };

  const isStateFullySelected = (uf: string) => {
    return selectedStates.includes(uf) && !selectedCities.some(c => c.endsWith(` - ${uf}`));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
          <Rocket className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-3xl font-headline font-bold">Lançar Campanha</h2>
          <p className="text-muted-foreground text-sm">Configure sua orquestração global em 6 etapas rápidas.</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-12 relative px-4">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -z-10" />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all ${step >= i ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200 text-muted-foreground'}`}>
              {step > i ? <Check className="w-5 h-5" /> : i}
            </div>
            <span className={`text-[10px] uppercase font-bold hidden md:block ${step >= i ? 'text-primary' : 'text-muted-foreground'}`}>
              {['Objetivo', 'Criativo', 'Redes', 'Público', 'Orçamento', 'Revisão'][i-1]}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="font-headline">1. Objetivo da Campanha</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OBJECTIVES.map((obj) => (
              <div 
                key={obj.id} 
                onClick={() => toggleObjective(obj.id)} 
                className={`flex items-center gap-5 p-5 rounded-2xl border cursor-pointer transition-all ${formData.objectives.includes(obj.id) ? 'border-primary bg-primary/10' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.objectives.includes(obj.id) ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-primary'}`}>
                  {obj.icon}
                </div>
                <div>
                  <div className="font-bold">{obj.label}</div>
                  <p className="text-[10px] text-muted-foreground">{obj.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="justify-end"><Button onClick={nextStep} className="h-12 px-10 rounded-full">Prosseguir <ArrowRight className="ml-2 w-4 h-4" /></Button></CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="font-headline">2. Criativo e Destino</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Label>Título do Anúncio</Label><Input placeholder="Ex: Cupom 20% OFF na Primeira Compra" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-white border-slate-200 h-12" /></div>
            <div className="space-y-2"><Label>Texto do Anúncio (Copy Persuasiva)</Label><Textarea placeholder="Descreva os benefícios e chame o público para ação..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white border-slate-200 min-h-[120px]" /></div>
            <div className="space-y-2">
              <Label>Link de Destino</Label>
              <Input placeholder="https://seu-site.com ou link-whatsapp" value={formData.destinationUrl} onChange={e => setFormData({...formData, destinationUrl: e.target.value})} className="bg-white border-slate-200 h-12" />
            </div>
            <div className="space-y-2">
              <Label>Mídia do Anúncio (Upload)</Label>
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="p-12 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50 cursor-pointer hover:bg-slate-100/50 transition-all group"
              >
                {previewUrl ? (
                  <div className="relative inline-block">
                    {creativeType === 'video' ? <video src={previewUrl} className="max-h-60 mx-auto rounded-xl shadow-2xl" /> : <img src={previewUrl} className="max-h-60 mx-auto rounded-xl shadow-2xl" />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <Upload className="text-white w-8 h-8" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="mx-auto w-12 h-12 text-slate-300 group-hover:scale-110 transition-transform" />
                    <div className="text-sm font-bold">Clique para selecionar imagem ou vídeo</div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Máximo 10MB</p>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 10 * 1024 * 1024) return toast({ title: "Arquivo muito grande", variant: "destructive" });
                  setCreativeType(file.type.startsWith('video') ? 'video' : 'image');
                  const r = new FileReader();
                  r.onloadend = () => { setPreviewUrl(r.result as string); setFileToUpload(r.result as string); };
                  r.readAsDataURL(file);
                }
              }} />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" onClick={() => setStep(1)} className="h-12 rounded-full px-8"><ArrowLeft className="mr-2 w-4 h-4" /> Voltar</Button>
            <Button onClick={nextStep} className="h-12 px-10 rounded-full">Próximo Passo <ArrowRight className="ml-2 w-4 h-4" /></Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="font-headline">3. Canais de Distribuição</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {PLATFORMS_CONFIG.map(p => (
               <div 
                 key={p.id} 
                 onClick={() => {
                   setFormData(prev => ({ ...prev, platforms: prev.platforms.includes(p.id) ? prev.platforms.filter(x => x !== p.id) : [...prev.platforms, p.id] }));
                 }} 
                 className={`p-6 rounded-2xl border text-center cursor-pointer transition-all flex items-center gap-4 ${formData.platforms.includes(p.id) ? 'bg-primary/10 border-primary shadow-lg' : 'bg-white border-slate-200 hover:border-slate-300'}`}
               >
                 <div className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl">
                    {p.icon}
                 </div>
                 <div className="flex-1 text-left">
                    <span className="font-bold text-sm tracking-wide">{p.label}</span>
                 </div>
                 {formData.platforms.includes(p.id) && <Check className="w-5 h-5 text-primary" />}
               </div>
             ))}
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" onClick={() => setStep(2)} className="h-12 rounded-full px-8"><ArrowLeft className="mr-2 w-4 h-4" /> Voltar</Button>
            <Button onClick={nextStep} className="h-12 px-10 rounded-full">Próximo Passo <ArrowRight className="ml-2 w-4 h-4" /></Button>
          </CardFooter>
        </Card>
      )}

      {step === 4 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">4. Público e Localização</CardTitle>
            <CardDescription>Onde e para quem seus anúncios serão exibidos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-10">
            <div className="space-y-4">
              <Label className="text-primary font-bold uppercase text-[10px] tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3" /> Abrangência Geográfica</Label>
              <RadioGroup value={locationType} onValueChange={(v: any) => setLocationType(v)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => setLocationType('national')} className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all ${locationType === 'national' ? 'bg-primary/10 border-primary' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="national" id="national" />
                    <div><Label htmlFor="national" className="font-bold cursor-pointer">Todo o Brasil</Label><p className="text-[10px] text-muted-foreground">Cobertura nacional máxima</p></div>
                  </div>
                  <Globe className="text-primary w-5 h-5 opacity-40" />
                </div>
                <div onClick={() => setLocationType('states')} className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all ${locationType === 'states' ? 'bg-primary/10 border-primary' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="states" id="states" />
                    <div><Label htmlFor="states" className="font-bold cursor-pointer">Cidades / Estados</Label><p className="text-[10px] text-muted-foreground">Segmentação estratégica precisa</p></div>
                  </div>
                  <Search className="text-primary w-5 h-5 opacity-40" />
                </div>
              </RadioGroup>
            </div>

            {locationType === 'states' && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-widest">1. Selecione os Estados</Label>
                  <ScrollArea className="h-44 border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {BRAZILIAN_STATES.map(st => (
                        <div 
                          key={st.value} 
                          onClick={() => setSelectedStates(prev => prev.includes(st.value) ? prev.filter(x => x !== st.value) : [...prev, st.value])} 
                          className={`flex items-center justify-between p-2.5 border rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all ${selectedStates.includes(st.value) ? 'bg-primary/20 border-primary text-primary' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                          <span className="truncate">{st.label}</span>
                          {selectedStates.includes(st.value) && <Check className="w-3 h-3" />}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                {selectedStates.length > 0 && (
                   <Accordion type="multiple" className="space-y-2">
                      {selectedStates.map(uf => (
                        <AccordionItem key={uf} value={uf} className="border border-slate-200 rounded-xl bg-white px-4">
                           <AccordionTrigger className="hover:no-underline font-bold text-xs">
                             {BRAZILIAN_STATES.find(s => s.value === uf)?.label}
                           </AccordionTrigger>
                           <AccordionContent className="pb-4">
                             {loadingCities[uf] ? <div className="flex gap-2 items-center py-2 text-[10px] text-muted-foreground animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> Carregando base do IBGE...</div> : (
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                  {citiesByState[uf]?.slice(0, 50).map(city => {
                                    const fullCity = `${city.name} - ${uf}`;
                                    const isSel = selectedCities.includes(fullCity);
                                    return (
                                      <div key={fullCity} onClick={() => toggleCity(city.name, uf)} className={`p-2 rounded-lg border text-[10px] cursor-pointer transition-all ${isSel ? 'bg-primary/20 border-primary' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                                        {city.name}
                                      </div>
                                    );
                                  })}
                               </div>
                             )}
                           </AccordionContent>
                        </AccordionItem>
                      ))}
                   </Accordion>
                )}
              </div>
            )}

            <div className="space-y-4 pt-6 border-t border-slate-100">
              <Label className="text-primary font-bold uppercase text-[10px] tracking-widest flex items-center gap-2"><Hash className="w-3 h-3" /> Palavras-chave Estratégicas</Label>
              <div className="flex gap-2">
                <Input 
                  value={currentKeyword} 
                  onChange={e => setCurrentKeyword(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="Ex: tecnologia, marketing, varejo..." 
                  className="bg-white border-slate-200 h-11" 
                />
                <Button type="button" onClick={addKeyword} className="h-11 px-6">Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {keywords.map(k => (
                  <Badge key={k} variant="secondary" className="gap-2 h-8 px-3 rounded-lg bg-white border-slate-200 text-slate-700 shadow-sm group">
                    {k} 
                    <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-red-500" onClick={() => setKeywords(keywords.filter(x => x !== k))} />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" onClick={() => setStep(3)} className="h-12 rounded-full px-8"><ArrowLeft className="mr-2 w-4 h-4" /> Voltar</Button>
            <Button onClick={nextStep} className="h-12 px-10 rounded-full">Próximo Passo <ArrowRight className="ml-2 w-4 h-4" /></Button>
          </CardFooter>
        </Card>
      )}

      {step === 5 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="font-headline">5. Orçamento e Período</CardTitle></CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <Label className="text-primary font-bold uppercase text-[10px] tracking-widest">Investimento Total da Campanha</Label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-bold text-slate-200">R$</span>
                <Input 
                  value={formData.totalBudget} 
                  onChange={e => setFormData({...formData, totalBudget: formatCurrencyMask(e.target.value)})} 
                  className="h-24 pl-20 bg-white border-slate-200 text-4xl font-bold font-headline tracking-tighter" 
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><Wallet className="w-4 h-4" /></div>
                  <div className="text-xs">Seu Saldo: <span className="font-bold text-green-500">R$ {profile?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                </div>
                {getRawBudget(formData.totalBudget) > (profile?.balance || 0) && (
                   <Badge variant="destructive" className="animate-pulse">Saldo Insuficiente</Badge>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Duração (Dias)</Label>
                <Input type="number" value={formData.durationDays} onChange={e => setFormData({...formData, durationDays: e.target.value})} className="bg-white border-slate-200 h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Média Diária</Label>
                <div className="h-12 bg-slate-50 border border-slate-200 rounded-md flex items-center px-4 font-bold text-primary">
                  R$ {(getRawBudget(formData.totalBudget) / (parseInt(formData.durationDays) || 1)).toFixed(2)} / dia
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" onClick={() => setStep(4)} className="h-12 rounded-full px-8"><ArrowLeft className="mr-2 w-4 h-4" /> Voltar</Button>
            <Button onClick={nextStep} className="h-12 px-10 rounded-full">Revisar Campanha <ArrowRight className="ml-2 w-4 h-4" /></Button>
          </CardFooter>
        </Card>
      )}

      {step === 6 && (step === 6) && (
        <Card className="bg-white border-primary/30 shadow-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-white/5">
            <CardTitle className="font-headline text-2xl flex items-center gap-3">
              <Sparkles className="text-primary w-6 h-6" />
              Conferência Final
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <SummaryItem label="Título do Anúncio" value={formData.title} />
                <SummaryItem label="Canais de Entrega" value={formData.platforms.join(", ").toUpperCase()} />
                <SummaryItem label="Abrangência" value={locationType === 'national' ? 'Brasil (Nacional)' : `${selectedStates.length} Estados Selecionados`} />
              </div>
              <div className="space-y-6">
                 <div className="p-6 bg-primary/10 rounded-[2rem] border border-primary/20 space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Orçamento de Orquestração</h4>
                    <div className="text-4xl font-black text-primary font-headline tracking-tighter">R$ {formData.totalBudget}</div>
                    <div className="pt-4 border-t border-primary/10">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase leading-relaxed">
                        Poder Real de Mídia: R$ {(getRawBudget(formData.totalBudget) * 0.85).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-[8px] text-muted-foreground mt-1 italic">
                        Taxa Orion (15%) inclusa para suporte e IA.
                      </p>
                    </div>
                 </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between bg-slate-50 border-t border-slate-100 p-8">
            <Button variant="ghost" onClick={() => setStep(5)} className="h-12 px-8 rounded-full font-bold">Ajustar Detalhes</Button>
            <Button onClick={handleFinish} disabled={loading} className="bg-primary hover:bg-primary/90 px-16 h-14 rounded-full font-bold text-lg shadow-xl shadow-primary/20 group">
              {loading ? <Loader2 className="animate-spin mr-2" /> : (
                <>
                  ATIVAR ORQUESTRAÇÃO
                  <Rocket className="ml-3 w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: any) {
  return (
    <div className="space-y-1.5">
      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-base font-bold text-slate-900 leading-tight">{value}</div>
    </div>
  );
}
