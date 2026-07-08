
import { NextRequest, NextResponse } from 'next/server';
import { MetaApiService } from '@/services/meta/meta.service';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Endpoint interno para listar contas de anúncios da Meta do usuário logado.
 * Proteção contra falhas de configuração e tokens ausentes.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });
  }

  const { firestore } = initializeFirebase();
  if (!firestore) {
    return NextResponse.json({ error: 'Firebase não configurado no servidor.', code: 'FIREBASE_OFFLINE' }, { status: 503 });
  }

  try {
    const userSnap = await getDoc(doc(firestore, 'users', userId));
    
    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Perfil de usuário não encontrado.' }, { status: 404 });
    }

    const userData = userSnap.data();
    const token = userData?.metaAccessToken;

    if (!token) {
      return NextResponse.json({ 
        error: 'Meta Ads não conectada para este usuário.', 
        code: 'NOT_CONNECTED' 
      }, { status: 403 });
    }

    const adAccounts = await MetaApiService.getAdAccounts(token);

    return NextResponse.json({ adAccounts });
  } catch (error: any) {
    console.error('API Meta AdAccounts Error:', error.message);
    
    // Se o erro for de autenticação da própria Meta API
    if (error.response?.status === 401) {
      return NextResponse.json({ error: 'Token da Meta expirado ou inválido.', code: 'AUTH_EXPIRED' }, { status: 401 });
    }

    return NextResponse.json({ 
      error: error.message || 'Erro ao listar contas Ads.',
      code: 'API_ERROR'
    }, { status: 500 });
  }
}
