
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAdsService } from '@/services/google/googleads.service';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Endpoint para listar contas acessíveis no Google Ads para o usuário logado.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'ID do usuário obrigatório.' }, { status: 400 });
  }

  const { firestore } = initializeFirebase();
  if (!firestore) {
    return NextResponse.json({ error: 'Serviço de banco de dados indisponível.' }, { status: 500 });
  }

  try {
    const userSnap = await getDoc(doc(firestore, 'users', userId));
    
    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const userData = userSnap.data();
    const token = userData.googleAccessToken;

    if (!token) {
      return NextResponse.json({ error: 'Google Ads não conectado.', code: 'NOT_CONNECTED' }, { status: 403 });
    }

    // Busca clientes/contas acessíveis
    const customers = await GoogleAdsService.getAccessibleCustomers(token);
    
    return NextResponse.json({ adAccounts: customers });
  } catch (error: any) {
    console.error('[API Google AdAccounts Error]:', error);
    return NextResponse.json({ error: error.message || 'Erro ao listar contas Google.' }, { status: 500 });
  }
}
