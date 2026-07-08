
"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MoreVertical, 
  UserPlus, 
  Trash2, 
  Loader2, 
  Wallet, 
  ShieldAlert, 
  ShieldCheck,
  UserCog,
  ArrowUpDown
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, updateDoc, increment, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function AdminUsersPage() {
  const db = useFirestore();
  const { user: adminUser } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkRole() {
      if (adminUser && db) {
        const userDoc = await getDoc(doc(db, 'users', adminUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'ADMIN') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.push('/user');
        }
      }
    }
    if (adminUser) checkRole();
  }, [adminUser, db, router]);

  const usersQuery = useMemo(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  }, [db, isAdmin]);

  const { data: users, loading: usersLoading } = useCollection(usersQuery);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createLog = async (action: string, details: string, type: 'info' | 'warning' | 'critical' = 'info') => {
    if (!db || !adminUser) return;
    await addDoc(collection(db, 'logs'), {
      userId: adminUser.uid,
      userName: adminUser.displayName || adminUser.email,
      action,
      details,
      type,
      createdAt: serverTimestamp()
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!db || !adminUser) return;
    if (id === adminUser.uid) return toast({ title: "Ação negada", description: "Você não pode se auto-excluir.", variant: "destructive" });

    if (confirm(`Tem certeza que deseja banir permanentemente o usuário ${name}?`)) {
      deleteDoc(doc(db, 'users', id))
        .then(() => {
          toast({ title: "Usuário removido", description: "A conta foi excluída da base de dados." });
          createLog('USER_DELETED', `Administrador baniu/excluiu o usuário "${name}" (${id}).`, 'critical');
        })
        .catch(() => {
          const error = new FirestorePermissionError({ path: `users/${id}`, operation: 'delete' });
          errorEmitter.emit('permission-error', error);
        });
    }
  };

  const handleAdjustBalance = async () => {
    if (!db || !selectedUser || !adjustAmount || !adminUser) return;
    const amount = parseFloat(adjustAmount);
    setLoading(true);
    
    updateDoc(doc(db, 'users', selectedUser.id), {
      balance: increment(amount)
    })
      .then(() => {
        toast({ title: "Saldo Ajustado", description: `R$ ${amount} processados na conta de ${selectedUser.name}.` });
        createLog('BALANCE_ADJUSTED', `Saldo de "${selectedUser.name}" ajustado em R$ ${amount}.`, 'warning');
        setIsAdjustOpen(false);
        setAdjustAmount('');
      })
      .catch(() => {
        const error = new FirestorePermissionError({ path: `users/${selectedUser.id}`, operation: 'update' });
        errorEmitter.emit('permission-error', error);
      })
      .finally(() => setLoading(false));
  };

  const handleChangeRole = async (newRole: 'ADMIN' | 'USER') => {
    if (!db || !selectedUser || !adminUser) return;
    
    if (selectedUser.role === newRole) {
      setIsRoleOpen(false);
      return;
    }

    setLoading(true);
    updateDoc(doc(db, 'users', selectedUser.id), {
      role: newRole
    })
      .then(() => {
        toast({ title: "Cargo Alterado", description: `${selectedUser.name} agora é ${newRole}.` });
        createLog('ROLE_CHANGED', `Papel de "${selectedUser.name}" alterado para ${newRole}.`, 'warning');
        setIsRoleOpen(false);
      })
      .catch(() => {
        const error = new FirestorePermissionError({ path: `users/${selectedUser.id}`, operation: 'update' });
        errorEmitter.emit('permission-error', error);
      })
      .finally(() => setLoading(false));
  };

  if (isAdmin === null || (isAdmin && usersLoading)) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-sm text-muted-foreground">Listando membros da rede Orion...</p>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold">Gestão de Membros</h2>
          <p className="text-muted-foreground">Controle total sobre contas, saldos e permissões da plataforma.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 h-8 flex items-center px-4 font-bold">
            {users.length} Usuários Ativos
          </Badge>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou e-mail..." 
              className="pl-10 h-11 bg-white border-slate-200 shadow-sm" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <Button variant="outline" className="hidden md:flex gap-2 border-slate-200">
            <ArrowUpDown className="w-4 h-4" /> Ordenar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 text-[10px] uppercase font-bold text-muted-foreground">
                <TableHead>Usuário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Saldo Real</TableHead>
                <TableHead>Membro Desde</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                        <AvatarFallback className="bg-slate-100 text-primary font-bold text-xs">
                          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm flex items-center gap-2">
                          {user.name || 'Sem Nome'}
                          {user.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-primary" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[9px] uppercase font-bold tracking-tighter ${user.role === 'ADMIN' ? 'border-primary text-primary bg-primary/5' : 'border-slate-200'}`}>
                      {user.role === 'ADMIN' ? 'Administrador' : 'Membro'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-green-600">
                        R$ {user.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase">Créditos Ativos</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-slate-100 transition-colors cursor-pointer"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-slate-200 min-w-[180px]">
                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Financeiro</DropdownMenuLabel>
                        <DropdownMenuItem className="gap-2 cursor-pointer py-2" onClick={() => { setSelectedUser(user); setIsAdjustOpen(true); }}>
                          <Wallet className="w-4 h-4 text-primary" /> Ajustar Saldo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Conta</DropdownMenuLabel>
                        <DropdownMenuItem className="gap-2 cursor-pointer py-2" onClick={() => { setSelectedUser(user); setIsRoleOpen(true); }}>
                          <UserCog className="w-4 h-4 text-accent" /> Alterar Cargo
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 gap-2 cursor-pointer py-2" onClick={() => handleDelete(user.id, user.name || user.email)}>
                          <Trash2 className="w-4 h-4" /> Banir Conta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 opacity-20">
                       <Search className="w-12 h-12 mb-2" />
                       <p className="text-sm font-bold">Nenhum membro encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="bg-white border-slate-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2 text-primary">
              <Wallet className="w-5 h-5" />
              Ajuste de Saldo
            </DialogTitle>
            <DialogDescription>
              Você está alterando o saldo de <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valor (R$)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                <Input 
                  type="number" 
                  placeholder="Ex: 100.00" 
                  className="bg-white border-slate-200 h-14 pl-12 text-xl font-bold"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic">Use valores negativos para remover saldo (ex: -50).</p>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2">
            <Button onClick={handleAdjustBalance} disabled={loading || !adjustAmount} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 cursor-pointer">
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Confirmar Alteração Financeira"}
            </Button>
            <Button variant="ghost" onClick={() => setIsAdjustOpen(false)} className="w-full cursor-pointer">Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
        <DialogContent className="bg-white border-slate-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2 text-accent">
              <UserCog className="w-5 h-5" />
              Alterar Permissões
            </DialogTitle>
            <DialogDescription>
              Defina o nível de acesso para <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 grid grid-cols-2 gap-4">
            <Button 
              type="button"
              variant={selectedUser?.role === 'USER' ? 'default' : 'outline'} 
              className={`h-24 flex flex-col gap-2 border-slate-200 cursor-pointer ${selectedUser?.role === 'USER' ? 'bg-primary/10 border-primary text-primary' : ''}`}
              onClick={() => handleChangeRole('USER')}
              disabled={loading}
            >
              <UserPlus className="w-6 h-6" />
              <div className="flex flex-col text-center">
                <span className="font-bold">Membro</span>
                <span className="text-[9px] opacity-60">Acesso Padrão</span>
              </div>
            </Button>
            <Button 
              type="button"
              variant={selectedUser?.role === 'ADMIN' ? 'default' : 'outline'} 
              className={`h-24 flex flex-col gap-2 border-slate-200 cursor-pointer ${selectedUser?.role === 'ADMIN' ? 'bg-primary/10 border-primary text-primary' : ''}`}
              onClick={() => handleChangeRole('ADMIN')}
              disabled={loading}
            >
              <ShieldAlert className="w-6 h-6" />
              <div className="flex flex-col text-center">
                <span className="font-bold">Admin</span>
                <span className="text-[9px] opacity-60">Poder Total</span>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRoleOpen(false)} className="w-full cursor-pointer">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
