'use server';
/**
 * @fileOverview A Genkit flow for generating ad titles and body texts based on product/service description and target audience.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiAdCreativeAssistantInputSchema = z.object({
  productDescription: z
    .string()
    .describe(
      'A detailed description of the product or service for which to generate ad creatives.'
    ),
  targetAudience: z
    .string()
    .describe('A description of the target audience for the ad.'),
  adFormat: z
    .enum([
      'search_ad',
      'display_ad',
      'social_media_post',
      'email_subject_line',
      'video_script_snippet',
    ])
    .describe('The format of the ad creative.')
    .default('search_ad'),
  tone: z
    .enum(['professional', 'casual', 'humorous', 'urgent', 'informative'])
    .describe('The desired tone for the ad copy.')
    .default('professional'),
});
export type AiAdCreativeAssistantInput = z.infer<
  typeof AiAdCreativeAssistantInputSchema
>;

const AiAdCreativeAssistantOutputSchema = z.object({
  titles: z.array(z.string()).describe('A list of 3-5 suggested ad titles.'),
  bodyTexts: z
    .array(z.string())
    .describe('A list of 2-3 suggested ad body texts.'),
});
export type AiAdCreativeAssistantOutput = z.infer<
  typeof AiAdCreativeAssistantOutputSchema
>;

export async function aiAdCreativeAssistant(
  input: AiAdCreativeAssistantInput
): Promise<AiAdCreativeAssistantOutput> {
  return aiAdCreativeAssistantFlow(input);
}

const aiAdCreativeAssistantPrompt = ai.definePrompt({
  name: 'aiAdCreativeAssistantPrompt',
  input: {schema: AiAdCreativeAssistantInputSchema},
  output: {schema: AiAdCreativeAssistantOutputSchema},
  prompt: `Você é o Orion AI Copywriter, um especialista sênior em marketing digital de alta performance. 
Seu objetivo é criar textos que convertem.

Especificações:
- Produto/Serviço: "{{{productDescription}}}"
- Público-Alvo: "{{{targetAudience}}}"
- Tom de Voz: "{{{tone}}}"
- Formato: "{{{adFormat}}}"

Instruções:
1. Gere de 3 a 5 títulos curtos e impactantes.
2. Gere de 2 a 3 textos de corpo detalhados com gatilhos mentais adequados ao tom escolhido.
3. Use Português do Brasil de forma impecável.
4. Foque em benefícios e soluções, não apenas em características.`,
});

const aiAdCreativeAssistantFlow = ai.defineFlow(
  {
    name: 'aiAdCreativeAssistantFlow',
    inputSchema: AiAdCreativeAssistantInputSchema,
    outputSchema: AiAdCreativeAssistantOutputSchema,
  },
  async input => {
    const {output} = await aiAdCreativeAssistantPrompt(input);
    if (!output) throw new Error('A IA não retornou nenhum conteúdo de texto.');
    return output;
  }
);
