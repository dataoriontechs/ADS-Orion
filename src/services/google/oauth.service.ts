
import axios from 'axios';

/**
 * @fileOverview Service para gerenciar o fluxo OAuth 2.0 com Google Ads.
 */

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export class GoogleOAuthService {
  static getAuthUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/adwords',
      'openid',
      'email',
      'profile'
    ];

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.append('client_id', CLIENT_ID || '');
    url.searchParams.append('redirect_uri', REDIRECT_URI || '');
    url.searchParams.append('state', state);
    url.searchParams.append('scope', scopes.join(' '));
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('access_type', 'offline');
    url.searchParams.append('prompt', 'consent');

    return url.toString();
  }

  static async exchangeCodeForTokens(code: string) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
        grant_type: 'authorization_code',
      });

      return response.data; // access_token, refresh_token, expires_in
    } catch (error: any) {
      console.error('Google Token Exchange Error:', error.response?.data || error.message);
      throw new Error('Falha ao autenticar com Google Ads.');
    }
  }

  static async refreshAccessToken(refreshToken: string) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });
      return response.data.access_token;
    } catch (error) {
      console.error('Google Token Refresh Error:', error);
      throw new Error('Falha ao renovar token do Google.');
    }
  }
}
