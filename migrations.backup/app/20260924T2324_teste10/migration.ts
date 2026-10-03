#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0a290316529d86579865bf5b51988c540098ed83fead7cbe86cf7da4a8c6ef95/contract';
import endContract from '../../snapshots/0a290316529d86579865bf5b51988c540098ed83fead7cbe86cf7da4a8c6ef95/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b8f05b8e8a143aaedc49e98ed10fd54f7428de4130897f054fbabdc69a080d33/contract';
import startContract from '../../snapshots/b8f05b8e8a143aaedc49e98ed10fd54f7428de4130897f054fbabdc69a080d33/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'teste', column: 'nome_cliente' }),
      this.addColumn({
        schema: 'public',
        table: 'teste',
        column: col('nome_test', 'character varying', { codecRef: { codecId: 'sql/varchar@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
