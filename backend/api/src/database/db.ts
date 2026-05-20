// ═══════════════════════════════════════════════════════════
// VEL AI — PostgreSQL Connection (Supabase)
// ═══════════════════════════════════════════════════════════

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let db: ReturnType<typeof drizzle<typeof schema>>;

if (process.env.DATABASE_URL) {
  const client = postgres(process.env.DATABASE_URL, {
    prepare: false,
    ssl: 'require',
  });
  db = drizzle(client, { schema });
  console.log('✅ Database connected via Drizzle');
} else {
  console.warn(
    '⚠️  DATABASE_URL not set — database features will be unavailable.',
  );
  db = new Proxy({} as any, {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      return (..._args: any[]) => {
        throw new Error(
          'Database not configured. Set DATABASE_URL in backend/api/.env',
        );
      };
    },
  });
}

export { db };
export type DB = typeof db;
