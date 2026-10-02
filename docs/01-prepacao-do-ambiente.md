<!-- Documento: docs/01-prepacao-do-ambiente.md -->

# 01 · Preparação do ambiente

[← Índice](../README.md) · **Etapa 1 de 11** · [Próxima →](02-modelagem-e-sincronizacao-com-prisma.md)

> **📌 Importante**
>
> Execute o tutorial em uma pasta **nova**, chamada `api`, com um banco de desenvolvimento vazio. O código atual deste repositório não é automaticamente atualizado por estes capítulos. Não copie migrações antigas para o projeto novo.

## Resultado desta etapa

Uma aplicação Express em TypeScript com `/health`, configuração de ambiente validada e scripts de desenvolvimento e produção.

### Como trabalhar neste capítulo

Use um editor de texto para criar e salvar os arquivos e o **CMD** para executar os comandos. No Windows, abra a pasta desejada no Explorador de Arquivos, digite `cmd` na barra de endereço e pressione Enter: o terminal será aberto nessa pasta. Os blocos de comandos devem ser executados uma linha por vez; as linhas iniciadas por `REM` são apenas comentários do CMD.

Ao criar a pasta `api`, abra essa mesma pasta no editor. A expressão **raiz da API** sempre se refere à pasta que contém `package.json`. Salve os arquivos em UTF-8 e confira suas extensões: `.env` não pode virar `.env.txt`, nem `env.ts` virar `env.ts.txt`.

Nos passos com servidor, mantenha dois terminais: o primeiro executa `npm run dev` e fica ocupado atendendo pedidos; o segundo executa `curl.exe`. Para parar o servidor, volte ao primeiro e pressione Ctrl+C. Espere a linha de comando reaparecer antes de iniciar outro servidor na mesma porta.

## 1. Conferir os requisitos

**Propósito do passo:** Vamos conferir as ferramentas antes de criar arquivos. Node.js executa o JavaScript, npm instala os pacotes e PostgreSQL guarda os dados. Assim, um problema de instalação pode ser resolvido antes de aparecer misturado a um problema no código.

Se já existe uma pasta `api`, escolha outra pasta vazia ou outro diretório pai para este exercício; não sobrescreva sua tentativa anterior.

| Requisito | Versão adotada | Conferência |
|---|---|---|
| Node.js | 24.15.0 ou versão posterior compatível | `node --version` |
| npm | 11 | `npm --version` |
| PostgreSQL | 15 ou superior, local ou Neon | `SELECT version();` no editor SQL |
| Terminal | CMD no Windows | Abra na pasta que conterá `api` |

Os blocos `bat` usam **CMD**. No PowerShell, use `npm.cmd` e `npx.cmd` se a política de execução bloquear os arquivos `.ps1`; não é necessário mudar essa política.

