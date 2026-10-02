# 01 · Preparação do ambiente

[← Índice](../README.md) · **Etapa 1 de 11** · [Próxima →](02-modelagem-e-sincronizacao-com-prisma.md)

> [!IMPORTANT]
> Execute o tutorial em uma pasta **nova**, chamada `api`, com um banco de desenvolvimento vazio. O código atual deste repositório não é automaticamente atualizado por estes capítulos. Não copie migrações antigas para o projeto novo.

## Resultado desta etapa

Uma aplicação Express em TypeScript com `/health`, configuração de ambiente validada e scripts de desenvolvimento e produção.

## 1. Conferir os requisitos

Se já existe uma pasta `api`, escolha outra pasta vazia ou outro diretório pai para este exercício; não sobrescreva sua tentativa anterior.

| Requisito | Versão adotada | Conferência |
|---|---|---|
| Node.js | 24.15.0 ou versão posterior compatível | `node --version` |
| npm | 11 | `npm --version` |
| PostgreSQL | 15 ou superior, local ou Neon | `SELECT version();` no editor SQL |
| Terminal | CMD no Windows | Abra na pasta que conterá `api` |

Os blocos `bat` usam **CMD**. No PowerShell, use `npm.cmd` e `npx.cmd` se a política de execução bloquear os arquivos `.ps1`; não é necessário mudar essa política.

```bat
mkdir api
cd api
npm init -y
npm pkg set type=module
npm pkg set private=true --json
```

> [!NOTE]
> Este guia usa versões candidatas do Prisma 8: CLI `8.0.0-rc.15` e ORM PostgreSQL `8.0.0-rc.11`. Essa combinação corresponde ao toolchain da CLI. Números diferentes entre CLI e ORM não significam, por si só, incompatibilidade. Não troque por `latest` no meio do tutorial.

## 2. Instalar dependências de execução

```bat
npm install --save-exact express@5.2.1 @prisma/orm-postgres@8.0.0-rc.11 dotenv@18.0.5 bcrypt@6.0.0 jsonwebtoken@9.0.3 zod@4.6.5 helmet@8.3.0 cors@2.8.6 express-rate-limit@8.7.0 cookie-parser@1.4.7 morgan@1.12.1 winston@3.19.0
```

| Pacotes | Função |
|---|---|
| `express` | HTTP, rotas e tratamento de erros assíncronos do Express 5 |
| `@prisma/orm-postgres`, `dotenv` | Banco e carregamento do `.env`; necessários também em produção |
| `bcrypt`, `jsonwebtoken`, `cookie-parser` | Hash de senha, JWT e leitura de cookies |
| `zod` | Validação e normalização das entradas |
| `helmet`, `cors`, `express-rate-limit` | Cabeçalhos, política de origem e limites de requisições |
| `morgan`, `winston` | Logs HTTP e logs da aplicação |

Não instalamos `@prisma/client`: este tutorial usa a API do Prisma 8 em `@prisma/orm-postgres/runtime`. O driver PostgreSQL já acompanha o pacote; não há import direto de `pg` na aplicação.

## 3. Instalar ferramentas de desenvolvimento

```bat
npm install -D --save-exact prisma@8.0.0-rc.15 @prisma/cli-engine@0.4.0 typescript@5.9.3 tsx@4.23.15 @types/node@26.6.4 @types/express@5.0.6 @types/bcrypt@6.0.0 @types/jsonwebtoken@9.0.10 @types/cors@2.8.19 @types/cookie-parser@1.4.10 @types/morgan@1.9.10
npm ls --depth=0
```

`@prisma/cli-engine@0.4.0` é a dependência declarada pela CLI escolhida. Versione `package.json` e `package-lock.json`; nos clones seguintes use `npm ci`.

## 4. Inicializar o Prisma uma única vez

```bat
npx prisma orm init --yes --target postgres --authoring psl --schema-path src/prisma/contract.prisma --write-env --skip-install
```

O caminho e a criação do `.env` estão explícitos. `--skip-install` evita uma instalação automática com versões diferentes e **não emite o contrato**. Faremos a emissão após definir o modelo no capítulo 2.

| Arquivo criado | Uso |
|---|---|
| `src/prisma/contract.prisma` | Fonte do modelo, inicialmente com exemplos `User` e `Post` |
| `src/prisma/db.ts` | Cliente gerado; será substituído no capítulo 2 |
| `prisma.config.ts` | Configuração da CLI; será substituída no capítulo 2 |
| `prisma-8.md` | Referência gerada pela versão instalada |
| `.env.example`, `.env` | Modelo de ambiente e configuração local |

> [!CAUTION]
> Não execute `orm init` novamente para corrigir um detalhe. Ele pode substituir arquivos. Se a pasta já foi inicializada, siga editando os arquivos indicados. Para repetir o tutorial, crie outra pasta vazia. `--yes` não concede autorização para sobrescrever arquivos existentes.

## 5. Configurar TypeScript **depois** da inicialização

A CLI pode modificar `tsconfig.json` e `package.json`. Por isso, reforce o modo ESM e substitua o `tsconfig.json` agora. Não execute `tsc --init` sobre o arquivo já criado.

