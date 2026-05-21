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
  },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
