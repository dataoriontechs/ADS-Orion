import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore, terminate } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Inicializa o Firebase de forma isomórfica (Cliente e Servidor).
 * Implementa singleton e configurações de estabilidade para evitar INTERNAL ASSERTION FAILED.
 */
export function initializeFirebase() {
  const isValidConfig = 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "undefined" && 
    firebaseConfig.apiKey !== "" &&
    !firebaseConfig.apiKey.includes("...");

  if (!isValidConfig) {
    return { 
      firebaseApp: null as unknown as FirebaseApp, 
      firestore: null as unknown as Firestore, 
      auth: null as unknown as Auth 
    };
  }

  try {
    const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    // Usamos initializeFirestore com configurações de estabilidade se for o primeiro acesso
    // experimentalForceLongPolling resolve erros de "Unexpected state" em ambientes de workstation/proxy
    let firestore: Firestore;
    if (getApps().length > 0) {
      firestore = getFirestore(firebaseApp);
    } else {
      firestore = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true,
      });
    }
    
    const auth = getAuth(firebaseApp);

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
    return { 
      firebaseApp: null as unknown as FirebaseApp, 
      firestore: null as unknown as Firestore, 
      auth: null as unknown as Auth 
    };
  }
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
