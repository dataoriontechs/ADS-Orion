import { initializeFirebase } from './index';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Service isomórfico para operações de banco de dados.
 * Funciona em Server Components, Server Actions e Client Components.
 */
export const FirestoreService = {
  async getUser(uid: string) {
    const { firestore } = initializeFirebase();
    if (!firestore) throw new Error('Firestore não inicializado.');
    const snap = await getDoc(doc(firestore, 'users', uid));
    if (!snap.exists()) throw new Error('Usuário não encontrado.');
    return snap.data();
  },

  async saveCampaign(userId: string, campaignId: string, data: any) {
    const { firestore } = initializeFirebase();
    if (!firestore) throw new Error('Firestore não inicializado.');
    const ref = doc(firestore, 'campaigns', campaignId);
    await setDoc(ref, {
      ...data,
      userId,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
};
