<!-- Documento: docs/08-documentacao-com-swagger.md -->

# 08 · Documentação interativa com Swagger

[← Anterior](07-seguranca-e-rate-limit.md) · [Índice](../README.md) · **Etapa 8 de 11** · [Próxima →](09-testes-automatizados-vitest.md)

**Ponto de partida:** conclua o capítulo anterior antes de continuar. Todos os caminhos abaixo partem da raiz da sua API, a pasta que contém `package.json`. Crie as subpastas indicadas no editor quando ainda não existirem.

## Resultado desta etapa

OpenAPI com cadastro, login, logout e todas as operações de usuários; Swagger disponível no código TypeScript e no JavaScript compilado.

**OpenAPI** é o formato que descreve os endereços, campos e respostas da API. **Swagger UI** é a página que mostra essa descrição e permite testar os pedidos. Primeiro vamos produzir a descrição; depois vamos disponibilizar a página em `/api-docs`.

## 1. Instalar pacotes fixados

**Propósito do passo:** Swagger oferece uma página para ler as operações e enviar pedidos. Instalamos a ferramenta que lê os comentários das rotas e a que exibe essa página.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm install --save-exact swagger-jsdoc@6.3.0 swagger-ui-express@5.0.1
npm install -D --save-exact @types/swagger-jsdoc@6.0.4 @types/swagger-ui-express@4.1.8
```

## 2. Criar a configuração

**Propósito do passo:** A configuração define o título, o endereço da API e a forma de autenticar. Ela também indica onde procurar os comentários que descrevem cada rota.

**Arquivo: `src/config/swagger.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Lê os comentários das rotas e monta o documento OpenAPI e a página Swagger.

<!-- file: src/config/swagger.ts -->
```typescript
// Arquivo: src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const extension = import.meta.url.endsWith('.ts') ? '.ts' : '.js';
const routeGlob = fileURLToPath(new URL(`../routes/*${extension}`, import.meta.url)).replace(/\\/g, '/');

export const swaggerSpec = swaggerJsdoc({
  failOnErrors: true,
  definition: {
    openapi: '3.0.3',
    info: { title: 'API Express e Prisma 8', version: '1.0.0' },
    servers: [{ url: env.API_ORIGIN }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [routeGlob],
});

export const setupSwagger = (app: Express) => {
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
```

A busca usa o diretório do módulo, não o diretório de trabalho do terminal. Ao compilar, busca `.js` em `dist/routes`; em desenvolvimento, busca `.ts` em `src/routes`. Mantenha os comentários no build; não configure `removeComments: true`.

## 3. Substituir o arquivo de rotas de usuários com a documentação

**Propósito do passo:** Vamos descrever os campos e as respostas das operações de usuários. Esses comentários são lidos pela ferramenta de documentação, sem substituir o código que atende os pedidos.

O código das funções que atendem as rotas é preservado. O comentário `@openapi` descreve todas as operações e suas regras. Copie também esse comentário: a página Swagger precisa dele para mostrar campos e respostas.

**Arquivo: `src/routes/user.route.ts`**

Substitua todo o conteúdo do arquivo existente. Relaciona os endereços de usuários aos controladores. Ao longo do guia também recebe validação, autenticação e comentários para o Swagger.

<!-- file: src/routes/user.route.ts -->
```typescript
// Arquivo: src/routes/user.route.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema, userIdSchema } from '../schemas/user.schema.js';
import { authMiddleware, requireSelf } from '../middlewares/auth.middleware.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicUser:
 *       type: object
 *       properties:
 *         id: { type: integer, minimum: 1 }
 *         email: { type: string, format: email }
 *         name: { type: string, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *     CreateUser:
 *       type: object
 *       additionalProperties: false
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email, maxLength: 254 }
 *         name: { type: string, minLength: 2, maxLength: 100 }
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: Máximo de 72 bytes em UTF-8.
 *     UpdateUser:
 *       type: object
 *       additionalProperties: false
 *       minProperties: 1
 *       properties:
 *         email: { type: string, format: email, maxLength: 254 }
 *         name: { type: string, minLength: 2, maxLength: 100 }
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: Máximo de 72 bytes em UTF-8.
 * /users:
 *   post:
 *     summary: Cadastrar uma conta
 *     tags: [Usuários]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateUser' }
 *     responses:
 *       '201':
 *         description: Conta criada sem hash de senha na resposta.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PublicUser' }
 *       '400': { description: Dados inválidos. }
 *       '409': { description: E-mail já utilizado. }
 *       '429': { description: Limite de requisições. }
 *   get:
 *     summary: Listar somente a própria conta
 *     tags: [Usuários]
 *     responses:
 *       '200':
 *         description: Lista com a própria conta.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/PublicUser' }
 *       '401': { description: Token ausente ou inválido. }
 * /users/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: integer, minimum: 1, maximum: 2147483647 }
 *       description: ID da própria conta.
 *   get:
 *     summary: Consultar a própria conta
 *     tags: [Usuários]
 *     responses:
 *       '200':
 *         description: Conta encontrada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PublicUser' }
 *       '400': { description: ID inválido. }
 *       '401': { description: Token ausente ou inválido. }
 *       '403': { description: Conta de outro usuário. }
 *       '404': { description: Conta inexistente. }
 *   put:
 *     summary: Atualizar campos da própria conta
 *     tags: [Usuários]
 *     description: Somente os campos enviados são alterados; corpo vazio é rejeitado.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateUser' }
 *     responses:
 *       '200':
 *         description: Conta atualizada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PublicUser' }
 *       '400': { description: Dados inválidos. }
 *       '401': { description: Token ausente ou inválido. }
 *       '403': { description: Conta alheia ou origem de cookie não permitida. }
 *       '404': { description: Conta inexistente. }
 *       '409': { description: E-mail já utilizado. }
 *   delete:
 *     summary: Excluir a própria conta
 *     tags: [Usuários]
 *     responses:
 *       '204': { description: Conta excluída, sem corpo. }
 *       '400': { description: ID inválido. }
 *       '401': { description: Token ausente ou inválido. }
 *       '403': { description: Conta alheia ou origem de cookie não permitida. }
 *       '404': { description: Conta inexistente. }
 */
