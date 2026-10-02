<!-- Documento: docs/03-criando-rotas-serv-contro.md -->

# 03 · Rotas, controladores e serviços

[← Anterior](02-modelagem-e-sincronizacao-com-prisma.md) · [Índice](../README.md) · **Etapa 3 de 11** · [Próxima →](04-validacao-de-dados-com-zod.md)

**Ponto de partida:** conclua o capítulo anterior antes de continuar. Todos os caminhos abaixo partem da raiz da sua API, a pasta que contém `package.json`. Crie as subpastas indicadas no editor quando ainda não existirem.

## Resultado desta etapa

CRUD de usuários, respostas sem hash de senha e tratamento central de erros. Todos os arquivos abaixo são completos: crie as pastas e substitua o arquivo quando ele já existir.

**CRUD** reúne quatro ações: criar, ler, atualizar e excluir. Vamos dividir o código em três partes para cada uma: a **rota** identifica o pedido, o **controlador** recebe e responde por HTTP, e o **serviço** executa a regra e consulta o banco. O diagrama abaixo mostra esse caminho; não é um arquivo para criar.

> **⚠️ Atenção**
>
> Até o capítulo 5, as rotas de usuários estão sem autenticação. Execute apenas localmente com dados de teste. O capítulo 5 restringe consultas, atualização e exclusão à própria conta.

```mermaid
sequenceDiagram
    participant C as Cliente HTTP
    participant R as Rota
    participant T as Controlador
    participant S as Serviço
    participant D as PostgreSQL
    C->>R: Requisição JSON
    R->>T: Dados recebidos
    T->>S: Operação tipada
    S->>D: Consulta Prisma
    D-->>S: Registro
    S-->>T: Resultado
    T-->>C: JSON sem password
```

## 1. Definir erros da aplicação

**Propósito do passo:** Vamos padronizar como a API informa problemas. O controlador pode indicar um erro esperado, como usuário ausente, e o tratamento central escolhe a resposta sem revelar detalhes internos do banco.

**Arquivo: `src/lib/http-error.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Representa um erro esperado com mensagem e status HTTP, como 404 para um registro ausente.

<!-- file: src/lib/http-error.ts -->
```typescript
// Arquivo: src/lib/http-error.ts
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}
```

**Arquivo: `src/middlewares/error.middleware.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Converte erros em respostas HTTP e evita devolver detalhes internos ao cliente. Deve ser registrado depois das rotas.

<!-- file: src/middlewares/error.middleware.ts -->
```typescript
// Arquivo: src/middlewares/error.middleware.ts
import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../lib/http-error.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (typeof error === 'object' && error !== null && 'sqlState' in error && error.sqlState === '23505') {
    res.status(409).json({ error: 'Este e-mail já está em uso.' });
    return;
  }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    if (error.status === 400) {
      res.status(400).json({ error: 'JSON inválido.' });
      return;
    }
    if (error.status === 413) {
      res.status(413).json({ error: 'Corpo da requisição muito grande.' });
      return;
    }
  }
  console.error('Erro interno na API:', error);
  res.status(500).json({ error: 'Erro interno do servidor.' });
};
```

Express 5 encaminha rejeições de controladores `async` ao middleware de erros. Falhas de banco não devem ser expostas no JSON da resposta. A violação de unicidade do PostgreSQL usa `sqlState: '23505'` tanto no cadastro quanto na atualização.

## 2. Criar o serviço

**Propósito do passo:** O serviço reúne as operações de banco e as regras sobre os dados. Assim, os controladores não precisam repetir consultas nem o processamento das senhas.

**Arquivo: `src/services/user.service.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Executa as consultas de usuários e transforma a senha em hash antes de armazená-la. A função toPublicUser escolhe os campos que podem sair na resposta.

<!-- file: src/services/user.service.ts -->
```typescript
// Arquivo: src/services/user.service.ts
import bcrypt from 'bcrypt';
import { db } from '../prisma/db.js';
import { HttpError } from '../lib/http-error.js';

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
}
export type UpdateUserInput = Partial<CreateUserInput>;
type UserRow = Awaited<ReturnType<typeof db.orm.public.User.create>>;

export const toPublicUser = (user: UserRow) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt,
});

