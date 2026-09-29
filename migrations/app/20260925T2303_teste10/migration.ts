#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/0a290316529d86579865bf5b51988c540098ed83fead7cbe86cf7da4a8c6ef95/contract';
import startContract from '../../snapshots/0a290316529d86579865bf5b51988c540098ed83fead7cbe86cf7da4a8c6ef95/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/3122a1077d021b169d6267a40d6e536aee78dbae2a8183497e42ea883b5e29f4/contract';
import endContract from '../../snapshots/3122a1077d021b169d6267a40d6e536aee78dbae2a8183497e42ea883b5e29f4/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'fornecedor',
        columns: [
          col('email_fornecedor', 'character varying', { codecRef: { codecId: 'sql/varchar@1' } }),
          col('id_fornecedor', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nome_fornecedor', 'character varying', { codecRef: { codecId: 'sql/varchar@1' } }),
        ],
        constraints: [primaryKey(['id_fornecedor'], { name: 'fornecedor_pkey' })],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