Se Node.js ainda não estiver instalado, use o [download oficial do Node.js](https://nodejs.org/en/download), escolha a linha 24 para Windows e conclua a instalação com npm. A versão usada na validação foi 24.15.0. Depois da instalação, feche e reabra o CMD e execute `node --version` e `npm --version`. Confira as versões antes de continuar; não avance se o terminal disser que o comando não foi encontrado.

Prepare também um **banco vazio**, antes das migrações do capítulo 2. Escolha uma das opções abaixo; não é necessário usar as duas.

<details>
<summary>Opção A: usar PostgreSQL no Neon</summary>

Crie uma conta e um projeto de estudo no Neon. No painel do projeto, abra **Connect** (conectar), selecione o banco e o usuário que serão usados e copie a URL PostgreSQL. Essa URL contém a senha: guarde-a para preencher `.env` no passo 6. Se o projeto já possui tabelas, crie outro banco vazio pelo painel em vez de reutilizá-lo neste exercício.

O [guia de conexão do Neon](https://neon.com/docs/get-started/connect-neon) explica onde obter a URL. Não copie apenas o nome do host: a configuração precisa da URL completa, com os parâmetros de conexão fornecidos pelo provedor.

</details>

<details>
<summary>Opção B: usar PostgreSQL instalado no computador</summary>

Com o PostgreSQL instalado e iniciado, abra seu cliente SQL, como pgAdmin, e conecte-se ao banco administrativo `postgres`. Use um usuário que tenha permissão para criar bancos. No editor SQL, execute somente a instrução abaixo, fora de uma transação:

**Onde executar: editor SQL do PostgreSQL; este trecho não é um arquivo da API nem um comando CMD.**

```sql
-- Criar um banco vazio para o exercício; use outro nome se ele já existir.
CREATE DATABASE express_tutorial_dev TEMPLATE template0;
```

Você usará o nome `express_tutorial_dev`, o usuário e a senha dessa instalação na URL do passo 6. O [comando CREATE DATABASE](https://www.postgresql.org/docs/current/sql-createdatabase.html) exige permissão de criação. Se aparecer uma mensagem de banco já existente, escolha um novo nome; não apague o banco anterior para repetir o tutorial.

</details>

Agora crie a pasta do projeto no CMD. `mkdir` cria a pasta; `cd` entra nela; `npm init -y` cria `package.json` com os valores iniciais. `type=module` permite os imports usados no guia. `private=true` indica que este exercício não deve ser publicado como pacote npm.

```bat
REM Execute no CMD, na pasta que vai conter a nova API.
mkdir api
cd api
npm init -y
npm pkg set type=module
npm pkg set private=true --json
```

> **ℹ️ Observação**
>
> Este guia usa versões candidatas do Prisma 8: CLI `8.0.0-rc.15` e ORM PostgreSQL `8.0.0-rc.11`. As versões candidatas, identificadas por `rc`, antecedem a versão final; usamos uma combinação específica já testada. Números diferentes entre CLI e ORM não significam, por si só, incompatibilidade. Preserve as versões indicadas e não troque por `latest` no meio do tutorial.

## 2. Instalar dependências de execução

**Propósito do passo:** Estes pacotes são partes que a API usa quando está funcionando, como receber pedidos HTTP, acessar o banco e conferir senhas. O npm registra suas versões em package.json e instala os arquivos em node_modules.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm install --save-exact express@5.2.1 @prisma/orm-postgres@8.0.0-rc.11 temporal-polyfill@1.0.5 dotenv@18.0.5 bcrypt@6.0.0 jsonwebtoken@9.0.3 zod@4.6.5 helmet@8.3.0 cors@2.8.6 express-rate-limit@8.7.0 cookie-parser@1.4.7 morgan@1.12.1 winston@3.19.0
```

| Pacotes | Função |
|---|---|
| `express` | HTTP, rotas e tratamento de erros assíncronos do Express 5 |
| `@prisma/orm-postgres`, `dotenv` | Banco e carregamento do `.env`; necessários também em produção |
| `temporal-polyfill` | Suporte a `Temporal.Instant`, usado por `DateTime` no Prisma 8; necessário no Node.js 24 |
| `bcrypt`, `jsonwebtoken`, `cookie-parser` | Hash de senha, JWT e leitura de cookies |
| `zod` | Validação e normalização das entradas |
| `helmet`, `cors`, `express-rate-limit` | Cabeçalhos, política de origem e limites de requisições |
| `morgan`, `winston` | Logs HTTP e logs da aplicação |

Não instalamos `@prisma/client`: este tutorial usa a API do Prisma 8 em `@prisma/orm-postgres/runtime`. O driver PostgreSQL já acompanha o pacote; não há import direto de `pg` na aplicação.

## 3. Instalar ferramentas de desenvolvimento

**Propósito do passo:** Estas ferramentas ajudam a escrever, executar e conferir o projeto durante o desenvolvimento. Elas também serão necessárias para compilar a aplicação e aplicar migrações; por isso, serão instaladas separadamente dos pacotes de execução.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm install -D --save-exact prisma@8.0.0-rc.15 @prisma/cli-engine@0.4.0 typescript@5.9.3 tsx@4.23.15 @types/node@26.6.4 @types/express@5.0.6 @types/bcrypt@6.0.0 @types/jsonwebtoken@9.0.10 @types/cors@2.8.19 @types/cookie-parser@1.4.10 @types/morgan@1.9.10
npm ls --depth=0
```

`@prisma/cli-engine@0.4.0` é a dependência declarada pela CLI escolhida. Versione `package.json` e `package-lock.json`; nos clones seguintes use `npm ci`.

`-D` salva os pacotes como ferramentas de desenvolvimento. Os pacotes `@types/...` fornecem informações de tipos ao TypeScript. `npm ls --depth=0` mostra os pacotes instalados diretamente no projeto; confira que não há dependências ausentes. `package-lock.json` registra as versões resolvidas para permitir repetir a instalação com `npm ci` depois.

## 4. Inicializar o Prisma uma única vez

**Propósito do passo:** A inicialização cria a estrutura de arquivos que o Prisma espera. Usamos um caminho explícito para que todos trabalhem com o mesmo contrato e não acabem editando outro arquivo por engano.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npx prisma orm init --yes --target postgres --authoring psl --schema-path src/prisma/contract.prisma --write-env --skip-install
```

O caminho e a criação do `.env` estão explícitos. `--skip-install` evita uma instalação automática com versões diferentes e **não emite o contrato**. Faremos a emissão após definir o modelo no capítulo 2.

`npx` executa a ferramenta Prisma instalada no projeto. `--target postgres` escolhe PostgreSQL; `--authoring psl` escolhe o formato do contrato mostrado neste guia; `--schema-path` define o arquivo a editar; `--write-env` cria os arquivos de ambiente. A saída **written** significa “arquivos gravados” e **Done** significa “concluído”: confira os caminhos antes de continuar.

| Arquivo criado | Uso |
|---|---|
| `src/prisma/contract.prisma` | Fonte do modelo, inicialmente com exemplos `User` e `Post` |
| `src/prisma/db.ts` | Cliente gerado; será substituído no capítulo 2 |
| `prisma.config.ts` | Configuração da CLI; será substituída no capítulo 2 |
| `prisma-8.md` | Referência gerada pela versão instalada |
| `.env.example`, `.env` | Modelo de ambiente e configuração local |

> **⚠️ Atenção**
>
> Não execute `orm init` novamente para corrigir um detalhe. Ele pode substituir arquivos. Se a pasta já foi inicializada, siga editando os arquivos indicados. Para repetir o tutorial, crie outra pasta vazia. `--yes` não concede autorização para sobrescrever arquivos existentes.

## 5. Configurar TypeScript **depois** da inicialização

**Propósito do passo:** O TypeScript precisa saber onde estão as fontes, como resolver os imports e onde gravar o JavaScript compilado. Fazemos esta configuração depois da inicialização porque a CLI do Prisma pode alterar os arquivos iniciais.

A CLI pode modificar `tsconfig.json` e `package.json`. Por isso, reforce o modo ESM e substitua o `tsconfig.json` agora. Não execute `tsc --init` sobre o arquivo já criado.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm pkg set type=module
```

**Substitua todo o conteúdo de `tsconfig.json`:**

**Arquivo: `tsconfig.json`**

Substitua todo o conteúdo do arquivo existente. Configura a conversão de TypeScript em JavaScript e os caminhos da aplicação. O formato JSON com comentários é aceito pelo TypeScript.

<!-- file: tsconfig.json -->
```jsonc
// Arquivo: tsconfig.json
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

> **💡 Dica**
>
> Imports entre arquivos do projeto terminam em **`.js`**, mesmo dentro de `.ts`. O TypeScript encontra a fonte `.ts` e preserva o caminho correto para o Node em produção. JSON usa `with { type: 'json' }`. `tsx` também aceita esses imports.

## 6. Preparar ambiente e Git

**Propósito do passo:** Vamos separar configurações locais do código que será compartilhado. A conexão e a chave de autenticação ficam em .env; o exemplo sem segredos pode ser compartilhado, e .gitignore indica ao Git o que deve permanecer local.

Gere uma chave local e copie a saída para `JWT_SECRET`:

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Substitua `.env.example` por este modelo, sem credenciais reais:

**Arquivo: `.env.example`**

Substitua todo o conteúdo do arquivo existente. Mostra quais configurações precisam existir. Os valores abaixo são exemplos públicos; a conexão e a chave reais serão preenchidas somente em .env.

<!-- file: .env.example -->
```dotenv
# Arquivo: .env.example
NODE_ENV=development
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
API_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:5432/BANCO?sslmode=require
DIRECT_URL=
JWT_SECRET=SUBSTITUA_POR_UMA_CHAVE_ALEATORIA_DE_PELO_MENOS_32_CARACTERES
```

Edite **`.env`** com a URL real do seu banco de desenvolvimento e a chave gerada. No Neon, obtenha a URL no painel **Connect**. Preserve os parâmetros fornecidos pelo provedor. `DIRECT_URL`, opcional, recebe a conexão sem pool usada pela CLI; `DATABASE_URL` é usada pela aplicação. Se o banco for local, use seus próprios parâmetros de conexão e TLS.

**Arquivo a preencher: `.env`, na raiz da API.** Abra o arquivo criado pela inicialização, cole o modelo de `.env.example` e substitua os valores ilustrativos pela sua conexão e pela chave gerada. Se já havia configurado esses valores, preserve-os. Não cole o modelo público por cima de credenciais válidas sem copiá-las antes.

Se copiar também a linha de identificação do modelo, altere-a para `# Arquivo: .env`. Essa linha é apenas um comentário; os valores das linhas seguintes são as configurações utilizadas.

| Campo | Como preencher e por quê |
|---|---|
| `NODE_ENV` | `development`: informa que estamos trabalhando localmente |
| `PORT` | `3000`: porta em que a API recebe pedidos |
| `API_ORIGIN` | `http://localhost:3000`: endereço da própria API, sem barra final |
| `FRONTEND_ORIGIN` | `http://localhost:5173`: origem permitida para um futuro site que consuma a API; você ainda não precisa criar esse site |
| `DATABASE_URL` | URL completa do banco vazio de desenvolvimento; troque `USUARIO`, `SENHA`, `HOST` e `BANCO` pelos valores reais |
| `DIRECT_URL` | Deixe vazio quando a mesma conexão atende à aplicação e à CLI; preencha apenas se o provedor fornecer uma conexão direta separada para esse mesmo banco |
| `JWT_SECRET` | Cole a chave aleatória gerada acima; não use a frase de exemplo nem uma senha curta |

Para PostgreSQL local sem TLS configurado, a URL costuma ter a forma `postgresql://USUARIO:SENHA@localhost:5432/express_tutorial_dev`, com o usuário e a senha reais. Para o Neon, use a URL copiada do painel, preservando seus parâmetros de TLS. Caracteres especiais na senha precisam estar codificados para uma URL; prefira a URL pronta fornecida pelo provedor.

Linhas iniciadas por `#` são comentários. `.env.example` explica a configuração; `.env` contém os valores realmente usados. O arquivo `src/config/env.ts`, criado abaixo, lê esses valores e interrompe a inicialização se houver erro.

Crie ou complete `.gitignore`:

**Arquivo: `.gitignore`**

Substitua todo o conteúdo do arquivo existente. Lista os arquivos e as pastas que o Git deve ignorar, como segredos, dependências e saídas de compilação.

<!-- file: .gitignore -->
```gitignore
# Arquivo: .gitignore
node_modules/
dist/
coverage/
logs/
cookies.txt
.env
.env.*
!.env.example
```

Guarde no Git o `.env.example` com valores ilustrativos, os contratos gerados e a pasta `migrations/`, criada no próximo capítulo. Nunca preencha o exemplo público com segredos reais.

**Arquivo: `src/config/env.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Lê .env e verifica as configurações antes de iniciar a aplicação. Se um valor obrigatório estiver incorreto, informa o problema logo na inicialização.

<!-- file: src/config/env.ts -->
```typescript
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
```

## 7. Adicionar scripts

**Propósito do passo:** Scripts são atalhos de comandos guardados em package.json. Ao definir os mesmos nomes para todos, os próximos capítulos podem pedir npm run dev ou npm run build sem repetir os comandos completos.

Preserve as dependências e os demais campos de `package.json`. Substitua apenas o objeto `scripts` pelos pares abaixo; o bloco é o **valor desse objeto**, não um `package.json` inteiro.

No editor, procure `"scripts": { ... }`. Selecione somente o objeto que está depois de `"scripts":` e substitua pelo bloco abaixo, incluindo suas chaves. Preserve a vírgula que separa esse campo do seguinte. Não apague `dependencies`, `devDependencies`, `type` ou `private`.

**Arquivo: `package.json` — somente o valor do campo `scripts`.**

Este trecho é JSON: mantenha o caminho de identificação fora do código, pois `package.json` não aceita comentários. Preserve as dependências e os outros campos do arquivo.

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

| Script | O que faz |
|---|---|
| `dev` | Inicia o servidor com `tsx watch`, que reinicia ao salvar alterações |
| `typecheck` | Procura erros de tipos sem gerar JavaScript |
| `build` | Gera o JavaScript em `dist` |
| `start` | Executa o JavaScript já compilado; exige um build anterior |
| `contract:emit` | Gera o JSON e os tipos do contrato Prisma |
| `skills:sync` | Atualiza as instruções auxiliares para agentes de programação |

## 8. Criar a aplicação inicial

**Propósito do passo:** Vamos criar uma resposta simples para confirmar que o servidor recebe pedidos. Separar a aplicação do arquivo que abre a porta permite testar a aplicação depois sem manter um servidor manual em execução.

**Arquivo: `src/app.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Configura o Express e os caminhos pelos quais os pedidos serão atendidos. Este arquivo será atualizado ao conectar novos recursos do guia.

<!-- file: src/app.ts -->
```typescript
// Arquivo: src/app.ts
import express from 'express';

export const app = express();
app.use(express.json({ limit: '16kb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
```

**Arquivo: `src/server.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Inicia a escuta na porta configurada. A aplicação fica em app.ts para que os testes possam importá-la separadamente.

<!-- file: src/server.ts -->
```typescript
// Arquivo: src/server.ts
import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`API disponível em http://localhost:${env.PORT}`);
});
```

Inicie em um terminal e mantenha-o aberto:

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm run dev
```

Em **outro CMD**, na mesma pasta:

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
curl.exe -i http://localhost:3000/health
```

Resultado esperado: HTTP **200** e `{"status":"ok"}`. Se escolheu outra porta, ajuste a URL e `API_ORIGIN` no `.env`. Uma resposta 404 em `/` é normal: não criamos essa rota.

`curl.exe` envia um pedido HTTP pelo terminal. `-i` pede que os cabeçalhos sejam exibidos junto da resposta. A primeira linha, como `HTTP/1.1 200 OK`, informa o status; o JSON abaixo informa o conteúdo devolvido pela API. Não feche o terminal do servidor enquanto envia esse pedido no segundo terminal.

> **📌 Importante**
>
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
