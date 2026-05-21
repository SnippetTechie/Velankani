// ═══════════════════════════════════════════════════════════
// VEL AI — NestJS Bootstrap
// ═══════════════════════════════════════════════════════════

// IMPORTANT: env must be loaded before any other imports
/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: '.env' });

process.on('unhandledRejection', (reason) => {
  console.warn('⚠️  Unhandled rejection (non-fatal):', reason instanceof Error ? reason.message : reason);
});

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  if (process.env.SENTRY_DSN) {
    const Sentry = await import('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV || 'development',
    });
  }

  // ─── RAW CORS MIDDLEWARE (runs before everything) ───────────
  // This ensures ALL routes get CORS headers, including Better Auth's
  // toNodeHandler which bypasses NestJS's built-in CORS.
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-ID');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  app.use('/api/v1/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
    });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`\n🚀 VEL AI API running on port ${port}`);
  console.log(`✅ CORS: reflecting all origins`);
  console.log(`✅ Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
}

bootstrap();