export class UserService {
  static async createUser(data: CreateUserInput) {
    return db.orm.public.User.create({
      email: data.email,
      name: data.name ?? null,
      password: await bcrypt.hash(data.password, 12),
    });
  }

  static async getAllUsers() {
    return db.orm.public.User.all();
  }

  static async getUserById(id: number) {
    const user = await db.orm.public.User.first({ id });
    if (!user) throw new HttpError(404, 'Usuário não encontrado.');
    return user;
  }

  static async updateUser(id: number, data: UpdateUserInput) {
    const changes: UpdateUserInput = {};
    if (data.name !== undefined) changes.name = data.name;
    if (data.email !== undefined) changes.email = data.email;
    if (data.password !== undefined) changes.password = await bcrypt.hash(data.password, 12);
    if (Object.keys(changes).length === 0) throw new HttpError(400, 'Informe pelo menos um campo.');
    const user = await db.orm.public.User.where({ id }).update(changes);
    if (!user) throw new HttpError(404, 'Usuário não encontrado.');
    return user;
  }

  static async deleteUser(id: number) {
    const user = await db.orm.public.User.where({ id }).delete();
    if (!user) throw new HttpError(404, 'Usuário não encontrado.');
  }
}
```

A atualização envia apenas `name`, `email` e `password`, e não todo o corpo recebido. `id` e `createdAt` não são editáveis. A operação retorna o registro atualizado ou `null`, dispensando uma consulta prévia sujeita a corrida.

## 3. Criar o controlador

**Propósito do passo:** O controlador recebe o pedido HTTP, chama o serviço e escolhe o status e o conteúdo da resposta. Ele devolve somente os campos públicos do usuário.

O Express fornece `req`, com dados do pedido, e `res`, usado para enviar a resposta. O corpo JSON fica em `req.body`; um ID enviado no caminho fica em `req.params`. Por exemplo, em `/users/7`, o parâmetro `id` vale a string `"7"`; o controlador confere e converte esse valor antes de consultar o banco.

**Arquivo: `src/controllers/user.controller.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Recebe dados do pedido, chama o serviço e envia a resposta HTTP com o status adequado.

<!-- file: src/controllers/user.controller.ts -->
```typescript
// Arquivo: src/controllers/user.controller.ts
import type { Request, Response } from 'express';
import { UserService, toPublicUser } from '../services/user.service.js';
import { HttpError } from '../lib/http-error.js';

const readId = (req: Request) => {
  const value = String(req.params.id);
  const id = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    throw new HttpError(400, 'ID deve ser um inteiro positivo válido.');
  }
  return id;
};

export class UserController {
  static async createUser(req: Request, res: Response) {
    const { email, password, name } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      throw new HttpError(400, 'E-mail e senha obrigatórios.');
    }
    const user = await UserService.createUser({ email, password, name });
    res.status(201).json(toPublicUser(user));
  }
  static async getAllUsers(_req: Request, res: Response) {
    res.json((await UserService.getAllUsers()).map(toPublicUser));
  }
  static async getUserById(req: Request, res: Response) {
    res.json(toPublicUser(await UserService.getUserById(readId(req))));
  }
  static async updateUser(req: Request, res: Response) {
    res.json(toPublicUser(await UserService.updateUser(readId(req), req.body ?? {})));
  }
  static async deleteUser(req: Request, res: Response) {
    await UserService.deleteUser(readId(req));
    res.status(204).send();
  }
}
```

## 4. Criar e conectar somente as rotas existentes

**Propósito do passo:** Uma rota liga um método e um endereço HTTP ao controlador correspondente. Depois de criar essa ligação, precisamos registrá-la na aplicação; um arquivo de rota sozinho não recebe pedidos.

**Arquivo: `src/routes/user.route.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Relaciona os endereços de usuários aos controladores. Ao longo do guia também recebe validação, autenticação e comentários para o Swagger.

<!-- file: src/routes/user.route.ts -->
```typescript
// Arquivo: src/routes/user.route.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';

const router = Router();
router.post('/users', UserController.createUser);
router.get('/users', UserController.getAllUsers);
router.get('/users/:id', UserController.getUserById);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);
export default router;
```

**Arquivo: `src/routes/index.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Reúne as rotas já criadas e as disponibiliza para app.ts. Só importe aqui um arquivo que já exista.

