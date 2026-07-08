
"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Bell, 
  Save,
  Camera,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadToCloudinary } from '@/app/actions/cloudinary';

export default function SettingsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Monitoramento do perfil no Firestore para sincronização global
  const userDocRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [fileToUpload, setFileToUpload] = useState<string | null>(null);
  
  // Sincroniza estados locais com dados do Firestore quando carregados
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setProfilePhoto(profile.photoURL || null);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user || !db) return;
    setLoading(true);
    try {
      let finalPhotoUrl = profilePhoto;

      // Se houver um novo arquivo selecionado, faz o upload para o Cloudinary primeiro
      if (fileToUpload) {
        const uploadRes = await uploadToCloudinary(fileToUpload, 'profiles');
        finalPhotoUrl = uploadRes.url;
      }

      // Atualização na coleção 'users' do Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName,
        photoURL: finalPhotoUrl || null,
        updatedAt: new Date().toISOString()
      });

      setFileToUpload(null);
      toast({
        title: "Perfil Atualizado",
        description: "Suas informações e foto de perfil foram salvas na rede Orion.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar seu perfil agora. Verifique suas chaves do Cloudinary.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast({ title: "Arquivo muito grande", description: "O limite para foto de perfil é de 2MB.", variant: "destructive" });
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfilePhoto(base64); // Atualiza preview local
        setFileToUpload(base64); // Agenda para upload no Cloudinary
        toast({ title: "Foto carregada", description: "Clique em salvar para confirmar as alterações no servidor." });
      };
      reader.readAsDataURL(file);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const userInitial = displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-headline font-bold">Configurações</h2>
        <p className="text-muted-foreground">Gerencie sua identidade digital e preferências na rede Orion.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-100 border border-slate-200 p-1 h-12">
          <TabsTrigger value="profile" className="gap-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <User className="w-4 h-4" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bell className="w-4 h-4" /> Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 outline-none">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Perfil Orion</CardTitle>
              <CardDescription>Atualize sua imagem de exibição e nome público.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
                <div className="relative group">
                  <Avatar className="w-40 h-40 rounded-[2rem] border-4 border-slate-50 shadow-2xl transition-transform group-hover:scale-[1.02]">
                    <AvatarImage src={profilePhoto || undefined} className="object-cover" />
                    <AvatarFallback className="bg-slate-100 text-primary font-bold text-5xl border border-slate-200">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-[2rem] flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-2 border-primary/50"
                  >
                    <Camera className="w-10 h-10 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Carregar Foto</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePhotoChange}
                  />
                </div>
                
                <div className="flex-1 grid gap-6 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-primary font-bold">Nome de Membro</Label>
                      <Input 
                        id="name" 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="bg-white border-slate-200 h-12 text-lg shadow-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail Cadastrado</Label>
                      <Input id="email" defaultValue={user?.email || ''} className="bg-slate-50 border-slate-200 h-12 opacity-70" disabled />
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <strong>Privacidade e Segurança:</strong> Sua foto e nome são armazenados na tabela de usuários e refletem em tempo real no seu painel. Certifique-se de estar em conformidade com as Políticas de Privacidade Orion. As mídias são hospedadas no servidor Cloudinary.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-100 pt-6 bg-slate-50/50">
              <Button onClick={handleSaveProfile} disabled={loading} className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 h-12 px-10 rounded-full shadow-lg shadow-primary/20">
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                Salvar Alterações de Perfil
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 outline-none">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Central de Avisos</CardTitle>
              <CardDescription>Defina como o sistema deve entrar em contato com você.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Canais de E-mail</h4>
                <NotificationToggle label="Sumário Semanal de Performance" description="Resultados consolidados de todas as suas redes ativas." defaultChecked />
                <NotificationToggle label="Alertas Financeiros Críticos" description="Avisar quando o saldo atingir o limite de segurança." defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationToggle({ label, description, defaultChecked }: { label: string, description: string, defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="space-y-0.5">
        <Label className="text-base font-bold text-slate-700">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
