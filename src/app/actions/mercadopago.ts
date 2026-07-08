
'use server';

import { MercadoPagoConfig, Payment } from 'mercadopago';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, increment, serverTimestamp, setDoc, collection, addDoc } from 'firebase/firestore';
import { headers } from 'next/headers';

/**
 * @fileOverview Orquestração Mercado Pago Produção (v4.5).
 * Gerencia credenciais dinâmicas, isolamento total e detecção de domínio para Webhooks.
 */

const BOOTSTRAP_TEST_PUBLIC_KEY = 'TEST-f4501733-ed5d-4300-944b-6caf766b1f5b';
const BOOTSTRAP_TEST_ACCESS_TOKEN = 'TEST-945644050531256-061322-b1d87f421242c85e2318a9c6fb102f42-426817739';

/**
 * Recupera a URL base do sistema de forma dinâmica para Webhooks em produção.
 */
async function getBaseUrl() {
  const host = (await headers()).get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  return process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
}

async function getValidatedMPConfig() {
  const { firestore } = initializeFirebase();
  if (!firestore) throw new Error('Falha na inicialização do Firebase.');

  const settingsRef = doc(firestore, 'settings', 'mercadopago');
  
  let accessToken = BOOTSTRAP_TEST_ACCESS_TOKEN;
  let environment = 'sandbox';
  let configSource = 'Padrão Orion (Bootstrap)';

  try {
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      const settings = settingsSnap.data();
      environment = settings.environment || 'sandbox';
      
      if (environment === 'production') {
        accessToken = settings.liveAccessToken;
        if (!accessToken || accessToken.startsWith('TEST-')) {
          throw new Error('Ambiente configurado como PRODUÇÃO, mas o token é inválido ou de teste.');
        }
        configSource = 'Firestore (Live Access Token)';
      } else {
        accessToken = settings.testAccessToken || BOOTSTRAP_TEST_ACCESS_TOKEN;
        configSource = settings.testAccessToken ? 'Firestore (Test Access Token)' : 'Padrão Orion (Bootstrap)';
      }
    }
  } catch (e: any) {
    console.warn(`[MP CONFIG]: ${e.message}`);
    if (environment === 'production') throw e;
  }

  // Validação real do Token via API do Mercado Pago
  const validationResponse = await fetch('https://api.mercadopago.com/users/me', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  if (!validationResponse.ok) {
    throw new Error(`Token do Mercado Pago inválido ou expirado (${validationResponse.status}). Verifique o painel administrativo.`);
  }

  const sellerData = await validationResponse.json();

  console.log(`[MP PROD AUDIT]: ${environment.toUpperCase()} | ${configSource} | Seller: ${sellerData.email}`);

  const client = new MercadoPagoConfig({ 
    accessToken: accessToken, 
    options: { timeout: 15000 } 
  });

  return { client, accessToken, environment, sellerEmail: sellerData.email };
}

/**
 * Processa a atualização de status de um pagamento (Aprovado, Rejeitado, etc).
 */