<!-- file: src/routes/index.ts -->
```typescript
// Arquivo: src/routes/index.ts
import { Router } from 'express';
import userRoutes from './user.route.js';

const routes = Router();
routes.use(userRoutes);
export default routes;
```

Não há import de `cliente.route.ts`: esse recurso só será criado no capítulo 10.

**Arquivo: `src/app.ts`**

Substitua todo o conteúdo do arquivo existente. Configura o Express e os caminhos pelos quais os pedidos serão atendidos. Este arquivo será atualizado ao conectar novos recursos do guia.

<!-- file: src/app.ts -->
```typescript
// Arquivo: src/app.ts
import express from 'express';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const app = express();
app.use(express.json({ limit: '16kb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(routes);
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(errorHandler);
```

Substitua `src/server.ts`. O servidor escuta HTTP; `app.ts` pode ser importado pelos testes sem abrir uma porta fixa.

**Arquivo: `src/server.ts`**

Substitua todo o conteúdo do arquivo existente. Inicia a escuta na porta configurada. A aplicação fica em app.ts para que os testes possam importá-la separadamente.

<!-- file: src/server.ts -->
```typescript
// Arquivo: src/server.ts
import { app } from './app.js';
import { env } from './config/env.js';
import { db } from './prisma/db.js';

const server = app.listen(env.PORT, () => {
  console.log(`API disponível em http://localhost:${env.PORT}`);
});
const shutdown = () => {
  server.close(() => {
    void db.close().then(() => process.exit(0)).catch(() => process.exit(1));
  });
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
```

## 5. Testar o CRUD local

**Propósito do passo:** Vamos testar criar, consultar, atualizar e excluir um registro. Essa sequência é chamada CRUD e confirma que a requisição percorre rota, controlador, serviço e banco.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm run typecheck
npm run dev
```

Em outro CMD, cadastre um usuário:

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
curl.exe -i -H "Content-Type: application/json" -d "{\"email\":\"teste@example.com\",\"password\":\"Teste123!\",\"name\":\"Pessoa Teste\"}" http://localhost:3000/users
curl.exe -i http://localhost:3000/users
```

Anote o `id` devolvido. Os exemplos seguintes usam `1`; substitua pelo ID real.

Nos comandos, `-H` define um cabeçalho e `-d` envia o corpo JSON, fazendo um pedido `POST` neste caso. `Content-Type: application/json` informa à API o formato do corpo. `-X PUT` e `-X DELETE` escolhem os métodos de atualização e exclusão. Os caracteres `\"` dentro do JSON são necessários para representar aspas nos comandos do CMD; copie-os como aparecem.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
curl.exe -i http://localhost:3000/users/1
curl.exe -i -X PUT -H "Content-Type: application/json" -d "{\"name\":\"Nome Alterado\"}" http://localhost:3000/users/1
curl.exe -i -X DELETE http://localhost:3000/users/1
curl.exe -i http://localhost:3000/users/1
```

| Operação | Resultado esperado |
|---|---|
| Cadastro | 201, sem `password` |
| E-mail repetido antes da exclusão | 409 |
| Listagem/consulta/edição | 200, sem `password` |
| ID textual, negativo, zero ou fora de `Int` | 400 |
| Exclusão | 204, sem corpo |
| Consulta após exclusão | 404 |

Os números são **status HTTP**: 200 indica sucesso, 201 indica criação, 204 indica sucesso sem conteúdo, 400 indica entrada inválida, 404 indica ausência e 409 indica conflito, como um e-mail repetido. Se repetir o cadastro antes de excluir o usuário, use o mesmo e-mail para conferir o 409; para um novo cadastro válido, use outro e-mail.

## Conferência antes de avançar

- [ ] Projeto compila; nenhuma rota inexistente foi importada.
- [ ] CRUD testado com um usuário descartável.
- [ ] Hash de senha ausente em todas as respostas.
- [ ] Erros públicos não revelam SQL, credenciais ou o rastro interno do erro.

Referência: [erros no Express](https://expressjs.com/en/guide/error-handling.html).

[← Anterior](02-modelagem-e-sincronizacao-com-prisma.md) · [04 · Validação →](04-validacao-de-dados-com-zod.md)
