'use server';
/**
 * @fileOverview Um fluxo Genkit para geração de imagens publicitárias usando Imagen 4.
 * Inclui tratamento de erro para restrições de plano de faturamento do Google AI Studio.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiImageGeneratorInputSchema = z.object({
  prompt: z.string().describe('Descrição da imagem que deseja gerar.'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
});
export type AiImageGeneratorInput = z.infer<typeof AiImageGeneratorInputSchema>;

const AiImageGeneratorOutputSchema = z.object({
  imageUrl: z.string().describe('A URL da imagem gerada em formato data URI.'),
  error: z.string().optional().describe('Mensagem de erro amigável se a geração falhar.'),
});
export type AiImageGeneratorOutput = z.infer<typeof AiImageGeneratorOutputSchema>;

export async function generateAdImage(input: AiImageGeneratorInput): Promise<AiImageGeneratorOutput> {
  return aiImageGeneratorFlow(input);
}

const aiImageGeneratorFlow = ai.defineFlow(
  {
    name: 'aiImageGeneratorFlow',
    inputSchema: AiImageGeneratorInputSchema,
    outputSchema: AiImageGeneratorOutputSchema,
  },
  async (input) => {
    try {
      // Melhorando o prompt com as especificações do usuário
      const fullPrompt = `Professional advertising photography for a campaign. 
      Subject: ${input.prompt}. 
      Aspect Ratio: ${input.aspectRatio}. 
      Style: Commercial aesthetic, high-end production, professional lighting, sharp focus, 8k resolution.`;

      const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: fullPrompt,
      });

      if (!media) {
        throw new Error('Falha ao gerar imagem pela Orion AI');
      }

      return {
        imageUrl: media.url,
      };
    } catch (error: any) {
      console.error('Erro na Geração de Imagem:', error);
      
      // Tratamento específico para erro de plano gratuito (Recitation/Paid plans)
      if (error.message?.includes('paid plans') || error.message?.includes('400')) {
        return {
          imageUrl: '',
          error: 'A geração de imagens via Imagen 4 requer uma conta com faturamento ativo no Google AI Studio. O modelo Gemini para textos continua disponível gratuitamente.'
        };
      }
      
      throw new Error('Falha técnica ao orquestrar a imagem. Tente novamente mais tarde.');
    }
  }
);
