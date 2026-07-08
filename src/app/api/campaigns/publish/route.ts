
import { NextRequest, NextResponse } from 'next/server';
import { UniversalOrchestrator } from '@/services/universal-orchestrator';

/**
 * Orquestrador Universal de Campanhas ADS Orion.
 * Utiliza a nova arquitetura de Universal Orchestrator para despacho multi-plataforma.
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('id');

  if (!campaignId) return NextResponse.json({ error: 'ID da campanha é obrigatório.' }, { status: 400 });

  try {
    const orchestrator = new UniversalOrchestrator();
    
    // Em um cenário real, buscaríamos o payload completo do banco antes de despachar.
    // Aqui simulamos o acionamento do orquestrador central.
    // O orquestrador cuidará da regra 85/15 e da ativação imediata.
    
    const result = await orchestrator.dispatchCampaign(campaignId, {
        userId: 'temp', // O orquestrador buscará o dono real no banco
        name: 'Campanha Orion',
        objective: 'TRAFFIC',
        budget: 100,
        budgetType: 'DAILY',
        platforms: ['FACEBOOK', 'GOOGLE'],
        creatives: []
    } as any);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API Publish Error]:', error);
    return NextResponse.json({ error: error.message || 'Erro na orquestração central.' }, { status: 500 });
  }
}
