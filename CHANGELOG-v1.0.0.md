# VEL AI — v1.0.0 Production Deployment Changelog

**Date:** May 20–21, 2026  
**Deployed by:** Somesh S. Talligeri  
**Tag:** `v1.0.0`

---

## Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://vel-ai.netlify.app |
| Backend API | https://vel-ai-api-production.up.railway.app |
| Health Check | https://vel-ai-api-production.up.railway.app/api/v1/health |
| Database | Supabase PostgreSQL (ap-southeast-2) |

---

## What Was Done

### 1. Environment & Database Setup

- Created `.env` files with API keys (OpenRouter for Claude/GPT/Gemini)
- Connected Supabase PostgreSQL via connection pooler (IPv6 workaround)
- URL-encoded special characters in database password (`!` → `%21`)
- Created all application tables: `users`, `workspaces`, `tiles`, `messages`, `credit_transactions`, `subscriptions`, `usage_events`, `workflow_recordings`
- Created Better Auth tables: `user`, `session`, `account`, `verification`
- Created dev user for development fallback

### 2. Authentication (Better Auth)

- Configured Better Auth with `pg` Pool (Supabase compatible)
- Added `dash` plugin for Better Auth dashboard
- Fixed `BetterAuthError: Failed to initialize database adapter` by switching from direct DB URL to pooler URL
- Made auth gracefully handle missing DATABASE_URL (returns 503 instead of crashing)
- Added `unhandledRejection` handler to prevent dash plugin crashes
- Implemented user sync: Better Auth users → app `users` table via `clerk_id` field
- Added Bearer token support for cross-domain session verification
- Direct DB session lookup fallback when cookie-based auth fails
- Configured `trustedOrigins` with all production domains
- Set `sameSite: 'none'` and `secure: true` for cross-domain cookies
- Stored session tokens in localStorage for cross-domain Bearer auth

### 3. Backend Fixes

- Fixed `dotenv` loading order — moved to `require()` before ES imports to ensure env vars are available when modules load
- Fixed `db.ts` — added SSL config (`ssl: 'require'`) for Supabase pooler
- Fixed `verifyOwnership` — skip UUID validation for slug-based workspace IDs
- Fixed `AnalyticsService` — validate UUID format before inserting into UUID columns
- Fixed auth guard — `ensureAppUser` creates/finds app user on every authenticated request
- Fixed duplicate message saves — moved from React state updater to local variable tracking
- Added raw Express CORS middleware before NestJS pipeline (fixes `toNodeHandler` bypassing CORS)
- CORS reflects requesting origin dynamically for credentials support

### 4. Frontend Fixes

- Fixed broken logo — changed `<Image src="/logo.png">` to `<img src="/logo.avif">` (file was AVIF renamed to .png)
- Fixed sign-in/sign-up pages — store session token in localStorage on success
- Fixed `useAuth` hook — reads token from localStorage instead of calling backend
- Fixed middleware — skip server-side redirect in production (cross-domain cookies not visible)
- Added user message display in chat UI
- Added chat history from database (side-by-side grid layout matching live responses)
- Added sidebar chat list (tiles within workspace)
- Added "New Chat" button (creates tile within current workspace)
- Added real user name display with sign-out on hover
- Added workspace list on dashboard (fetched from API)
- Fixed duplicate bot responses — show either chatHistory OR modelResponses, never both
- Fixed `TypeError: Cannot read properties of undefined` — added null guards on `setModelResponses`
- Fixed `signOut` type error for Vercel build

### 5. Database Schema & Migrations

- Created all enums: `plan`, `tile_type`, `message_role`, `tx_reason`
- Created tables with proper foreign keys, indexes, and defaults
- Workspace → Tiles → Messages hierarchy
- Credit transactions tracking
- Usage events analytics

### 6. Deployment

#### Attempted Platforms:
- **Render** — Backend deployed but CORS issues due to slow auto-deploy on free tier
- **Vercel** — Frontend deployed successfully but cross-domain cookie issues
- **Railway** — Final backend platform ✅
- **Netlify** — Final frontend platform ✅

#### Deployment Issues Fixed:
| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `baseUrl` deprecated in TS 7.0 | Render's newer TypeScript | Removed `baseUrl` from tsconfig.build.json |
| `Cannot find module 'drizzle-orm'` | devDependencies skipped in production | Moved to dependencies + root package.json |
| `ERESOLVE peer dependency conflict` | drizzle-orm version mismatch with better-auth | Added `.npmrc` with `legacy-peer-deps=true` |
| Railway nixpacks `npm ci` fails | Doesn't read `.npmrc` | Switched to Dockerfile builder |
| `MODULE_NOT_FOUND @vel-ai/shared` | Workspace symlink not in Docker production stage | Added `ln -sf` symlink in Dockerfile |
| `Cannot find module 'dist/models.js'` | Shared package exports pointed to wrong path | Fixed to `./dist/types/*.js` |
| CORS `No Access-Control-Allow-Origin` | NestJS CORS doesn't cover `toNodeHandler` routes | Raw Express middleware before NestJS |
| `Invalid origin` from Better Auth | Vercel/Netlify URL not in trustedOrigins | Hardcoded + env-based trustedOrigins |
| Frontend still hitting old Render URL | `NEXT_PUBLIC_API_URL` baked at build time | Updated `netlify.toml` + force rebuild |

