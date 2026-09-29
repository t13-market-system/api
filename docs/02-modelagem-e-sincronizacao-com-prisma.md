# 🗄️ Modelagem e Sincronização com Prisma

> [!NOTE]  
> Vamos modelar nosso banco de dados conforme as necessidades da aplicação e conectá-lo usando a arquitetura moderna do Prisma 8.

## 9️⃣ Configurar a Instância do Prisma (Ligação Global)

Para interagir com o banco, instanciamos o Prisma. Se fizermos isso diretamente nas rotas, o `tsx watch` criará inúmeras conexões a cada reload (salvamento de arquivo), causando lentidão e até bloqueando o acesso ao banco de dados. 

Para resolver isto, vamos criar uma **única instância do Prisma** e partilhá-la com toda a aplicação. Crie uma pasta `lib` dentro de `src/`, e nela o arquivo `prisma.ts`:

```typescript
// src/lib/prisma.ts
import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../../prisma/contract"; 
import contractJson from "../../prisma/contract.json" with { type: "json" };

export const prisma = postgres<Contract>({
  contractJson,
  url: process.env.DATABASE_URL!, 
});
```

## 🔟 Definir seu Primeiro Modelo

Abra o arquivo `prisma/contract.prisma` e adicione um modelo de teste. No Prisma 8, a sintaxe simplificou e apenas os `model`s precisam estar declarados no arquivo:

```prisma
// prisma/contract.prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
}
```

> [!IMPORTANT]  
> **Verifique o `prisma.config.ts` na raiz.** Garanta que o caminho dentro da chave `contract` aponte corretamente para `./prisma/contract.prisma`:

```typescript
// prisma.config.ts
import "dotenv/config";
import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./prisma/contract.prisma", 
    db: {
      connection: process.env["DIRECT_URL"] || process.env["DATABASE_URL"]!,
    },
  }),
  skills: {
    agents: ["claude", "cursor", "agents", "devin"],
  },
});
```

## 1️⃣1️⃣ Sincronizar o Banco de Dados

Abra o **Prompt de Comando (CMD)** sem acesso de administrador e execute a sequência abaixo.

> [!WARNING]  
> Antes, certifique-se de que o pacote `@prisma/orm-postgres` e o utilitário `dotenv` estão devidamente instalados (`npm i -D @prisma/orm-postgres dotenv`).

**Comandos de Sincronização (Contract-First):**
Execute-os linha por linha:

```bash
1 - npx prisma contract emit
2 - npx prisma migration plan --name nome_mig
3 - npx prisma db migrate --advance-ref db
4 - npx prisma skills sync
```

### O Movimento Inverso (Database-First)
Se você já criar as tabelas manualmente no banco de dados e quiser sincronizá-las de volta para o Prisma, a sequência mágica é:
```bash
1 - Crie as tabelas manualmente no seu banco
2 - npx prisma contract infer
3 - npx prisma contract emit
4 - npx prisma db sign
```

> [!TIP]  
> **O que o `migrate` faz nos bastidores?**
> 1. Cria a tabela `User` no Postgres com todas as colunas declaradas.
> 2. Cria a tabela `_prisma_migrations` para gerenciar o histórico ("save points").
> 3. Gera os tipos do TypeScript dentro da sua pasta `node_modules` para garantir 100% de segurança no código (`Type-Safety`).

---
➡️ *Pronto para programar? Siga para a Parte 3:* [03-criando-rotas-serv-contro.md](./03-criando-rotas-serv-contro.md)
