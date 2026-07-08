'use client';

import { useState, useEffect, useRef } from 'react';
import { Query, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = any>(query: Query | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Ref para evitar processamento de snapshots após unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    if (!query) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        if (!isMounted.current) return;
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
        setData(items);
        setLoading(false);
        setError(null);
      },
      async (serverError: any) => {
        if (!isMounted.current) return;
        
        const permissionError = new FirestorePermissionError({
          path: 'coleção',
          operation: 'list',
        });
        
        const isIndexError = serverError.message?.includes('index') || serverError.code === 'failed-precondition';
        
        if (!isIndexError) {
          errorEmitter.emit('permission-error', permissionError);
        }
        
        setError(serverError);
        setLoading(false);
      }
    );

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [query]);

  return { data, loading, error };
}
