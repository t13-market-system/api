#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4459abc7e957b9d2d18714f12e198e40088c8dc0e8d9274e78cecb05d1c8eea6/contract';
import startContract from '../../snapshots/4459abc7e957b9d2d18714f12e198e40088c8dc0e8d9274e78cecb05d1c8eea6/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b8f05b8e8a143aaedc49e98ed10fd54f7428de4130897f054fbabdc69a080d33/contract';
import endContract from '../../snapshots/b8f05b8e8a143aaedc49e98ed10fd54f7428de4130897f054fbabdc69a080d33/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'cliente',
        columns: [
          col('email_cliente', 'character varying', { codecRef: { codecId: 'sql/varchar@1' } }),
          col('id_cliente', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nome_cliente', 'character varying', { codecRef: { codecId: 'sql/varchar@1' } }),
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
          col('nome_cliente', 'character varying', { codecRef: { codecId: 'sql/varchar@1' } }),
        ],
        constraints: [primaryKey(['id_Teste'], { name: 'idTeste_pkey' })],
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
