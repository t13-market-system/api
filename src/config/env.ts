// Arquivo: src/config/env.ts
import 'dotenv/config';
import { z } from 'zod';

const origin = z.url().refine(value => {
  const url = new URL(value);
  return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
}, 'Use uma origem HTTP(S), sem caminho nem barra final.');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  FRONTEND_ORIGIN: origin.default('http://localhost:5173'),
  API_ORIGIN: origin.default('http://localhost:3000'),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'Use uma URL PostgreSQL.').pipe(z.url()),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter pelo menos 32 caracteres.'),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  throw new Error(`Ambiente inválido: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
}
export const env = result.data;