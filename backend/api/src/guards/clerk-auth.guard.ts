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
    // Use upsert to avoid race conditions and duplicate key errors
    const result = await db.execute(
      sql`INSERT INTO users (clerk_id, email, name, plan, credits_remaining, credits_monthly_alloc, credits_used_this_month, onboarding_complete)
          VALUES (${authUser.id}, ${authUser.email}, ${authUser.name || null}, 'free', 100, 100, 0, false)
          ON CONFLICT (clerk_id) DO UPDATE SET email = EXCLUDED.email
          RETURNING id`
    );
    const rows = Array.isArray(result) ? result : [];
    if (rows.length > 0) {
      return (rows[0] as any).id;
    }

    // Fallback: look up by clerk_id
    const existing = await db.execute(
      sql`SELECT id FROM users WHERE clerk_id = ${authUser.id} LIMIT 1`
    );
    const existingRows = Array.isArray(existing) ? existing : [];
    if (existingRows.length > 0) {
      return (existingRows[0] as any).id;
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
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session || !session.user) {
        // In development, allow through if session verification fails
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
