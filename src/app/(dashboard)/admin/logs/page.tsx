'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Activity, 
  Search, 
  Clock, 
  User, 
  ShieldAlert, 
  Info, 
  AlertTriangle, 
  Loader2,
  Filter
} from 'lucide-react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminLogsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function checkRole() {
      if (user && db) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role?.toUpperCase() === 'ADMIN') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.push('/user');
        }
      }
    }
    if (user) checkRole();
  }, [user, db, router]);

  const logsQuery = useMemo(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'logs'), orderBy('createdAt', 'desc'), limit(100));
  }, [db, isAdmin]);

  const { data: logs, loading } = useCollection(logsQuery);

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAdmin === null || (isAdmin && loading)) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-sm text-muted-foreground">Recuperando registros de auditoria...</p>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-headline font-bold">Logs do Systema</h2>
          <p className="text-muted-foreground">Auditoria completa de ações críticas realizadas na Orion.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            {logs.length} Registros Recentes
          </Badge>
        </div>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por ação, usuário ou detalhe..." 
              className="pl-10 h-11 bg-white border-slate-200 shadow-sm" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="border-slate-100">
              <TableRow className="hover:bg-transparent border-slate-100 text-[10px] uppercase font-bold text-muted-foreground">
                <TableHead>Horário</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead className="text-right">Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50 border-slate-100">
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toLocaleString('pt-BR') : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {log.userName?.charAt(0) || <User className="w-3 h-3" />}
                      </div>
                      <span className="text-xs font-medium">{log.userName || 'Sistema'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-bold uppercase tracking-tighter">{log.action}</span>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-[11px] text-muted-foreground truncate" title={log.details}>
                      {log.details}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={`text-[8px] uppercase font-bold ${
                      log.type === 'critical' ? 'border-red-500 text-red-500 bg-red-500/5' :
                      log.type === 'warning' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/5' :
                      'border-primary/40 text-primary bg-primary/5'
                    }`}>
                      {log.type}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Activity className="w-12 h-12 opacity-10" />
                      <p className="text-sm">Nenhum log encontrado para esta busca.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}