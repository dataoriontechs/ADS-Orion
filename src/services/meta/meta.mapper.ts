
import { CampaignPayload } from '@/types/campaign.types';

/**
 * Tradutor de objetos para o formato Meta Marketing API.
 */
export class MetaMapper {
  static toCampaign(payload: CampaignPayload) {
    const objectiveMap: any = {
      'TRAFFIC': 'OUTCOME_TRAFFIC',
      'CONVERSIONS': 'OUTCOME_SALES',
      'AWARENESS': 'OUTCOME_AWARENESS'
    };

    return {
      name: `ORION_M_${payload.name}`,
      objective: objectiveMap[payload.objective] || 'OUTCOME_TRAFFIC',
      status: 'ACTIVE',
      special_ad_categories: ['NONE']
    };
  }
}
