
import { CampaignPayload } from '@/types/campaign.types';

/**
 * Tradutor de objetos para o formato Google Ads API.
 */
export class GoogleMapper {
  static toGoogleCampaign(payload: CampaignPayload, customerId: string) {
    return {
      resource_name: `customers/${customerId}/campaigns/-1`,
      name: `ORION_G_${payload.name}`,
      advertising_channel_type: 'SEARCH',
      status: 'ENABLED',
      manual_cpc: {}, // Exemplo de estratégia de lance
      campaign_budget: `customers/${customerId}/campaignBudgets/-1`,
      network_settings: {
        target_google_search: true,
        target_search_network: true
      }
    };
  }
}