const router = Router();
router.post('/users', validate(createUserSchema), UserController.createUser);
router.get('/users', authMiddleware, UserController.getAllUsers);
router.get('/users/:id', authMiddleware, validate(userIdSchema), requireSelf, UserController.getUserById);
router.put('/users/:id', authMiddleware, validate(updateUserSchema), requireSelf, UserController.updateUser);
router.delete('/users/:id', authMiddleware, validate(userIdSchema), requireSelf, UserController.deleteUser);
export default router;
```

## 4. Substituir as rotas de autenticação com a documentação

**Propósito do passo:** Cadastro e login não devem exigir um token anterior. Vamos documentar corretamente essas exceções para que uma pessoa consiga começar a usar a API pela página Swagger.

**Arquivo: `src/routes/auth.route.ts`**

Substitua todo o conteúdo do arquivo existente. Disponibiliza os endereços de login e logout e conecta a validação de entrada ao controlador.

<!-- file: src/routes/auth.route.ts -->
```typescript
// Arquivo: src/routes/auth.route.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginSchema } from '../schemas/auth.schema.js';

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Autenticar e receber token e cookie HttpOnly
 *     tags: [Autenticação]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       '200':
 *         description: Token válido por 15 minutos; cookie HttpOnly enviado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/PublicUser' }
 *       '400': { description: Dados inválidos. }
 *       '401': { description: Credenciais inválidas. }
 *       '429': { description: Excesso de tentativas. }
 * /logout:
 *   post:
 *     summary: Limpar o cookie de autenticação
 *     tags: [Autenticação]
 *     security: []
 *     description: Tokens Bearer já emitidos continuam válidos até expirar.
 *     responses:
 *       '204': { description: Cookie removido, sem corpo. }
 */
