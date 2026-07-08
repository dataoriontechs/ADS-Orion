
import { NextRequest, NextResponse } from 'next/server';
import { MetaOAuthService } from '@/services/meta/oauth.service';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Rota de callback do OAuth da Meta.
 * Recebe o 'code', troca por token e salva no Firestore do usuário.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');

  const host = req.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

  if (!code || !userId) {
    return NextResponse.redirect(`${baseUrl}/user/integrations/meta?error=auth_failed`);
  }

  const { firestore } = initializeFirebase();
  
  if (!firestore) {
    console.error('Firebase failure during OAuth callback');
    return NextResponse.redirect(`${baseUrl}/user/integrations/meta?error=db_error`);
  }

  try {
    // 1. Troca o código pelo token
    const tokenData = await MetaOAuthService.exchangeCodeForToken(code);
    
    // 2. Pegar token de longa duração (60 dias)
    const longToken = await MetaOAuthService.getLongLivedToken(tokenData.access_token);

    // 3. Salva o token no perfil do usuário
    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
      metaAccessToken: longToken.access_token,
      metaConnectedAt: serverTimestamp(),
      metaIntegrationStatus: 'active'
    });

    return NextResponse.redirect(`${baseUrl}/user/integrations/meta?success=true`);
  } catch (error) {
    console.error('Meta Callback Error:', error);
    return NextResponse.redirect(`${baseUrl}/user/integrations/meta?error=token_exchange_failed`);
  }
}
