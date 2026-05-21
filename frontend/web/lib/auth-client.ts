// ═══════════════════════════════════════════════════════════
// VEL AI — Better Auth Client
// ═══════════════════════════════════════════════════════════

import { createAuthClient } from 'better-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const authClient = createAuthClient({
  baseURL: API_BASE.replace('/api/v1', ''), // Better Auth expects the base domain
  basePath: '/api/v1/auth',
  fetchOptions: {
    credentials: 'include',
    onSuccess: (ctx) => {
      // Store session token in localStorage for cross-domain Bearer auth
      if (typeof window !== 'undefined') {
        const setCookie = ctx.response?.headers?.get('set-cookie') || '';
        const tokenMatch = setCookie.match(/better-auth\.session_token=([^;]+)/);
        if (tokenMatch) {
          localStorage.setItem('vel-session-token', tokenMatch[1]);
        }
        // Also try to extract from response body
        try {
          const body = ctx.data as any;
          if (body?.token) {
            localStorage.setItem('vel-session-token', body.token);
          }
          if (body?.session?.token) {
            localStorage.setItem('vel-session-token', body.session.token);
          }
        } catch {}
      }
    },
  },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
