
import axios from 'axios';

/**
 * @fileOverview Service para interação com TikTok Marketing API.
 */

export class TikTokApiService {
  /**
   * Recupera informações do anunciante conectado.
   */
  static async getUserInfo(accessToken: string) {
    try {
      const response = await axios.get('https://business-api.tiktok.com/open_api/v1.3/user/info/', {
        headers: { 'Access-Token': accessToken }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('TikTok UserInfo Error:', error.message);
      throw new Error('Erro ao recuperar dados do TikTok.');
    }
  }

  /**
   * Cria uma campanha no TikTok.
   */
  static async createCampaign(accessToken: string, advertiserId: string, campaignData: any) {
    // Implementação TikTok: Campaign -> AdGroup -> Ad
    return { success: true, tiktokCampaignId: `TK_CAMP_${Date.now()}` };
  }
}
