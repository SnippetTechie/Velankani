// ═══════════════════════════════════════════════════════════
// VEL AI — NestJS Bootstrap
// ═══════════════════════════════════════════════════════════

// IMPORTANT: env must be loaded before any other imports
// Using require() because ES imports are hoisted above all code
/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: '.env' });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response } from 'express';
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
    console.log('Sentry initialized');
  }

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        process.env.BETTER_AUTH_URL,
        'http://127.0.0.1:3000',
        'http://localhost:3000',
        'https://app.better-auth.com',
      ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: process.env.CORS_METHODS?.split(',').map((m) => m.trim()) || [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: process.env.CORS_HEADERS?.split(',').map((h) => h.trim()) || [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
    ],
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
  console.log(`\n🚀 VEL AI API running on port ${port}\n`);
}

bootstrap();
