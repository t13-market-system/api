# 09 · Testes automatizados com Vitest e Supertest

[← Anterior](08-documentacao-com-swagger.md) · [Índice](../README.md) · **Etapa 9 de 11** · [Próxima →](10-automacao-e-geracao-de-codigo.md)

## Resultado desta etapa

Testes executáveis para HTTP, validação, autorização, cookies, hashes, erros, Swagger e limites. Um segundo conjunto verifica o fluxo completo em um **banco exclusivo de testes**.

| Conjunto | Banco real? | Comando |
|---|---|---|
| Testes da aplicação com banco substituído | Não | `npm test` |
| Cobertura desses testes | Não | `npm run test:coverage` |
| Integração completa, optativa | Sim, banco separado | `npm run test:integration` |

> [!IMPORTANT]
> Os testes sem banco provam o comportamento dos handlers e serviços com respostas controladas. Eles não comprovam conexão, TLS nem migração no Neon. O teste de integração cobre cadastro, banco, login, autorização, atualização e exclusão usando o cliente real.

## 1. Instalar as ferramentas

```bat
npm install -D --save-exact vitest@4.1.11 @vitest/coverage-v8@4.1.11 supertest@7.3.0 @types/supertest@7.2.1
```

Acrescente estes pares ao objeto `scripts`, preservando os scripts anteriores:

<!-- scripts -->
```json
{
  "typecheck": "tsc --noEmit && tsc --project tsconfig.tests.json",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:integration": "node --env-file=.env.test ./node_modules/vitest/vitest.mjs run --config vitest.integration.config.ts"
}
```

## 2. Configurar testes sem banco

Crie `tsconfig.tests.json` para conferir também os tipos dos testes e das configurações. O script `typecheck` acima passa a verificar tanto a aplicação quanto estes arquivos.

<!-- file: tsconfig.tests.json -->
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "noEmit": true
  },
  "include": ["src/**/*.ts", "src/**/*.json", "tests/**/*.ts", "vitest*.config.ts", "prisma.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

Crie os arquivos completos a seguir. Eles ficam **fora de `src`** e não entram no build da aplicação.

<!-- file: vitest.config.ts -->
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/**/*.integration.test.ts'],
    setupFiles: ['tests/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/prisma/**'],
      reporter: ['text', 'html'],
    },
  },
});
```

<!-- file: tests/setup.ts -->
```typescript
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.API_ORIGIN = 'http://localhost:3000';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
process.env.DATABASE_URL = 'postgresql://unused:unused@localhost:5432/not_used';
process.env.JWT_SECRET = 'chave-exclusiva-de-testes-com-mais-de-32-caracteres';
```

A URL acima é um placeholder: o módulo de banco será substituído no arquivo de testes e nenhuma conexão será aberta. Essas configurações são exclusivas dos testes, não da produção.

## 3. Criar testes de comportamento

<!-- file: tests/api.test.ts -->
```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ipKeyGenerator } from 'express-rate-limit';

const database = vi.hoisted(() => ({
  create: vi.fn(), first: vi.fn(), all: vi.fn(), update: vi.fn(), delete: vi.fn(),
}));
vi.mock('../src/prisma/db.js', () => ({
  db: { orm: { public: { User: {
    create: database.create,
    first: database.first,
    all: database.all,
    where: () => ({ update: database.update, delete: database.delete }),
  } } } },
}));

import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { loginLimiter, limiter } from '../src/middlewares/rateLimit.middleware.js';

const valid = { email: 'pessoa@example.com', name: 'Pessoa Teste', password: 'Teste123!' };
const user = { id: 1, email: valid.email, name: valid.name, password: '', createdAt: new Date('2026-01-01T00:00:00Z') };
const token = (id = 1, expiresIn = 900) => jwt.sign({ id }, env.JWT_SECRET, {
  algorithm: 'HS256', expiresIn, issuer: 'express-tutorial', audience: 'express-api',
});
const bearer = () => `Bearer ${token()}`;

