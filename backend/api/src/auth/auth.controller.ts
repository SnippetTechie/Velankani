// ═══════════════════════════════════════════════════════════
// VEL AI — Better Auth Route Handler (NestJS)
// ═══════════════════════════════════════════════════════════

import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { auth } from './auth';
import { toNodeHandler } from 'better-auth/node';

const handler = auth ? toNodeHandler(auth) : null;

function setCorsHeaders(req: Request, res: Response) {
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://vel-ai.netlify.app',
    'https://vel-ai-seven.vercel.app',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
  ];

  if (allowedOrigins.includes(origin) || origin.endsWith('.netlify.app') || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
}

@Controller('auth')
export class AuthController {
  @All()
  async handleAuthRoot(@Req() req: Request, @Res() res: Response) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    if (!handler) {
      return res.status(503).json({ error: 'Auth not configured — DATABASE_URL is required' });
    }
    return handler(req, res);
  }

  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    if (!handler) {
      return res.status(503).json({ error: 'Auth not configured — DATABASE_URL is required' });
    }
    return handler(req, res);
  }
}
