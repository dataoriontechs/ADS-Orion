
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Rocket, Loader2, AlertCircle } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // E-mails com privilégios automáticos de ADMIN (Fonte da Verdade)
  const ADMIN_EMAILS = ['dataoriontech@gmail.com', 'dataoriontechs@gmail.com'];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await syncUser(result.user, 'password');
    } catch (error: any) {
      toast({ 
        title: "Erro no login", 
        description: error.message || "Verifique suas credenciais.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      await syncUser(result.user, 'google');
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      let errorMsg = "Autenticação cancelada ou falhou.";
      
      if (error.code === 'auth/popup-blocked') {
        errorMsg = "O popup foi bloqueado pelo seu navegador. Permita popups para este site.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMsg = "Este domínio não está autorizado no Firebase Console.";
      }
      
      toast({ 
        title: "Erro com Google", 
        description: errorMsg, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const syncUser = async (user: any, provider: string) => {
    if (!db) return;
    
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    // Verificação de Role (RBAC)
    const isSystemAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '');
    let role = isSystemAdmin ? 'ADMIN' : 'USER';
    let status = 'ACTIVE';

    if (!userSnap.exists()) {
      const userData = {
        uid: user.uid,
        name: user.displayName || 'Usuário Orion',
        email: user.email,
        photoURL: user.photoURL || '',
        role: role,
        status: 'ACTIVE',
        provider: provider,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };

      await setDoc(userRef, userData);

      // Inicialização financeira segura
      await setDoc(doc(db, `users/${user.uid}/wallet`, 'balance'), {
        balanceVisible: 0,
        balanceReal: 0,
        totalInvested: 0,
        totalCampaigns: 0,
        walletStatus: 'ACTIVE',
        updatedAt: serverTimestamp()
      });

      toast({ title: "Login Realizado", description: `Bem vindo de volta, ${userData.name}` });
    } else {
      const data = userSnap.data();
      status = data.status || 'ACTIVE';

      if (status !== 'ACTIVE') {
        throw new Error('Esta conta está desativada. Contate o suporte.');
      }

      // Sincroniza papel e dados de login
      await updateDoc(userRef, {
        role: role, // Força papel administrativo se e-mail estiver na lista master
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
        photoURL: user.photoURL || data.photoURL || ''
      });

      const finalName = data.name || data.displayName || user.displayName || 'Membro';
      toast({ title: "Login Realizado", description: `Bem vindo de volta, ${finalName}` });
    }

    // Redirecionamento seguro baseado em Role
    router.push(role === 'ADMIN' ? '/admin' : '/user');
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Serviço Indisponível</AlertTitle>
          <AlertDescription>O Firebase não pôde ser inicializado. Verifique sua conexão ou configurações.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Rocket className="text-white w-7 h-7" />
            </div>
            <span className="font-headline text-2xl font-black tracking-tighter uppercase">
              ADS <span className="text-primary">ORION</span>
            </span>
          </Link>
          <h1 className="text-3xl font-headline font-bold">Acesso ao Comando</h1>
          <p className="text-muted-foreground">Gerencie sua orquestração global.</p>
        </div>

        <Card className="glass border-slate-200 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline">Entrar na Plataforma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGoogleLogin}
              variant="outline" 
              className="w-full h-12 border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center gap-3 transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Login com Google
                </>
              )}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Ou com e-mail</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nome@empresa.com" 
                  className="bg-white border-slate-200 h-11" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-primary hover:underline transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  className="h-11 bg-white border-slate-200" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Entrar Agora'}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground text-center w-full">
              Não tem conta? <Link href="/register" className="text-primary hover:underline">Criar agora</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
