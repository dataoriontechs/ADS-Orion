
import { NextRequest, NextResponse } from 'next/server';
import { TikTokOAuthService } from '@/services/tiktok/oauth.service';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

  if (!code || !userId) return NextResponse.redirect(`${baseUrl}/user/integrations/tiktok?error=auth_failed`);

  const { firestore } = initializeFirebase();
  if (!firestore) return NextResponse.redirect(`${baseUrl}/user/integrations/tiktok?error=db_error`);

  try {
    const data = await TikTokOAuthService.exchangeCodeForToken(code);
    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
      tiktokAccessToken: data.access_token,
      tiktokRefreshToken: data.refresh_token,
      tiktokConnectedAt: serverTimestamp(),
      tiktokIntegrationStatus: 'active'
    });

    return NextResponse.redirect(`${baseUrl}/user/integrations/tiktok?success=true`);
  } catch (error) {
    return NextResponse.redirect(`${baseUrl}/user/integrations/tiktok?error=token_exchange_failed`);
  }
}
