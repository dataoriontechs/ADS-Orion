
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useUser, useFirestore } from '@/firebase';

/**
 * Interface base para os contextos de feature.
 * Aplica o conceito de "Herança estrutural" onde cada feature
 * tem acesso garantido ao núcleo do sistema.
 */
export interface BaseFeatureContext {
  db: any;
  user: any;
  loading: boolean;
}

export function createFeatureContext<T extends BaseFeatureContext>() {
  return createContext<T | null>(null);
}

export function useFeatureContext<T>(context: React.Context<T | null>, featureName: string) {
  const ctx = useContext(context);
  if (!ctx) {
    throw new Error(`use${featureName} deve ser usado dentro de um ${featureName}Provider`);
  }
  return ctx;
}
