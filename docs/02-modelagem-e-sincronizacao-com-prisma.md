# 02 · Contrato, banco e migrações

[← Anterior](01-prepacao-do-ambiente.md) · [Índice](../README.md) · **Etapa 2 de 11** · [Próxima →](03-criando-rotas-serv-contro.md)

## Resultado desta etapa

Um contrato `User` emitido, uma migração versionável, o banco verificado e o projeto compilável em ESM.

```mermaid
flowchart LR
    A[contract.prisma] -->|contract emit| B[contract.json + contract.d.ts]
    B -->|migration plan| C[migrations/app]
    C -->|db migrate| D[(PostgreSQL)]
    B --> E[Cliente tipado]
    D -->|db verify| F[Conferência do contrato]
```

> [!IMPORTANT]
> Use o banco de desenvolvimento **vazio** configurado na etapa 1. `migration plan` não acessa o banco, mas `db migrate` altera sua estrutura. Não aplique este fluxo sobre tabelas existentes sem seguir a seção de adoção ao final.

## 1. Substituir o contrato inicial

**Substitua todo o arquivo** `src/prisma/contract.prisma`, removendo os exemplos `User` e `Post` gerados pela CLI. Não acrescente outro modelo `User` ao que já existe.

<!-- file: src/prisma/contract.prisma -->
```prisma
// use prisma-8

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
}
```

Mantenha `// use prisma-8` como primeira linha. O contrato declara estrutura; não contém dados nem credenciais. `password` armazenará um hash bcrypt, nunca a senha enviada pelo usuário.

## 2. Substituir a configuração da CLI

<!-- file: prisma.config.ts -->
```typescript
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
```

`DIRECT_URL` é opcional e atende à CLI. A aplicação usa `DATABASE_URL`. O import de `prisma/config` funciona com a CLI fixada; `@prisma/cli-engine` também é usado pela configuração gerada originalmente.

## 3. Emitir o contrato e sincronizar skills

```bat
npm run contract:emit
npm run skills:sync
```

Confira que existem, na mesma pasta:

```text
src/prisma/
├── contract.prisma
├── contract.json
├── contract.d.ts
└── db.ts
```

Skills são instruções para agentes de programação. Não criam tabelas, não geram JWT e não são necessárias para a API atender requisições. Outros agentes podem ser incluídos em `skills.agents` se você os usa. Uma falha de sincronização deve ser diagnosticada, não escondida com `|| exit 0`.

## 4. Substituir o cliente gerado

<!-- file: src/prisma/db.ts -->
```typescript
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.js';
import contractJson from './contract.json' with { type: 'json' };
import { env } from '../config/env.js';

export const db = postgres<Contract>({
  contractJson,
  url: env.DATABASE_URL,
  poolOptions: { connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000 },
});
```

Todos os serviços importarão este módulo, compartilhando o cliente no mesmo processo. `tsx watch` reinicia o processo quando necessário; o cliente não precisa de um armazenamento global para sobreviver a processos diferentes. No capítulo 3 adicionaremos o fechamento das conexões ao encerrar o servidor.

## 5. Planejar, revisar e aplicar a primeira migração

Execute **uma linha por vez**, sem acrescentar numeração:

```bat
npx prisma migration plan --name init
```

Revise a pasta criada em `migrations/app/`. O plano inicial deve criar a tabela de usuários, chave primária e unicidade de e-mail. O contrato ainda não foi aplicado apenas por existir um plano.

```bat
npx prisma db migrate --advance-ref db
npx prisma db verify
npx prisma migration status
```

**Resultado esperado:** migração aplicada, banco compatível com o contrato e nenhuma migração pendente. O parâmetro `--advance-ref db` atualiza a referência local usada para planejar a próxima mudança.

> [!NOTE]
> Prisma 8 registra assinaturas e histórico no schema PostgreSQL `prisma_contract`, incluindo `marker` e `ledger`. A tabela `_prisma_migrations` pertence ao fluxo das versões anteriores. Os tipos deste tutorial são emitidos em `src/prisma/contract.d.ts` por `contract emit`, não por `db migrate` dentro de `node_modules`.

Versione **toda** a pasta `migrations/`, incluindo snapshots e refs, junto com os três arquivos do contrato. Não edite contratos JSON manualmente.

## 6. Conferir compilação e produção

Pare `npm run dev` com Ctrl+C antes de iniciar outro servidor na mesma porta.

```bat
npm run typecheck
npm run build
npm start
```

Em outro terminal:

```bat
curl.exe -i http://localhost:3000/health
```

Espere 200. Confira também `dist/prisma/contract.json`: `tsc` copia o JSON importado para junto do cliente compilado. Não edite `dist/`; ele será regenerado pelo build.

## 7. Repetir o ciclo ao mudar modelos

```bat
npm run contract:emit
npx prisma migration plan --name descreva_a_mudanca
```

Revise o plano antes de continuar:

```bat
npx prisma db migrate --advance-ref db
npx prisma db verify
npm run typecheck
npm run build
```

Não planeje duas mudanças sucessivas sem aplicar a anterior ou selecionar explicitamente a origem. Não misture `db init` com uma primeira migração planejada sobre banco vazio: este guia usa migrações desde o início.

<details>
<summary>Alternativa: adotar um banco que já possui tabelas</summary>

Esta é uma **alternativa**, não uma continuação do exercício. Trabalhe em uma cópia de desenvolvimento e faça backup antes de mudanças estruturais.

```bat
npx prisma contract infer
npm run contract:emit
npx prisma db sign
npx prisma db verify
```

Revise o contrato inferido e os modelos reais. `db sign` confirma a estrutura e registra o contrato existente; não substitui as tabelas pelo exemplo `User`. A inferência só será compatível com os serviços deste guia se o modelo tiver os campos exigidos aqui, inclusive o hash `password`. Para planejar mudanças depois da adoção, siga a documentação oficial de migrações e confira a referência `db`.

</details>

<details>
<summary>Diagnóstico</summary>

| Sintoma | Verificação |
|---|---|
| Modelo `User` duplicado | Substitua o contrato inicial inteiro, não acrescente outro modelo |
| Contrato vazio ou não encontrado | Primeira linha `// use prisma-8`, caminho único em `src/prisma` |
| `TS6059` | Fontes da aplicação ficam em `src`; não use `prisma/db.ts` fora de `rootDir` |
| `ERR_MODULE_NOT_FOUND` | Imports locais terminam em `.js`; mantenha `type=module` e `NodeNext` |
| Falha de conexão/TLS | Confira URL, senha, rede e parâmetros do Neon; não desative TLS para contornar |
| Tabela já existe | Você usou um banco não vazio ou misturou estratégias de inicialização |
| Violação de assinatura | Confira `db verify`, contrato emitido e migrações pendentes |

</details>

## Conferência antes de avançar

- [ ] Apenas o modelo `User` do exercício permanece no contrato.
- [ ] `contract.json` e `contract.d.ts` foram emitidos.
- [ ] Migração revisada e aplicada; `db verify` concluído.
- [ ] `typecheck`, `build` e `/health` em produção funcionam.

Referências: [contrato Prisma](https://www.prisma.io/docs/orm/contract-authoring/the-data-contract) · [ciclo de migrações](https://www.prisma.io/docs/orm/core-concepts) · [aplicação de migrações](https://www.prisma.io/docs/orm/migrations/applying-a-migration).

[← Anterior](01-prepacao-do-ambiente.md) · [03 · CRUD e arquitetura →](03-criando-rotas-serv-contro.md)