beforeEach(async () => {
  vi.resetAllMocks();
  for (const ip of ['127.0.0.1', '::ffff:127.0.0.1', ipKeyGenerator('::ffff:127.0.0.1')]) {
    limiter.resetKey(ip);
    loginLimiter.resetKey(ip);
  }
  user.password = await bcrypt.hash(valid.password, 4);
  database.create.mockImplementation(async data => ({ ...user, ...data }));
  database.first.mockResolvedValue(user);
  database.all.mockResolvedValue([user]);
  database.update.mockImplementation(async data => ({ ...user, ...data }));
  database.delete.mockResolvedValue(user);
});

describe('API, validação e proteção de contas', () => {
  it('responde health com cabeçalhos do Helmet', async () => {
    const result = await request(app).get('/health');
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ status: 'ok' });
    expect(result.headers['x-content-type-options']).toBe('nosniff');
  });
  it('normaliza e-mail, aplica hash e não devolve password', async () => {
    const result = await request(app).post('/users').send({ ...valid, email: ' PESSOA@EXAMPLE.COM ' });
    expect(result.status).toBe(201);
    expect(result.body.email).toBe(valid.email);
    expect(result.body).not.toHaveProperty('password');
    const stored = database.create.mock.calls[0][0];
    expect(stored.password).not.toBe(valid.password);
    expect(await bcrypt.compare(valid.password, stored.password)).toBe(true);
  });
  it('rejeita e-mail inválido antes de acessar o banco', async () => {
    const result = await request(app).post('/users').send({ ...valid, email: 'invalido' });
    expect(result.status).toBe(400);
    expect(database.create).not.toHaveBeenCalled();
  });
  it('rejeita campo extra e senha acima de 72 bytes', async () => {
    expect((await request(app).post('/users').send({ ...valid, id: 99 })).status).toBe(400);
    expect((await request(app).post('/users').send({ ...valid, password: 'á'.repeat(37) })).status).toBe(400);
    expect(database.create).not.toHaveBeenCalled();
  });
  it('traduz unicidade para 409 em cadastro e atualização', async () => {
    database.create.mockRejectedValue({ sqlState: '23505' });
    expect((await request(app).post('/users').send(valid)).status).toBe(409);
    database.update.mockRejectedValue({ sqlState: '23505' });
    expect((await request(app).put('/users/1').set('Authorization', bearer()).send({ email: 'outro@example.com' })).status).toBe(409);
  });
  it('bloqueia token ausente, inválido e expirado', async () => {
    expect((await request(app).get('/users')).status).toBe(401);
    expect((await request(app).get('/users').set('Authorization', 'Bearer invalido')).status).toBe(401);
    expect((await request(app).get('/users').set('Authorization', `Bearer ${token(1, -1)}`)).status).toBe(401);
    expect(database.first).not.toHaveBeenCalled();
  });
  it('lista somente a própria conta e não expõe hash', async () => {
    const result = await request(app).get('/users').set('Authorization', bearer());
    expect(result.status).toBe(200);
    expect(result.body).toHaveLength(1);
    expect(result.body[0].id).toBe(1);
    expect(result.body[0]).not.toHaveProperty('password');
    expect(database.first).toHaveBeenCalledWith({ id: 1 });
    expect(database.all).not.toHaveBeenCalled();
  });
  it('bloqueia consulta, edição e exclusão de outra conta', async () => {
    expect((await request(app).get('/users/2').set('Authorization', bearer())).status).toBe(403);
    expect((await request(app).put('/users/2').set('Authorization', bearer()).send({ name: 'Outra Pessoa' })).status).toBe(403);
    expect((await request(app).delete('/users/2').set('Authorization', bearer())).status).toBe(403);
    expect(database.first).not.toHaveBeenCalled();
    expect(database.update).not.toHaveBeenCalled();
    expect(database.delete).not.toHaveBeenCalled();
  });
  it('rejeita ID inválido e atualização vazia', async () => {
    expect((await request(app).get('/users/abc').set('Authorization', bearer())).status).toBe(400);
    expect((await request(app).get('/users/2147483648').set('Authorization', bearer())).status).toBe(400);
    expect((await request(app).put('/users/1').set('Authorization', bearer()).send({})).status).toBe(400);
  });
  it('retorna 404 quando o registro não existe', async () => {
    database.first.mockResolvedValue(null);
    expect((await request(app).get('/users/1').set('Authorization', bearer())).status).toBe(404);
  });
  it('atualiza a própria conta e devolve 204 na exclusão', async () => {
    const updated = await request(app).put('/users/1').set('Authorization', bearer()).send({ name: 'Nome Novo' });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Nome Novo');
    expect(updated.body).not.toHaveProperty('password');
    expect((await request(app).delete('/users/1').set('Authorization', bearer())).status).toBe(204);
  });
  it('faz login, envia cookie HttpOnly e autentica por cookie', async () => {
    const client = request.agent(app);
    const login = await client.post('/login').send(validLogin());
    expect(login.status).toBe(200);
    expect(login.body.user).not.toHaveProperty('password');
    expect(login.headers['set-cookie'][0]).toContain('HttpOnly');
    expect((await client.get('/users')).status).toBe(200);
    expect((await client.put('/users/1').send({ name: 'Nome Novo' })).status).toBe(403);
    expect((await client.put('/users/1').set('Origin', env.FRONTEND_ORIGIN).send({ name: 'Nome Novo' })).status).toBe(200);
    expect((await client.post('/logout')).status).toBe(204);
    expect((await client.get('/users')).status).toBe(401);
  });
  it('distingue credenciais inválidas de falha interna', async () => {
    expect((await request(app).post('/login').send({ email: valid.email, password: 'Errada123!' })).status).toBe(401);
    database.first.mockRejectedValue(new Error('Detalhe interno do banco'));
    const result = await request(app).post('/login').send(validLogin());
    expect(result.status).toBe(500);
    expect(JSON.stringify(result.body)).not.toContain('Detalhe interno');
  });
  it('mantém CORS com credenciais e rejeita origem desconhecida', async () => {
    const preflight = await request(app).options('/login').set('Origin', env.FRONTEND_ORIGIN).set('Access-Control-Request-Method', 'POST');
    expect(preflight.status).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe(env.FRONTEND_ORIGIN);
    expect(preflight.headers['access-control-allow-credentials']).toBe('true');
    expect((await request(app).post('/login').set('Origin', 'https://desconhecido.example').send(validLogin())).status).toBe(403);
  });
  it('documenta rotas públicas e privadas no OpenAPI', async () => {
    const result = await request(app).get('/api-docs.json');
    expect(result.status).toBe(200);
    expect(result.body.paths['/login'].post.security).toEqual([]);
    expect(result.body.paths['/users'].post.security).toEqual([]);
    expect(result.body.paths['/users/{id}'].delete).toBeDefined();
    expect(result.body.components.schemas.PublicUser.properties).not.toHaveProperty('password');
  });
  it('rejeita JSON malformado e rotas desconhecidas', async () => {
    expect((await request(app).post('/users').set('Content-Type', 'application/json').send('{')).status).toBe(400);
    expect((await request(app).get('/inexistente')).status).toBe(404);
  });
  it('limita tentativas de login sem sucesso', async () => {
    database.first.mockResolvedValue(null);
    for (let i = 0; i < 5; i++) {
      expect((await request(app).post('/login').send(validLogin())).status).toBe(401);
    }
    expect((await request(app).post('/login').send(validLogin())).status).toBe(429);
  });
});

