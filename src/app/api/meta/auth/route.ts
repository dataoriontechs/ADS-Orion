
import { NextRequest, NextResponse } from 'next/server';
import { MetaOAuthService } from '@/services/meta/oauth.service';

/**
 * Rota para iniciar o fluxo de autenticação da Meta.
 * Redireciona o usuário para o diálogo de login do Facebook.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
  }

  // O 'state' é usado para segurança e para recuperar o userId no callback
  const authUrl = MetaOAuthService.getAuthUrl(userId);

  return NextResponse.redirect(authUrl);
}
