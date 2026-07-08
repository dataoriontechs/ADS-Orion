import { CampaignPayload } from '@/types/campaign.types';
import { MetaApiService } from './meta/meta.service';
import { GoogleAdsService } from './google/googleads.service';
import { TikTokApiService } from './tiktok/tiktok.service';
import { FirestoreService } from '@/firebase/firestore-service';

/**
 * Orquestrador Universal Orion Centralizado.
 * Gerencia a lógica central de negócio e o despacho utilizando as contas mestras da plataforma.
 */
export class UniversalOrchestrator {
  private metaService = MetaApiService;
  private googleService = GoogleAdsService;
  private tiktokService = TikTokApiService;

  async dispatchCampaign(campaignId: string, payload: CampaignPayload): Promise<any> {
    // 1. Recupera Perfil para validar saldos (Tokens agora são de sistema, não de usuário)
    const user = await FirestoreService.getUser(payload.userId);
    const internalBalance = user.internalBalance || 0;

    // Regra 85/15: O orçamento real da campanha é 85% do visual
    const realBudget = payload.budget * 0.85;

    if (internalBalance < realBudget) {
      throw new Error('Saldo insuficiente para orquestração.');
    }

    const orchestrationResults: any[] = [];

    // 2. Despacho Multi-Plataforma (Utilizando Master Tokens configurados no env do Admin)
    for (const platform of payload.platforms) {
      try {
        if (['facebook', 'instagram'].includes(platform.toLowerCase())) {
          // Meta Integration - Utiliza META_SYSTEM_ACCESS_TOKEN configurado no servidor
          const result = await this.metaService.createCampaign(payload.name, 'traffic');
          orchestrationResults.push({ platform, status: 'Success', id: result });
        } else if (platform.toLowerCase() === 'google') {
          // Google Integration - Utiliza tokens de sistema
          const result = await this.googleService.createCampaign('SYSTEM_TOKEN', 'MASTER_ID', payload);
          orchestrationResults.push({ platform, status: 'Success', id: result });
        } else if (platform.toLowerCase() === 'tiktok') {
          // TikTok Integration - Utiliza tokens de sistema
          const result = await this.tiktokService.createCampaign('SYSTEM_TOKEN', 'MASTER_ID', payload);
          orchestrationResults.push({ platform, status: 'Success', id: result });
        }
      } catch (err: any) {
        orchestrationResults.push({ platform, status: 'Failed', error: err.message });
      }
    }

    // 3. Persistência e Log
    await FirestoreService.saveCampaign(payload.userId, campaignId, {
      status: orchestrationResults.some(r => r.status === 'Success') ? 'Ativa' : 'Erro',
      realBudget: realBudget,
      orchestrationLogs: orchestrationResults,
      publishedAt: new Date().toISOString()
    });

    return { success: orchestrationResults.some(r => r.status === 'Success'), results: orchestrationResults };
  }
}
