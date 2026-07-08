
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Rocket, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email) return;
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast({ 
        title: "E-mail enviado", 
        description: "Verifique sua caixa de entrada para redefinir a senha." 
      });
    } catch (error: any) {
      toast({ 
        title: "Erro ao enviar e-mail", 
        description: "Verifique se o e-mail está correto ou tente novamente mais tarde.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-headline font-bold">Recuperar Senha</h1>
          <p className="text-muted-foreground">Enviaremos um link para você voltar ao comando.</p>
        </div>

        <Card className="glass border-slate-200">
          {sent ? (
            <CardContent className="pt-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Verifique seu E-mail</h3>
                <p className="text-sm text-muted-foreground">
                  As instruções para criar uma nova senha foram enviadas para <span className="text-slate-900 font-medium">{email}</span>.
                </p>
              </div>
              <Button asChild className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold">
                <Link href="/login">Voltar para o Login</Link>
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="font-headline">Esqueceu sua senha?</CardTitle>
                <CardDescription>Insira seu e-mail cadastrado para receber o link de redefinição.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        id="email" 
                        type="email" 
                        placeholder="seu@email.com" 
                        className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-10 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : 'Enviar Link de Redefinição'}
                  </Button>
                </form>
              </CardContent>
              <CardFooter>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mx-auto transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Voltar para o login
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
