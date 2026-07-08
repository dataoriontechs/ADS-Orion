
import { NextRequest, NextResponse } from 'next/server';
import { GoogleOAuthService } from '@/services/google/oauth.service';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');
  
  const host = req.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

  if (!code || !userId) return NextResponse.redirect(`${baseUrl}/user/integrations/google?error=auth_failed`);

  const { firestore } = initializeFirebase();
  if (!firestore) return NextResponse.redirect(`${baseUrl}/user/integrations/google?error=db_error`);

  try {
    const tokens = await GoogleOAuthService.exchangeCodeForTokens(code);
    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleConnectedAt: serverTimestamp(),
      googleIntegrationStatus: 'active'
    });

    return NextResponse.redirect(`${baseUrl}/user/integrations/google?success=true`);
  } catch (error) {
    return NextResponse.redirect(`${baseUrl}/user/integrations/google?error=token_exchange_failed`);
  }
}