#### Final Deployment Config:

**Railway (Backend):**
- Builder: Dockerfile (multi-stage)
- Start: `node backend/api/dist/main.js`
- Env vars: DATABASE_URL, BETTER_AUTH_SECRET, OPENROUTER_API_KEY, etc.

**Netlify (Frontend):**
- Framework: Next.js 14 with `@netlify/plugin-nextjs`
- Build: `npm ci && cd frontend/web && npm run build`
- Env: `NEXT_PUBLIC_API_URL=https://vel-ai-api-production.up.railway.app/api/v1`

### 7. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VEL AI v1.0.0                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (Netlify)          Backend (Railway)          │
│  ┌───────────────┐          ┌──────────────────┐       │
│  │ Next.js 14    │  Bearer  │ NestJS + Express │       │
│  │ App Router    │ ──────── │ Better Auth      │       │
│  │ Tailwind CSS  │  Token   │ Drizzle ORM      │       │
│  │ Zustand       │          │ OpenRouter SDK   │       │
│  └───────────────┘          └────────┬─────────┘       │
│                                      │                  │
│                              ┌───────┴────────┐        │
│                              │   Supabase     │        │
│                              │   PostgreSQL   │        │
│                              └────────────────┘        │
│                                                         │
│  Shared Package: @vel-ai/shared (TypeScript types)     │
│  Monorepo: Turborepo + npm workspaces                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 8. Files Modified/Created

| File | Action |
|------|--------|
| `.env` | Created with all API keys |
| `.npmrc` | Created (legacy-peer-deps) |
| `Dockerfile` | Fixed (--legacy-peer-deps, symlink) |
| `railway.toml` | Created (Dockerfile builder) |
| `nixpacks.toml` | Created (Railway config) |
| `netlify.toml` | Created (Netlify build config) |
| `vercel.json` | Updated (headers, caching) |
| `render.yaml` | Created (Render config) |
| `packages/shared/package.json` | Fixed exports for CommonJS |
| `packages/shared/tsconfig.json` | Changed to CommonJS output |
| `backend/api/package.json` | Moved deps from devDeps |
| `backend/api/tsconfig.build.json` | Removed deprecated baseUrl |
| `backend/api/src/main.ts` | Raw CORS middleware |
| `backend/api/src/auth/auth.ts` | trustedOrigins, cookie config |
| `backend/api/src/auth/auth.controller.ts` | Simplified (CORS handled globally) |
| `backend/api/src/guards/clerk-auth.guard.ts` | Bearer token + DB session lookup |
| `backend/api/src/database/db.ts` | SSL config, connection logging |
| `backend/api/src/modules/workspace/workspace.service.ts` | UUID validation |
| `backend/api/src/modules/analytics/analytics.service.ts` | UUID guards |
| `frontend/web/lib/auth-client.ts` | localStorage token storage |
| `frontend/web/lib/hooks/useAuth.ts` | Read from localStorage |
| `frontend/web/middleware.ts` | Skip redirect in production |
| `frontend/web/app/(auth)/sign-in/page.tsx` | Store token, fix logo |
| `frontend/web/app/(auth)/sign-up/page.tsx` | Store token, fix logo |
| `frontend/web/app/(app)/workspace/[id]/page.tsx` | Chat UI, messages, sidebar |
| `frontend/web/app/(app)/dashboard/page.tsx` | Real workspaces from API |

---

## Git History (Key Commits)

```
b983566 fix: update netlify.toml API URL to Railway
9a6cd9c fix: correct shared package exports path, fix Dockerfile symlink
34f815d fix: use Dockerfile for Railway, add --legacy-peer-deps
10f274a fix: raw Express CORS middleware, shared package CommonJS output
c9e0282 fix: reflect origin in CORS for credentials support
884aab1 fix: CORS on auth routes, direct DB session lookup for Bearer tokens
fc8ec8f fix: hardcode vercel origin in trustedOrigins, improve CORS
7076b99 fix: store session token in localStorage for cross-domain Bearer auth
58c0137 fix: add production origin to trustedOrigins, fix logo.png to logo.avif
```

---

## Lessons Learned

1. **Cross-domain auth is hard** — Cookie-based sessions don't work across different domains. Bearer tokens in localStorage are the pragmatic solution.
2. **NestJS CORS doesn't cover raw handlers** — `toNodeHandler` from Better Auth bypasses NestJS's response pipeline. Raw Express middleware is needed.
3. **npm workspaces + Docker** — Symlinks don't survive Docker COPY. Must recreate them or use proper package exports.
4. **`NEXT_PUBLIC_` vars are build-time** — Must be set before `next build`, not at runtime.
5. **Supabase direct connection is IPv6-only** — Use the pooler URL for IPv4 compatibility.
6. **Free tier platforms are slow** — Render free tier takes 5-10 min to auto-deploy. Railway with Docker is faster and more reliable.