function validLogin() {
  return { email: valid.email, password: valid.password };
}
```

## 4. Executar os testes

```bat
npm test
npm run test:coverage
npm run typecheck
npm run build
```

Espere **17 testes aprovados**. `coverage/index.html` permite explorar a cobertura. Não há limite percentual artificial: o relatório mostra o que ainda precisa de cenários, sem sugerir que cobertura total garante ausência de bugs. O Swagger exposto na aplicação recebe requisições pelo Supertest, não depende de um servidor já aberto na porta 3000.

## 5. Preparar um banco separado de integração

Crie um banco PostgreSQL vazio ou uma branch Neon exclusiva de testes. Não use a URL do desenvolvimento nem da produção. Crie `.env.test` local, que já é ignorado pelo `.gitignore`:

```dotenv
NODE_ENV=test
PORT=3000
API_ORIGIN=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=COLE_A_URL_DO_BANCO_EXCLUSIVO_DE_TESTES
DIRECT_URL=
JWT_SECRET=GERE_OUTRA_CHAVE_ALEATORIA_COM_PELO_MENOS_32_CARACTERES
```

Use a chave gerada pelo comando do capítulo 1. `DIRECT_URL`, se necessário, também precisa apontar para **esse mesmo banco de testes**. Não copie uma conexão direta de produção.

A aplicação precisa do contrato do capítulo 2 e das migrações versionadas. Aplique-as ao banco de testes explicitamente:

```bat
node --env-file=.env.test ./node_modules/prisma/dist/prisma.js db migrate
node --env-file=.env.test ./node_modules/prisma/dist/prisma.js db verify
```

Não use `--advance-ref db` aqui: a referência de desenvolvimento não deve avançar por causa de um banco de testes.

## 6. Criar configuração e teste de integração

<!-- file: vitest.integration.config.ts -->
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.integration.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
```

