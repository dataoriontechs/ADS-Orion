
import axios from 'axios';

/**
 * @fileOverview Service avançado para orquestração total na Meta Marketing API.
 * Gerencia o ciclo de vida completo: Mídia -> Campanha -> AdSet -> Creative -> Ad.
 */

const GRAPH_API_VERSION = 'v23.0';
const ACCESS_TOKEN = process.env.META_SYSTEM_ACCESS_TOKEN; 
const AD_ACCOUNT_ID = process.env.META_ADS_ACCOUNT_ID; 

export interface AdTargeting {
  locations: string[];
  age_min: number;
  age_max: number;
  genders: number[]; // 1: Male, 2: Female, 0: All
  interests?: string[];
}

export class MetaApiService {
  /**
   * Valida se as credenciais do sistema estão presentes antes de qualquer chamada
   */
  private static validateConfig() {
    if (!ACCESS_TOKEN || ACCESS_TOKEN === 'undefined') {
      throw new Error('Configuração META_SYSTEM_ACCESS_TOKEN ausente.');
    }
    if (!AD_ACCOUNT_ID || AD_ACCOUNT_ID === 'undefined') {
      throw new Error('Configuração META_ADS_ACCOUNT_ID ausente.');
    }
  }

  /**
   * Lista contas de anúncios para um token de usuário específico (OAuth)
   */
  static async getAdAccounts(userAccessToken: string) {
    try {
      const response = await axios.get(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/adaccounts`, {
        params: {
          access_token: userAccessToken,
          fields: 'name,account_id,account_status,currency,timezone_name'
        }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Meta Get AdAccounts Technical Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Falha ao recuperar contas de anúncios da Meta.');
    }
  }

  /**
   * Upload de imagem para a biblioteca da Meta
   */
  static async uploadImage(imageUrl: string) {
    this.validateConfig();
    if (!imageUrl) throw new Error('URL da imagem é obrigatória para upload na Meta.');

    try {
      // Garante que a URL é absoluta se for base64 ou local
      const response = await axios.post(`https://graph.facebook.com/${GRAPH_API_VERSION}/act_${AD_ACCOUNT_ID}/adimages`, {
        url: imageUrl,
        access_token: ACCESS_TOKEN,
      });
      
      const images = response.data.images;
      const firstKey = Object.keys(images)[0];
      return images[firstKey].hash;
    } catch (error: any) {
      console.error('Meta Image Upload Error:', error.response?.data || error.message);
      throw new Error('Erro ao enviar mídia para a Meta. Verifique se a imagem é válida.');
    }
  }

  /**
   * Criação da Campanha (Nível 1)
   */
  static async createCampaign(name: string, objective: string) {
    this.validateConfig();
    
    const objectiveMap: any = {
      'traffic': 'OUTCOME_TRAFFIC',
      'conversions': 'OUTCOME_SALES',
      'sales': 'OUTCOME_SALES',
      'engagement': 'OUTCOME_ENGAGEMENT',
      'views': 'OUTCOME_AWARENESS'
    };

    try {
      const response = await axios.post(`https://graph.facebook.com/${GRAPH_API_VERSION}/act_${AD_ACCOUNT_ID}/campaigns`, {
        name: `ORION_CAMP_${name}_${Date.now()}`,
        objective: objectiveMap[objective] || 'OUTCOME_TRAFFIC',
        status: 'PAUSED',
        special_ad_categories: ['NONE'],
        access_token: ACCESS_TOKEN,
      });
      return response.data.id;
    } catch (error: any) {
      console.error('Meta Campaign Creation Error:', error.response?.data || error.message);
      throw new Error('Erro ao criar campanha na Meta. Verifique permissões do token.');
    }
  }

  /**
   * Criação do Conjunto de Anúncios (Nível 2 - Público e Verba)
   */
  static async createAdSet(campaignId: string, name: string, dailyBudget: number, targeting: AdTargeting, platforms: string[]) {
    this.validateConfig();

    const publisher_platforms = [];
    const facebook_positions = [];
    const instagram_positions = [];

    if (platforms.includes('facebook')) {
      publisher_platforms.push('facebook');
      facebook_positions.push('feed', 'story', 'right_hand_column');
    }
    if (platforms.includes('instagram')) {
      publisher_platforms.push('instagram');
      instagram_positions.push('stream', 'story', 'explore', 'reels');
    }

    try {
      const response = await axios.post(`https://graph.facebook.com/${GRAPH_API_VERSION}/act_${AD_ACCOUNT_ID}/adsets`, {
        name: `ORION_SET_${name}`,
        campaign_id: campaignId,
        daily_budget: Math.max(Math.round(dailyBudget * 100), 100), 
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'REACH',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        targeting: {
          geo_locations: { countries: ['BR'] },
          age_min: targeting.age_min || 18,
          age_max: targeting.age_max || 65,
          publisher_platforms: publisher_platforms.length > 0 ? publisher_platforms : ['facebook', 'instagram'],
          facebook_positions: facebook_positions.length > 0 ? facebook_positions : undefined,
          instagram_positions: instagram_positions.length > 0 ? instagram_positions : undefined,
          device_platforms: ['mobile', 'desktop']
        },
        status: 'ACTIVE',
        access_token: ACCESS_TOKEN,
      });
      return response.data.id;
    } catch (error: any) {
      console.error('Meta AdSet Creation Error:', error.response?.data || error.message);
      throw new Error('Erro ao configurar público/verba na Meta.');
    }
  }

  /**
   * Criação do Criativo (Nível 3 - Design)
   */
  static async createAdCreative(name: string, imageHash: string, title: string, body: string, link: string) {
    this.validateConfig();
    const pageId = process.env.META_PAGE_ID;
    if (!pageId || pageId === 'undefined') throw new Error('ID da página Meta (META_PAGE_ID) não configurado.');

    try {
      const response = await axios.post(`https://graph.facebook.com/${GRAPH_API_VERSION}/act_${AD_ACCOUNT_ID}/adcreatives`, {
        name: `ORION_CREATIVE_${name}`,
        object_story_spec: {
          page_id: pageId,
          link_data: {
            image_hash: imageHash,
            link: link,
            message: body,
            call_to_action: {
              type: 'LEARN_MORE',
              value: { link: link }
            },
            name: title
          }
        },
        access_token: ACCESS_TOKEN,
      });
      return response.data.id;
    } catch (error: any) {
      console.error('Meta Creative Creation Error:', error.response?.data || error.message);
      throw new Error('Erro ao processar o design do anúncio na Meta.');
    }
  }

  /**
   * Criação do Anúncio Final (Nível 4 - Publicação)
   */
  static async createAd(adSetId: string, creativeId: string, name: string) {
    this.validateConfig();
    try {
      const response = await axios.post(`https://graph.facebook.com/${GRAPH_API_VERSION}/act_${AD_ACCOUNT_ID}/ads`, {
        name: `ORION_AD_${name}`,
        adset_id: adSetId,
        creative: { creative_id: creativeId },
        status: 'ACTIVE',
        access_token: ACCESS_TOKEN,
      });
      return response.data.id;
    } catch (error: any) {
      console.error('Meta Ad Creation Error:', error.response?.data || error.message);
      throw new Error('Erro ao publicar o anúncio final na rede Meta.');
    }
  }
}
