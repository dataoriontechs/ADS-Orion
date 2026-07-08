'use server';
/**
 * @fileOverview Fluxo Genkit para análise inteligente de performance de campanhas.
 *
 * - analyzeCampaigns - Função que analisa dados reais e sugere otimizações.
 * - AnalyzeCampaignsInput - Tipo de entrada com dados das campanhas.
 * - AnalyzeCampaignsOutput - Tipo de saída com diagnóstico e recomendações.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CampaignSummarySchema = z.object({
  name: z.string(),
  budget: z.number(),
  clicks: z.number(),
  conversions: z.number(),
  platforms: z.array(z.string()),
});

const AnalyzeCampaignsInputSchema = z.object({
  campaigns: z.array(CampaignSummarySchema),
});
export type AnalyzeCampaignsInput = z.infer<typeof AnalyzeCampaignsInputSchema>;

const AnalyzeCampaignsOutputSchema = z.object({
  bestPlatform: z.string().describe('A plataforma com melhor desempenho identificado.'),
  analysis: z.string().describe('Um diagnóstico detalhado da performance atual.'),
  recommendations: z.array(z.string()).describe('Lista de ações práticas para escalar os resultados.'),
  roasEstimate: z.string().describe('Uma estimativa ou comentário sobre o Retorno sobre Investimento.'),
});
export type AnalyzeCampaignsOutput = z.infer<typeof AnalyzeCampaignsOutputSchema>;

export async function analyzeCampaigns(input: AnalyzeCampaignsInput): Promise<AnalyzeCampaignsOutput> {
  return analyzeCampaignsFlow(input);
}

const analyzeCampaignsPrompt = ai.definePrompt({
  name: 'analyzeCampaignsPrompt',
  input: {schema: AnalyzeCampaignsInputSchema},
  output: {schema: AnalyzeCampaignsOutputSchema},
  prompt: `Você é o Orion AI, um especialista sênior em marketing digital e otimização de tráfego pago.
Sua tarefa é analisar os dados reais das campanhas publicitárias de um usuário e fornecer um plano de escala inteligente.

Dados Reais das Campanhas:
{{#each campaigns}}
- Campanha: "{{name}}"
  Orçamento: R$ {{budget}}
  Cliques: {{clicks}}
  Conversões: {{conversions}}
  Plataformas: {{platforms}}
{{/each}}

Com base nestes números REAIS:
1. Identifique qual plataforma (Google, Meta, TikTok, etc.) está trazendo o melhor custo-benefício ou volume.
2. Explique o porquê desta performance na seção "analysis".
3. Liste 3 recomendações específicas para aumentar o ROI na seção "recommendations".
4. Seja direto, profissional e focado em lucro.

Sua resposta deve ser inteiramente em Português do Brasil.`,
});

const analyzeCampaignsFlow = ai.defineFlow(
  {
    name: 'analyzeCampaignsFlow',
    inputSchema: AnalyzeCampaignsInputSchema,
    outputSchema: AnalyzeCampaignsOutputSchema,
  },
  async input => {
    const {output} = await analyzeCampaignsPrompt(input);
    return output!;
  }
);
