
import axios from 'axios';

/**
 * @fileOverview Service para gerenciar o fluxo OAuth 2.0 com TikTok Marketing API.
 */

const APP_ID = process.env.TIKTOK_APP_ID;
const SECRET = process.env.TIKTOK_SECRET;
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI;

export class TikTokOAuthService {
  static getAuthUrl(state: string): string {
    const url = new URL('https://business-api.tiktok.com/portal/auth');
    url.searchParams.append('app_id', APP_ID || '');
    url.searchParams.append('state', state);
    url.searchParams.append('redirect_uri', REDIRECT_URI || '');
    
    return url.toString();
  }

  static async exchangeCodeForToken(code: string) {
    try {
      const response = await axios.post('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
        app_id: APP_ID,
        secret: SECRET,
        auth_code: code,
      });

      if (response.data.code !== 0) {
        throw new Error(response.data.message);
      }

      return response.data.data; // access_token, refresh_token
    } catch (error: any) {
      console.error('TikTok Token Exchange Error:', error.message);
      throw new Error('Falha ao autenticar com TikTok Ads.');
    }
  }
}