```bat
npm pkg set type=module
```

**Substitua todo o conteúdo de `tsconfig.json`:**

<!-- file: tsconfig.json -->
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "types": ["node"],
    "noEmitOnError": true
  },
  "include": ["src/**/*.ts", "src/**/*.json"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

> [!TIP]
> Imports entre arquivos do projeto terminam em **`.js`**, mesmo dentro de `.ts`. O TypeScript encontra a fonte `.ts` e preserva o caminho correto para o Node em produção. JSON usa `with { type: 'json' }`. `tsx` também aceita esses imports.

## 6. Preparar ambiente e Git

Gere uma chave local e copie a saída para `JWT_SECRET`:

```bat
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Substitua `.env.example` por este modelo, sem credenciais reais:

<!-- file: .env.example -->
```dotenv
NODE_ENV=development
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
API_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:5432/BANCO?sslmode=require
DIRECT_URL=
JWT_SECRET=SUBSTITUA_POR_UMA_CHAVE_ALEATORIA_DE_PELO_MENOS_32_CARACTERES
```

Edite **`.env`** com a URL real do seu banco de desenvolvimento e a chave gerada. No Neon, obtenha a URL no painel **Connect**. Preserve os parâmetros fornecidos pelo provedor. `DIRECT_URL`, opcional, recebe a conexão sem pool usada pela CLI; `DATABASE_URL` é usada pela aplicação. Se o banco for local, use seus próprios parâmetros de conexão e TLS.

Crie ou complete `.gitignore`:

<!-- file: .gitignore -->
```gitignore
node_modules/
dist/
coverage/
logs/
cookies.txt
.env
.env.*
!.env.example
```

Versione o `.env.example` com placeholders, os contratos gerados e a pasta `migrations/`. Nunca preencha o exemplo público com segredos reais.

Crie `src/config/env.ts`:

<!-- file: src/config/env.ts -->
```typescript
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
```

## 7. Adicionar scripts

Preserve as dependências e os demais campos de `package.json`. Substitua apenas o objeto `scripts` pelos pares abaixo; o bloco é o **valor desse objeto**, não um `package.json` inteiro.

<!-- scripts -->
```json
{
  "dev": "tsx watch src/server.ts",
  "typecheck": "tsc --noEmit",
  "build": "tsc",
  "start": "node dist/server.js",
  "contract:emit": "prisma contract emit",
  "skills:sync": "prisma skills sync"
}
```

O comando `test` será criado com testes de verdade no capítulo 9. A sincronização de skills é explícita, sem esconder erros em `postinstall`.

## 8. Criar a aplicação inicial

Crie `src/app.ts`:

<!-- file: src/app.ts -->
```typescript
import express from 'express';

export const app = express();
app.use(express.json({ limit: '16kb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
```

Crie `src/server.ts`:

<!-- file: src/server.ts -->
```typescript
import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`API disponível em http://localhost:${env.PORT}`);
});
```

Inicie em um terminal e mantenha-o aberto:

```bat
npm run dev
```

Em **outro CMD**, na mesma pasta:

```bat
curl.exe -i http://localhost:3000/health
```

Resultado esperado: HTTP **200** e `{"status":"ok"}`. Se escolheu outra porta, ajuste a URL e `API_ORIGIN` no `.env`. Uma resposta 404 em `/` é normal: não criamos essa rota.

> [!IMPORTANT]
> A inicialização também criou `src/prisma/db.ts`, que depende do contrato ainda não emitido. Por isso, a primeira verificação de `typecheck` e `build` ocorrerá **no capítulo 2**, após substituir os exemplos e emitir o contrato. Não interprete essa etapa intermediária como configuração final.

<details>
<summary>Diagnóstico de erros desta etapa</summary>

| Sintoma | Ação |
|---|---|
| `npm` não encontrado | Corrija a instalação/PATH do Node e reabra o terminal |
| `EADDRINUSE` | Pare o servidor anterior com Ctrl+C ou escolha outra `PORT` |
| Ambiente inválido | Corrija os campos indicados no `.env` |
| `CLI.CONSENT_REQUIRED` | A pasta não está vazia; não reinicialize o projeto existente |
| Skills desatualizadas | No capítulo 2 execute `npm run skills:sync`; isso não cria tabelas |

</details>

## Conferência antes de avançar

- [ ] Node e npm conferidos; instalação concluída sem erro.
- [ ] `package.json` declara `"type": "module"`.
- [ ] Schema em `src/prisma/contract.prisma`.
- [ ] `.env` configurado e ignorado pelo Git.
- [ ] `/health` responde 200.

Referências: [inicialização do Prisma](https://www.prisma.io/docs/cli/orm-init) · [ES Modules no Node](https://nodejs.org/api/esm.html) · [NodeNext no TypeScript](https://www.typescriptlang.org/tsconfig/moduleResolution.html).

[← Índice](../README.md) · [02 · Banco e contrato →](02-modelagem-e-sincronizacao-com-prisma.md)
