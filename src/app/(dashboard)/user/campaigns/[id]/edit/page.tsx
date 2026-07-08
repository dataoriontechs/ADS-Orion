"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Upload,
  Check,
  Search,
  PlusCircle,
  Hash,
  X,
  MapPin,
  Globe,
  Settings2,
  Zap,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp, arrayUnion, addDoc, collection } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { uploadToCloudinary } from '@/app/actions/cloudinary';

export default function EditCampaignWizard() {
  const { id } = useParams();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const campaignRef = useMemo(() => (db && id ? doc(db, 'campaigns', id as string) : null), [db, id]);
  const { data: campaign, loading: campaignLoading } = useDoc(campaignRef);

  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<string | null>(null);

  const [locationType, setLocationType] = useState<'national' | 'states'>('national');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]); 
  const [keywords, setKeywords] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destinationUrl: '',
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        title: campaign.name || '',
        description: campaign.description || '',
        destinationUrl: campaign.destinationUrl || '',
      });
      setLocationType(campaign.targeting?.locationType || 'national');
      setSelectedStates(campaign.targeting?.selectedStates || []);
      setSelectedCities(campaign.targeting?.selectedCities || []);
      setKeywords(campaign.targeting?.keywords || []);
      setPreviewUrl(campaign.creativeUrl || null);
    }
  }, [campaign]);

  const handleUpdate = async () => {
    if (!user || !db || !id) return;
    setLoading(true);
    
    try {
      let finalCreativeUrl = previewUrl || "";
      if (fileToUpload) {
        const uploadRes = await uploadToCloudinary(fileToUpload, 'campaigns');
        finalCreativeUrl = uploadRes.url;
      }

      const updatePayload = {
        name: formData.title,
        description: formData.description,
        destinationUrl: formData.destinationUrl,
        targeting: {
          locationType,
          selectedStates,
          selectedCities,
          keywords
        },
        creativeUrl: finalCreativeUrl,
        status: 'Ativa',
        internalStatus: 'Aguardando atualização operacional',
        updatedAt: serverTimestamp(),
        history: arrayUnion({
          type: 'user_edit',
          date: new Date().toISOString(),
          user: user.displayName || user.email,
          details: 'O anunciante atualizou dados estratégicos. Aguardando sincronização operacional.'
        })
      };

      await updateDoc(doc(db, 'campaigns', id as string), updatePayload);
      
      // Log Global para o Admin
      await addDoc(collection(db, 'logs'), {
        userId: user.uid,
        userName: user.displayName || user.email,
        action: 'CAMPAIGN_EDITED_BY_USER',
        details: `Usuário alterou a campanha "${formData.title}". Sincronização pendente.`,
        type: 'warning',
        createdAt: serverTimestamp()
      });

      toast({ 
        title: "🚀 Orquestração em Atualização", 
        description: "Suas mudanças foram salvas e nossa equipe sincronizará os anúncios agora." 
      });
      router.push('/user/campaigns');
    } catch (err) {
      toast({ title: "Erro na atualização", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (campaignLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white/5"><ArrowLeft /></Button>
        <div>
          <h2 className="text-3xl font-headline font-bold flex items-center gap-2">
            <Settings2 className="text-primary w-7 h-7" />
            Ajustar Orquestração
          </h2>
          <p className="text-muted-foreground text-sm">Modifique sua estratégia e ative a sincronização em tempo real.</p>
        </div>
      </div>

      <Card className="glass border-white/5 overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-white/5">
           <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
             <Zap className="w-4 h-4 text-primary" /> Conteúdo e Destino
           </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-primary uppercase">Título do Anúncio</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-white/5 h-12" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-primary uppercase">Copy (Texto Persuasivo)</Label>
            <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/5 min-h-[120px]" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-primary uppercase">Link de Destino</Label>
            <Input value={formData.destinationUrl} onChange={e => setFormData({...formData, destinationUrl: e.target.value})} className="bg-white/5 h-12" />
          </div>
          
          <div className="pt-8 border-t border-white/5">
            <Button onClick={handleUpdate} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-2xl shadow-xl shadow-primary/20 text-lg group">
              {loading ? <Loader2 className="animate-spin mr-2" /> : (
                <>
                   SALVAR E ATUALIZAR OPERAÇÃO
                   <Rocket className="ml-3 w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </Button>
            <div className="flex items-center justify-center gap-2 mt-6 text-muted-foreground">
               <Clock className="w-3.5 h-3.5" />
               <p className="text-[10px] font-bold uppercase tracking-widest">Sincronização estimada: 15 a 45 minutos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
