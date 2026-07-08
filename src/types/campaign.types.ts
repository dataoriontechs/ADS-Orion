
/**
 * @fileOverview Contrato unificado para payloads de campanha na Orion.
 */

export interface CampaignPayload {
  userId: string;
  name: string;
  objective: 'CONVERSIONS' | 'TRAFFIC' | 'AWARENESS' | 'SALES' | 'LEADS';
  budget: number;                    // em BRL (Valor Visual)
  budgetType: 'DAILY' | 'LIFETIME';
  startDate?: string;                // YYYY-MM-DD
  endDate?: string;
  targeting?: {
    locations?: string[];
    ageMin?: number;
    ageMax?: number;
    genders?: ('MALE' | 'FEMALE' | 'ALL')[];
    interests?: string[];
  };
  creatives: Array<{
    name: string;
    headline: string;
    primaryText: string;
    description?: string;
    imageUrl?: string;
    videoUrl?: string;
    callToAction?: string;
  }>;
  platforms: ('FACEBOOK' | 'INSTAGRAM' | 'GOOGLE' | 'TIKTOK')[];
}
