  # Vamos modelar nosso bando de dados conforme as necessidades da aplicação.

## 9. ## Passo 9: Configurar a Instância do Prisma (A Ligação Global)

Para interagir com a base de dados, precisamos de instanciar o `PrismaClient`. No entanto, se o fizermos diretamente dentro das nossas rotas, o nosso servidor vai criar uma nova ligação à base de dados cada vez que um arquivo for guardado (devido ao `tsx watch`), causando lentidão e bloqueando a base de dados.

Para resolver isto, vamos criar uma única instância do Prisma e partilhá-la com toda a aplicação.

Crie uma pasta chamada `lib` dentro de `src/`, e dentro dela crie o arquivo `prisma.ts`:

```typescript
import "temporal-polyfill/global";
import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
// Apontando para o contract gerado, não mais para schema
import type { Contract } from "../../prisma/contract"; 
import contractJson from "../../prisma/contract.json" with { type: "json" };

export const prisma = postgres<Contract>({
  contractJson,
  url: process.env.DATABASE_URL!, 
});
```

## 10. Defina seu primeiro Modelo (Tabela):



Abra o arquivo prisma/contract.prisma e adicione um modelo simples de teste logo abaixo 
no prisma 8 apenas o model deve estar dentro do arquivo

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
}

```

## Verifique o arquivo prisma.config.ts
Verifique se está de acordo com o exemplo abaixo:


```typescript
import "dotenv/config";
import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./prisma/contract.prisma", 
    db: {
      // Garante o uso da conexão direta do Neon para as migrations
      connection: process.env["DIRECT_URL"] || process.env["DATABASE_URL"]!,
    },
  }),
  skills: {
    agents: ["claude", "cursor", "agents", "devin"],
  },
});

```

## 11 - Sicrnonizar o banco de dados

No terminal do VS Code, execute os comandos abaixo:
obs.: Veifique se o prisma foi instalado com as dependências de desenvolvimento
obs.: Se o prisma não estiver instalado, execute o comando `npm install -D @prisma/orm-postgres dotenv`


```bash
1 - npx prisma contract emit

2 - npx prisma migration plan --name nome_mig

3 - npx prisma db migrate --advance-ref db

4 - npx prisma skills sync
```

É possível realizar o movimento inverso ⟶ Criamos as tabelas no banco de dados e sincronizamos com o prisma DataBase-First
```bash
1 - Criamos as tabelas no banco de dados
2 - npx prisma contract infer
3 - npx prisma contract emit
4 - npx prisma db sign
```
O que aconteceu nos bastidores?
Quando você rodou o migrate, o Prisma fez três coisas cruciais  

1. Criou a tabela User: Com as colunas id, email, name, password e createdAt.
2. Criou a tabela _prisma_migrations: Onde o Prisma anota o histórico de mudanças (como um "save point" de videogame).
3. Gerou o Prisma Client: Criou os tipos dentro da sua pasta node_modules para que o TypeScript saiba exatamente como interagir com o banco.
