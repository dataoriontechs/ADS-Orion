
'use client';

import { SidebarProvider, SidebarInset, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Rocket, 
  Wallet, 
  BarChart2, 
  Settings, 
  LogOut, 
  Users, 
  ShieldCheck,
  BrainCircuit,
  Loader2,
  MessageSquare,
  Bell,
  Activity,
  HelpCircle,
  Info,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useEffect, useState, useMemo } from 'react';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { PriorityNotificationModal } from '@/components/notifications/PriorityNotificationModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<'ADMIN' | 'USER' | null>(null);
  const [fetchingRole, setFetchingRole] = useState(true);

  const userRef = useMemo(() => (db && user ? doc(db, 'users', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(userRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router, mounted]);

  useEffect(() => {
    async function fetchUserRole() {
      if (user && db && mounted) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const userRole = data.role?.toUpperCase(); 
            const status = data.status || 'ACTIVE';

            if (status !== 'ACTIVE') {
              toast({ title: "Acesso Negado", description: "Sua conta está suspensa. Contate o suporte.", variant: "destructive" });
              await signOut(auth!);
              router.push('/login');
              return;
            }

            setRole(userRole);
            
            // PROTEÇÃO DE ROTA ADMINISTRATIVA: Validação em tempo real
            if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
              // Registrar tentativa de intrusão
              await addDoc(collection(db, 'logs'), {
                userId: user.uid,
                userName: user.displayName || user.email,
                action: 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
                details: `Tentativa de acesso bloqueada à rota: ${pathname}`,
                type: 'critical',
                createdAt: serverTimestamp()
              });
              
              toast({ 
                title: "Segurança Orion", 
                description: "Área restrita. Sua tentativa de acesso foi registrada.", 
                variant: "destructive" 
              });
              router.push('/user');
            }
          } else {
            setRole('USER');
          }
        } catch (error) {
          console.error("Erro ao verificar permissões:", error);
        }
      }
      setFetchingRole(false);
    }
    if (user && mounted) fetchUserRole();
    else if (!loading && mounted) setFetchingRole(false);
  }, [user, db, pathname, router, loading, auth, mounted]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  if (!mounted || loading || fetchingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Autenticando Permissões...</p>
        </div>
      </div>
    );
  }

  const userName = profile?.name || profile?.displayName || user?.displayName || 'Usuário';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-16 flex items-center px-4">
          <Link href={role === 'ADMIN' ? '/admin' : '/user'} className="flex items-center gap-2">
            <Rocket className="text-primary w-6 h-6" />
            <span className="font-headline font-black text-lg tracking-tighter uppercase group-data-[collapsible=icon]:hidden">
              ADS <span className="text-primary">ORION</span>
            </span>
          </Link>
        </SidebarHeader>
        
        <SidebarContent>
          {(role === 'USER') && (
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="Dashboard" isActive={pathname === '/user'}><Link href="/user"><LayoutDashboard /><span>Dashboard</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="Campanhas" isActive={pathname === '/user/campaigns'}><Link href="/user/campaigns"><Rocket /><span>Campanhas</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="IA Assistente" isActive={pathname === '/user/ai'}><Link href="/user/ai"><BrainCircuit /><span>Orion AI</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="Financeiro" isActive={pathname === '/user/wallet'}><Link href="/user/wallet"><Wallet /><span>Financeiro</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="Relatórios" isActive={pathname === '/user/reports'}><Link href="/user/reports"><BarChart2 /><span>Relatórios</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/user/support'}><Link href="/user/support"><HelpCircle /><span>Suporte</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === '/user/faq'}><Link href="/user/faq"><Info /><span>FAQ</span></Link></SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          )}

          {(role === 'ADMIN') && (
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="Visão Global" isActive={pathname === '/admin'}><Link href="/admin"><ShieldCheck /><span>Visão Global</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="Usuários" isActive={pathname === '/admin/users'}><Link href="/admin/users"><Users /><span>Membros</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="Campanhas" isActive={pathname === '/admin/campaigns'}><Link href="/admin/campaigns"><Rocket /><span>Operação</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="Financeiro" isActive={pathname === '/admin/finance'}><Link href="/admin/finance"><Wallet /><span>Fluxo Caixa</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="Relatórios" isActive={pathname === '/admin/reports'}><Link href="/admin/reports"><BarChart2 /><span>Analytics</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="Suporte" isActive={pathname === '/admin/support'}><Link href="/admin/support"><MessageSquare /><span>Atendimento</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="Notificações" isActive={pathname === '/admin/notifications'}><Link href="/admin/notifications"><Bell /><span>Avisos</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="Configurações" isActive={pathname === '/admin/settings'}><Link href="/admin/settings"><Settings /><span>Regras</span></Link></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild tooltip="Logs" isActive={pathname === '/admin/logs'}><Link href="/admin/logs"><Activity /><span>Logs</span></Link></SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarContent>

        <SidebarFooter className="p-4 border-t">
          <SidebarMenu>
            <SidebarMenuItem><SidebarMenuButton asChild tooltip="Configurações" isActive={pathname === '/user/settings'}><Link href="/user/settings"><Settings /><span>Perfil</span></Link></SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton onClick={handleLogout} className="text-destructive hover:text-destructive"><LogOut /><span>Sair</span></SidebarMenuButton></SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="h-16 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-lg font-headline font-black tracking-tight">
              {role === 'ADMIN' ? 'ADMINISTRAÇÃO' : 'ADS ORION'}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
             <NotificationBell />
             
             <div className="flex items-center gap-3">
               <div className="flex flex-col items-end mr-2">
                 <span className="text-xs font-bold">{userName}</span>
                 <span className="text-[10px] text-muted-foreground uppercase">{role === 'ADMIN' ? 'Admin' : 'Membro'}</span>
               </div>
               <Avatar className="w-8 h-8 border">
                 <AvatarImage src={profile?.photoURL || undefined} />
                 <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitial}</AvatarFallback>
               </Avatar>
             </div>
          </div>
        </header>

        <main className="p-6 md:p-8 flex-1">
          {children}
          <PriorityNotificationModal />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
