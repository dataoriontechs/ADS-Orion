
import { NextRequest, NextResponse } from 'next/server';
import { TikTokOAuthService } from '@/services/tiktok/oauth.service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });

  const authUrl = TikTokOAuthService.getAuthUrl(userId);
  return NextResponse.redirect(authUrl);
}
