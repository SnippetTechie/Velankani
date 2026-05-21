// ═══════════════════════════════════════════════════════════
// VEL AI — Auth Hook (Better Auth)
// ═══════════════════════════════════════════════════════════

'use client';

import { useCallback } from 'react';

export function useAuth() {
  const getToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('vel-session-token');
  }, []);

  return { getToken };
}
