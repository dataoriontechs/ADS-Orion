import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { processPaymentStatus } from '@/app/actions/mercadopago';

/**
 * Webhook Oficial do Mercado Pago para Produção.
 * Escuta eventos de pagamentos reais e atualiza o sistema em tempo real.
 */
export async function POST(req: NextRequest) {
  const { firestore } = initializeFirebase();
  if (!firestore) return NextResponse.json({ error: "Database Offline" }, { status: 500 });

  try {
    const settingsSnap = await getDoc(doc(firestore, 'settings', 'mercadopago'));
    const settings = settingsSnap.data() || {};
    const env = settings.environment || 'sandbox';
    const accessToken = (env === 'production' ? settings.liveAccessToken : settings.testAccessToken)?.trim();

    if (!accessToken) {
      console.error("[WEBHOOK ERROR]: Access Token não configurado.");
      return NextResponse.json({ ok: true });
    }

    const body = await req.json();
    const paymentId = body.data?.id || body.resource?.split('/').pop();
    const type = body.type || body.topic;

    if ((type === 'payment' || type === 'payment.updated') && paymentId) {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const paymentData = await response.json();
        const transactionId = paymentData.external_reference;
        const userId = paymentData.metadata?.user_id;
        const amount = Number(paymentData.transaction_amount);
        const status = paymentData.status; // approved, rejected, cancelled, etc
        const method = paymentData.payment_method_id;
        const reason = paymentData.status_detail;

        if (userId && transactionId) {
           await processPaymentStatus(userId, transactionId, status, amount, method, reason);
           console.log(`[WEBHOOK]: Pagamento ${paymentId} (${status}) processado para ${userId}`);
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[WEBHOOK EXCEPTION]:", error.message);
    return NextResponse.json({ ok: true });
  }
}