Este conjunto não carrega `tests/setup.ts` e não substitui o banco. A URL vem de `.env.test` carregado pelo script.

<!-- file: tests/api.integration.test.ts -->
```typescript
import { afterAll, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { app } from '../src/app.js';
import { db } from '../src/prisma/db.js';

const emails: string[] = [];
afterAll(async () => {
  try {
    for (const email of emails) {
      const user = await db.orm.public.User.first({ email });
      if (user) await db.orm.public.User.where({ id: user.id }).delete();
    }
  } finally {
    await db.close();
  }
});

it('cadastro → banco → login → autorização → atualização → exclusão', async () => {
  const email = `integracao-${randomUUID()}@example.com`;
  const otherEmail = `integracao-${randomUUID()}@example.com`;
  emails.push(email, otherEmail);
  const data = { email, password: 'Integracao123!', name: 'Pessoa Integração' };
  const created = await request(app).post('/users').send(data);
  expect(created.status).toBe(201);
  expect(created.body).not.toHaveProperty('password');
  const id = created.body.id;
  const stored = await db.orm.public.User.first({ id });
  expect(stored).not.toBeNull();
  expect(stored!.password).not.toBe(data.password);
  expect(await bcrypt.compare(data.password, stored!.password)).toBe(true);
  expect((await request(app).post('/users').send(data)).status).toBe(409);
  const other = await request(app).post('/users').send({ ...data, email: otherEmail });
  expect(other.status).toBe(201);
  const login = await request(app).post('/login').send({ email, password: data.password });
  expect(login.status).toBe(200);
  const auth = `Bearer ${login.body.token}`;
  const list = await request(app).get('/users').set('Authorization', auth);
  expect(list.status).toBe(200);
  expect(list.body.map((u: { id: number }) => u.id)).toEqual([id]);
  expect((await request(app).get(`/users/${other.body.id}`).set('Authorization', auth)).status).toBe(403);
  expect((await request(app).put(`/users/${id}`).set('Authorization', auth).send({ email: otherEmail })).status).toBe(409);
  const updated = await request(app).put(`/users/${id}`).set('Authorization', auth).send({ name: 'Nome Atualizado' });
  expect(updated.status).toBe(200);
  expect(updated.body.name).toBe('Nome Atualizado');
  expect(updated.body).not.toHaveProperty('password');
  expect((await request(app).delete(`/users/${id}`).set('Authorization', auth)).status).toBe(204);
  expect(await db.orm.public.User.first({ id })).toBeNull();
});
```

Execute:

```bat
npm run test:integration
```

Espere um teste aprovado. Ele cria dados com e-mails únicos e remove os registros criados, inclusive na limpeza após falhas. Uma interrupção abrupta pode deixar registros; nesse caso, limpe apenas os dados da execução no banco de testes.

> [!WARNING]
> O teste de integração altera o banco informado em `.env.test`. Confira as duas URLs antes de executá-lo. Ter `NODE_ENV=test` não transforma um banco de produção em banco de testes.

## Conferência antes de avançar

- [ ] Os 17 testes sem banco foram aprovados.
- [ ] Relatório de cobertura gerado.
- [ ] `typecheck` e `build` continuam funcionando.
- [ ] Banco de testes separado, migrações aplicadas e estrutura verificada.
- [ ] Teste de integração aprovado ou registrado como pendente com motivo.

Referências: [Vitest](https://vitest.dev/guide/) · [mocks de módulos](https://vitest.dev/guide/mocking/modules) · [Supertest](https://github.com/forwardemail/supertest).

[← Anterior](08-documentacao-com-swagger.md) · [10 · Gerador de recursos →](10-automacao-e-geracao-de-codigo.md)
