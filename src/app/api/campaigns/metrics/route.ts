
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Endpoint unificado para coleta de métricas multi-plataforma.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('id');

  if (!campaignId) return NextResponse.json({ error: 'ID da campanha obrigatório.' }, { status: 400 });

  const { firestore } = initializeFirebase();
  if (!firestore) return NextResponse.json({ error: 'Database error' }, { status: 500 });

  try {
    const campaignSnap = await getDoc(doc(firestore, 'campaigns', campaignId));
    if (!campaignSnap.exists()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const c = campaignSnap.data();
    const platforms = Array.isArray(c.platforms) ? c.platforms : [];
    
    // Simulação de resposta padronizada para o dashboard / Orion AI
    const mockMetrics = [
      {
        platform: 'Meta',
        impressions: Math.floor(Math.random() * 5000),
        clicks: Math.floor(Math.random() * 200),
        ctr: 1.5,
        spend: (c.budget || 0) * 0.4,
        conversions: Math.floor(Math.random() * 10)
      },
      {
        platform: 'Google',
        impressions: Math.floor(Math.random() * 3000),
        clicks: Math.floor(Math.random() * 150),
        ctr: 2.1,
        spend: (c.budget || 0) * 0.3,
        conversions: Math.floor(Math.random() * 5)
      }
    ].filter(m => platforms.includes(m.platform.toLowerCase()));

    return NextResponse.json({ metrics: mockMetrics });
  } catch (error: any) {
    console.error('[API Metrics Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
