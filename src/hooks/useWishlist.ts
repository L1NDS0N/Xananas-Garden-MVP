import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const SESSION_KEY = 'xananas_session_id';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'anonymous';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useWishlist() {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set<string>());
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    try {
      const sessionId = getOrCreateSessionId();
      const res = await api.get('/wishlists', { headers: { 'x-session-id': sessionId } });
      const items: any[] = res.data || [];
      const ids = new Set<string>(items.map((item: any) => item.productId));
      setWishlistIds(ids);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const toggleWishlist = useCallback(async (productId: string) => {
    const sessionId = getOrCreateSessionId();
    // Optimistic update
    setWishlistIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      const res = await api.post('/wishlists', { productId }, { headers: { 'x-session-id': sessionId } });
      if (!res.data.wishlisted) {
        setWishlistIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    } catch {
      // Revert on error
      setWishlistIds(prev => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
    }
  }, []);

  const isWishlisted = useCallback((productId: string) => wishlistIds.has(productId), [wishlistIds]);

  return { wishlistIds, toggleWishlist, isWishlisted, loading, refresh: loadWishlist };
}
