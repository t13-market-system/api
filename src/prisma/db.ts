// Arquivo: src/prisma/db.ts
import 'temporal-polyfill/full/global';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.js';
import contractJson from './contract.json' with { type: 'json' };
import { env } from '../config/env.js';

export const db = postgres<Contract>({
  contractJson,
  url: env.DATABASE_URL,
  poolOptions: { connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000 },
});