export async function processPaymentStatus(userId: string, transactionId: string, status: string, amount: number, method: string, reason?: string) {
  const { firestore } = initializeFirebase();
  if (!firestore) return { success: false, error: "Database offline" };

  try {
    const userRef = doc(firestore, 'users', userId);
    const txRef = doc(firestore, 'users', userId, 'transactions', transactionId);
    const txSnap = await getDoc(txRef);
    
    if (!txSnap.exists()) return { success: false, error: "Transação não encontrada" };
    const currentData = txSnap.data();

    if (status === 'approved' && currentData.status !== 'approved') {
      // Regra 85/15: Crédito visual (100%) e Poder Real de Mídia (85%)
      await updateDoc(userRef, {
        balance: increment(amount),
        internalBalance: increment(amount * 0.85),
        updatedAt: serverTimestamp()
      });

      await updateDoc(txRef, {
        status: 'approved',
        updatedAt: serverTimestamp(),
        processed_at: new Date().toISOString()
      });

      // Notificação ao Usuário
      const notifRef = doc(collection(firestore, 'users', userId, 'notifications'));
      await setDoc(notifRef, {
        title: '💰 Saldo Creditado!',
        message: `Sua recarga de R$ ${amount.toLocaleString('pt-BR')} via ${method.toUpperCase()} foi confirmada.`,
        type: 'finance',
        priority: 'low',
        read: false,
        deleted: false,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(firestore, 'logs'), {
        userId: userId,
        action: 'PAYMENT_APPROVED',
        details: `Pagamento R$ ${amount} aprovado via ${method}. ID: ${transactionId}`,
        type: 'info',
        createdAt: serverTimestamp()
      });

      return { success: true };
    } 
    
    if (['rejected', 'cancelled', 'refunded'].includes(status)) {
      await updateDoc(txRef, {
        status: status,
        rejection_reason: reason || 'Cancelado pela operadora ou usuário',
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(firestore, 'logs'), {
        userId: userId,
        action: 'PAYMENT_FAILED',
        details: `Pagamento R$ ${amount} (${method}) resultou em: ${status}. Motivo: ${reason}`,
        type: 'warning',
        createdAt: serverTimestamp()
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("[PAYMENT_PROCESS_ERROR]:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Simulação de aprovação (Apenas para Sandbox).
 */
export async function simulatePaymentApproval(userId: string, transactionId: string, amount: number, method: string) {
  const { environment } = await getValidatedMPConfig();
  if (environment === 'production') {
    throw new Error('Ação proibida em ambiente de produção.');
  }
  return processPaymentStatus(userId, transactionId, 'approved', amount, method);
}

export async function createPixPayment(userId: string, email: string, name: string, amount: number, transactionId: string) {
  try {
    const { client, environment, sellerEmail } = await getValidatedMPConfig();
    const baseUrl = await getBaseUrl();
    
    let payerEmail = email.trim();
    if (environment === 'sandbox' && sellerEmail && payerEmail.toLowerCase() === sellerEmail.toLowerCase()) {
      payerEmail = `test_user_${userId.substring(0, 8)}@testuser.com`;
    }
    
    const body = {
      transaction_amount: Number(amount),
      description: `ORION-PIX-${name}`,
      payment_method_id: 'pix',
      external_reference: transactionId,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      metadata: { user_id: userId, transaction_id: transactionId },
      payer: {
        email: payerEmail,
        first_name: name.split(' ')[0] || 'Usuário',
        last_name: name.split(' ').slice(1).join(' ') || 'Orion',
      },
    };

    const payment = new Payment(client);
    const response = await payment.create({ 
      body, 
      requestOptions: { idempotencyKey: transactionId } 
    });
    
    return {
      id: response.id,
      qr_code: response.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64,
      status: response.status,
      expiration_date: response.date_of_expiration,
      amount: response.transaction_amount
    };
  } catch (error: any) {
    console.error(`[PIX ERROR]:`, error.message);
    return { error: error.message || "Falha técnica na API Mercado Pago" };
  }
}

export async function createBoletoPayment(userId: string, email: string, name: string, amount: number, transactionId: string) {
  try {
    const { client, environment, sellerEmail } = await getValidatedMPConfig();
    const baseUrl = await getBaseUrl();
    
    let payerEmail = email.trim();
    if (environment === 'sandbox' && sellerEmail && payerEmail.toLowerCase() === sellerEmail.toLowerCase()) {
      payerEmail = `test_user_${userId.substring(0, 8)}@testuser.com`;
    }
    
    const body = {
      transaction_amount: Number(amount),
      description: `ORION-BOLETO-${name}`,
      payment_method_id: 'bolbradesco',
      external_reference: transactionId,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      metadata: { user_id: userId, transaction_id: transactionId },
      payer: {
        email: payerEmail,
        first_name: name.split(' ')[0] || 'Usuário',
        last_name: name.split(' ').slice(1).join(' ') || 'Orion',
        identification: { type: 'CPF', number: '19100000000' },
        address: {
          zip_code: '01234000',
          street_name: 'Avenida Paulista',
          street_number: '1000',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          federal_unit: 'SP'
        }
      },
    };

    const payment = new Payment(client);
    const response = await payment.create({ 
      body, 
      requestOptions: { idempotencyKey: transactionId } 
    });
    
    return {
      id: response.id,
      barcode: response.barcode?.content || response.point_of_interaction?.transaction_data?.barcode?.content,
      external_resource_url: response.transaction_details?.external_resource_url,
      status: response.status,
      expiration_date: response.date_of_expiration,
      amount: response.transaction_amount
    };
  } catch (error: any) {
    console.error(`[BOLETO ERROR]:`, error.message);
    return { error: error.message || "Falha técnica na API Mercado Pago" };
  }
}

export async function testMercadoPagoIntegration() {
  try {
    const { environment, sellerEmail } = await getValidatedMPConfig();
    return {
      environment: environment === 'production' ? 'Produção (LIVE)' : 'Sandbox (TEST)',
      authValid: true,
      statusMessage: `Conectado como ${sellerEmail}`,
    };
  } catch (err: any) {
    return { authValid: false, statusMessage: err.message };
  }
}
