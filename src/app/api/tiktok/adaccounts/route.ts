
import { NextRequest, NextResponse } from 'next/server';
import { TikTokApiService } from '@/services/tiktok/tiktok.service';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Endpoint para listar informações do anunciante no TikTok.
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
    const token = userData.tiktokAccessToken;

    if (!token) {
      return NextResponse.json({ error: 'TikTok Ads não conectado.', code: 'NOT_CONNECTED' }, { status: 403 });
    }

    const userInfo = await TikTokApiService.getUserInfo(token);
    
    // Simplificando o retorno para o padrão da UI
    const adAccount = {
      id: userInfo.advertiser_id || userInfo.id,
      name: userInfo.display_name || userInfo.username || 'Conta TikTok',
      currency: 'BRL',
      account_status: 1
    };

    return NextResponse.json({ adAccounts: [adAccount] });
  } catch (error: any) {
    console.error('[API TikTok AdAccounts Error]:', error);
    return NextResponse.json({ error: error.message || 'Erro ao recuperar dados do TikTok.' }, { status: 500 });
  }
}
