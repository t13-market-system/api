#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/38085736cfacf6293b3002fa52b40c1aaa581d9000d178ff56e91fb166d4884f/contract';
import endContract from '../../snapshots/38085736cfacf6293b3002fa52b40c1aaa581d9000d178ff56e91fb166d4884f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'cliente',
        columns: [
          col('email_cliente', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id_cliente', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nome_cliente', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id_cliente'], { name: 'cliente_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'tel_cliente',
        columns: [
          col('id_cliente', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id_tel_cliente', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id_tel_cliente'], { name: 'tel_cliente_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'teste',
        columns: [
          col('id_Teste', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nome_test', 'character varying', { codecRef: { codecId: 'sql/varchar@1' } }),
        ],
        constraints: [primaryKey(['id_Teste'], { name: 'idTeste_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'user_pkey' })],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_email_key',
        columns: ['email'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'tel_cliente',
        foreignKey: {
          name: 'cliente_fk',
          columns: ['id_cliente'],
          references: { schema: 'public', table: 'cliente', columns: ['id_cliente'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
