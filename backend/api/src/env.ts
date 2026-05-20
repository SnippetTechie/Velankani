// ═══════════════════════════════════════════════════════════
// VEL AI — Environment Loader (must be imported FIRST)
// ═══════════════════════════════════════════════════════════

import { config } from 'dotenv';
import { resolve } from 'path';

// Load root .env first, then local .env (local overrides root)
config({ path: resolve(__dirname, '../../../.env') });
config({ path: '.env' });
