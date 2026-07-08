
import axios from 'axios';

/**
 * @fileOverview Service para gerenciar o fluxo OAuth com a Meta (Facebook).
 */

const APP_ID = process.env.META_APP_ID;
const APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.META_REDIRECT_URI;
const GRAPH_API_VERSION = 'v23.0';

export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class MetaOAuthService {
  /**
   * Gera a URL de login do Facebook com os escopos necessários.
   */
  static getAuthUrl(state: string): string {
    const scopes = [
      'ads_management',
      'ads_read',
      'business_management',
      'public_profile',
      'email'
    ];

    const url = new URL('https://www.facebook.com/v23.0/dialog/oauth');
    url.searchParams.append('client_id', APP_ID || '');
    url.searchParams.append('redirect_uri', REDIRECT_URI || '');
    url.searchParams.append('state', state);
    url.searchParams.append('scope', scopes.join(','));
    url.searchParams.append('response_type', 'code');

    return url.toString();
  }

  /**
   * Troca o código recebido no callback por um access_token de curta duração.
   */
  static async exchangeCodeForToken(code: string): Promise<MetaTokenResponse> {
    try {
      const response = await axios.get(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`, {
        params: {
          client_id: APP_ID,
          client_secret: APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error exchanging Meta code for token:', error.response?.data || error.message);
      throw new Error('Falha ao autenticar com Meta Ads.');
    }
  }

  /**
   * (Opcional) Troca um token de curta duração por um de longa duração (60 dias).
   */
  static async getLongLivedToken(shortToken: string): Promise<MetaTokenResponse> {
    try {
      const response = await axios.get(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: APP_ID,
          client_secret: APP_SECRET,
          fb_exchange_token: shortToken,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting long-lived token:', error.response?.data || error.message);
      throw new Error('Falha ao estender token da Meta.');
    }
  }
}