const router = Router();
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
export default router;
```

## 5. Substituir `src/app.ts` completo

**Propósito do passo:** Precisamos registrar a página e o documento JSON na aplicação antes da resposta de rota ausente. Isso torna a documentação acessível pelo navegador.

Swagger é registrado antes da função que responde 404 e do tratamento de erros. Assim, a aplicação encontra as rotas de documentação antes de concluir que o endereço não existe. Todas as validações e proteções anteriores continuam presentes.

**Arquivo: `src/app.ts`**

Substitua todo o conteúdo do arquivo existente. Configura o Express e os caminhos pelos quais os pedidos serão atendidos. Este arquivo será atualizado ao conectar novos recursos do guia.

<!-- file: src/app.ts -->
```typescript
// Arquivo: src/app.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import routes from './routes/index.js';
import { env } from './config/env.js';
import { setupSwagger } from './config/swagger.js';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { morganMiddleware } from './middlewares/morgan.middleware.js';
import { originGuard } from './middlewares/origin.middleware.js';
import { limiter, loginLimiter } from './middlewares/rateLimit.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const app = express();
app.use(morganMiddleware);
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : {
    directives: { 'upgrade-insecure-requests': null },
  },
}));
app.use(corsMiddleware);
app.use(originGuard);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(limiter);
app.use('/login', loginLimiter);
app.use(cookieParser());
app.use(express.json({ limit: '16kb' }));
app.use(routes);
setupSwagger(app);
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(errorHandler);
```

## 6. Testar em desenvolvimento e após o build

**Propósito do passo:** Vamos testar a documentação no modo de desenvolvimento e na versão compilada. Também vamos enviar um pedido pela interface, para verificar que ela aponta para a API correta.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm run typecheck
npm run dev
```

Abra [http://localhost:3000/api-docs](http://localhost:3000/api-docs). Em outro CMD:

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
curl.exe -i http://localhost:3000/api-docs.json
```

Confira os quatro caminhos `/users`, `/users/{id}`, `/login` e `/logout`. Para usar a interface:

1. Clique na linha verde **POST /users** para abrir o cadastro. Clique em **Try it out** (testar), preencha o corpo JSON com um e-mail ainda não usado, uma senha como `Teste123!` e, opcionalmente, um nome. Clique em **Execute** (executar).
2. Confira a seção **Server response** (resposta do servidor): espere **201**. Anote o `id` retornado; ele identifica essa conta nas consultas e alterações seguintes.
3. Abra **POST /login**, clique em **Try it out**, informe o mesmo e-mail e senha e clique em **Execute**. Login não exige token prévio. Espere **200** e copie somente o valor de `token`, sem as aspas.
4. No botão **Authorize** (autorizar), cole somente esse token no campo de Bearer, sem escrever `Bearer`. Clique em **Authorize** dentro da janela e depois em **Close** (fechar). A ferramenta passa a acrescentar o cabeçalho de autenticação.
5. Abra **GET /users**, clique em **Try it out** e em **Execute**. Espere 200 e uma lista com apenas a própria conta.
6. Em **GET /users/{id}**, clique em **Try it out**, preencha o campo `id` com o número anotado e execute. Ao usar um ID diferente do da sua conta, espere 403. Use o ID correto nas operações de atualização e exclusão.

Os nomes dos botões acima são os exibidos pela ferramenta instalada; a tradução entre parênteses explica sua função. Se o token expirar, faça login novamente e repita a autorização. Se um campo ainda estiver preenchido com valores de exemplo, substitua-os pelos valores da sua conta antes de executar.

Pare o servidor de desenvolvimento com Ctrl+C:

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm run build
npm start
```

Confira novamente `/api-docs` e `/api-docs.json`; a documentação deve continuar presente no JavaScript compilado.

> **ℹ️ Observação**
>
> Este exercício expõe Swagger localmente. Antes de publicar uma API, decida se a interface e o documento OpenAPI serão públicos ou exigirão acesso. Configure `API_ORIGIN` para a URL externa real. HTTPS em produção também é necessário para os cookies `Secure`.

## Conferência antes de avançar

- [ ] Login e cadastro documentados sem exigir token.
- [ ] Todas as operações de usuários aparecem, com permissão sobre a própria conta.
- [ ] JWT funciona pelo botão Authorize.
- [ ] OpenAPI e interface disponíveis após `build` e `start`.
- [ ] Cookies, CORS, limites e logs preservados.

Referências: [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) · [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express).

[← Anterior](07-seguranca-e-rate-limit.md) · [09 · Testes automatizados →](09-testes-automatizados-vitest.md)
