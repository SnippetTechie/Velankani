// ═══════════════════════════════════════════════════════════
// VEL AI — Auth Guard (Better Auth Session Verification)
// ═══════════════════════════════════════════════════════════

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { auth } from '../auth/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { db } from '../database/db';
import { sql } from 'drizzle-orm';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger('AuthGuard');

  /**
   * Ensures a user exists in the app's `users` table, synced from Better Auth.
   * Returns the app user's UUID.
   */
  private async ensureAppUser(authUser: { id: string; email: string; name?: string | null }): Promise<string> {
    // First try to find by clerk_id
    const existing = await db.execute(
      sql`SELECT id FROM users WHERE clerk_id = ${authUser.id} LIMIT 1`
    );
    const rows = Array.isArray(existing) ? existing : [];
    if (rows.length > 0) {
      return (rows[0] as any).id;
    }

    // Try by email
    const byEmail = await db.execute(
      sql`SELECT id FROM users WHERE email = ${authUser.email} LIMIT 1`
    );
    const emailRows = Array.isArray(byEmail) ? byEmail : [];
    if (emailRows.length > 0) {
      const userId = (emailRows[0] as any).id;
      await db.execute(sql`UPDATE users SET clerk_id = ${authUser.id} WHERE id = ${userId}`);
      return userId;
    }

    // Create new user
    const result = await db.execute(sql`
      INSERT INTO users (clerk_id, email, name, plan, credits_remaining, credits_monthly_alloc, credits_used_this_month, onboarding_complete)
      VALUES (${authUser.id}, ${authUser.email}, ${authUser.name || null}, 'free', 100, 100, 0, false)
      RETURNING id
    `);
    const insertedRows = Array.isArray(result) ? result : [];
    if (insertedRows.length > 0) {
      return (insertedRows[0] as any).id;
    }

    throw new Error('Failed to create or find app user');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Dev bypass — allows running without auth configured
    const devBypass = process.env.AUTH_DEV_BYPASS;

    if (devBypass && devBypass.length >= 16) {
      this.logger.debug('Dev bypass active');
      const devUserId =
        request.headers?.['x-dev-user-id'] ||
        '00000000-0000-0000-0000-000000000001';
      request.user = {
        id: devUserId,
        email: 'dev@vel.ai',
        name: 'Dev User',
        plan: 'pro',
        creditsRemaining: 1000,
        byokOpenaiKey: null,
        byokAnthropicKey: null,
      };
      return true;
    }

    // If Better Auth secret is not configured, allow in development
    if (!process.env.BETTER_AUTH_SECRET) {
      if (process.env.NODE_ENV === 'development') {
        request.user = {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'dev@vel.ai',
          name: 'Dev User',
          plan: 'pro',
          creditsRemaining: 1000,
          byokOpenaiKey: null,
          byokAnthropicKey: null,
        };
        return true;
      }
      throw new UnauthorizedException('Auth not configured');
    }

    // If auth is not initialized (no DATABASE_URL), fall back to dev user
    if (!auth) {
      if (process.env.NODE_ENV === 'development') {
        request.user = {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'dev@vel.ai',
          name: 'Dev User',
          plan: 'pro',
          creditsRemaining: 1000,
          byokOpenaiKey: null,
          byokAnthropicKey: null,
        };
        return true;
      }
      throw new UnauthorizedException('Auth not configured — DATABASE_URL is required');
    }

    try {
      // Support Bearer token auth for cross-domain deployments
      const authHeader = request.headers?.['authorization'] || '';
      const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

      // First try: use Better Auth's getSession with cookie injection
      const headersForAuth = { ...request.headers };
      if (bearerToken) {
        headersForAuth.cookie = `better-auth.session_token=${bearerToken}`;
      }

      let session: any = null;
      try {
        session = await auth.api.getSession({
          headers: fromNodeHeaders(headersForAuth),
        });
      } catch {
        // getSession failed, try direct DB lookup below
      }

      // Second try: if Bearer token exists but getSession failed, look up session directly in DB
      if (!session && bearerToken) {
        const sessionResult = await db.execute(
          sql`SELECT s.*, u.id as "userId", u.email, u.name FROM session s JOIN "user" u ON s."userId" = u.id WHERE s.token = ${bearerToken} AND s."expiresAt" > NOW() LIMIT 1`
        );
        const rows = Array.isArray(sessionResult) ? sessionResult : [];
        if (rows.length > 0) {
          const row = rows[0] as any;
          session = { user: { id: row.userId, email: row.email, name: row.name } };
        }
      }

      if (!session || !session.user) {
        if (process.env.NODE_ENV === 'development') {
          request.user = {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'dev@vel.ai',
            name: 'Dev User',
            plan: 'pro',
            creditsRemaining: 1000,
            byokOpenaiKey: null,
            byokAnthropicKey: null,
          };
          return true;
        }
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Sync Better Auth user to app users table and get the app UUID
      const appUserId = await this.ensureAppUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      });

      this.logger.log(`Auth resolved: BA user ${session.user.id} -> app user ${appUserId}`);

      // Attach user to request with the app's UUID
      request.user = {
        id: appUserId,
        email: session.user.email,
        name: session.user.name,
        plan: 'pro',
        creditsRemaining: 1000,
        byokOpenaiKey: null,
        byokAnthropicKey: null,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        if (process.env.NODE_ENV === 'development') {
          request.user = {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'dev@vel.ai',
            name: 'Dev User',
            plan: 'pro',
            creditsRemaining: 1000,
            byokOpenaiKey: null,
            byokAnthropicKey: null,
          };
          return true;
        }
        throw error;
      }
      this.logger.error(`Auth verification failed: ${error}`);
      if (process.env.NODE_ENV === 'development') {
        request.user = {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'dev@vel.ai',
          name: 'Dev User',
          plan: 'pro',
          creditsRemaining: 1000,
          byokOpenaiKey: null,
          byokAnthropicKey: null,
        };
        return true;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
