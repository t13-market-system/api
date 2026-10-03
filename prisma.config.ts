/// <reference types="node" />
// Arquivo: prisma.config.ts
import 'dotenv/config';
import { definePrismaConfig } from 'prisma/config';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

const connection = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connection) throw new Error('Configure DATABASE_URL ou DIRECT_URL antes de usar a CLI.');

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    db: { connection },
  }),
  skills: { agents: ['agents'] },
});