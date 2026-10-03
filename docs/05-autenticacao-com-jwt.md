<!-- Documento: docs/05-autenticacao-com-jwt.md -->

# 05 · Autenticação, autorização e cookies

[← Anterior](04-validacao-de-dados-com-zod.md) · [Índice](../README.md) · **Etapa 5 de 11** · [Próxima →](06-monitorizacao-e-logs-com-winston.md)

**Ponto de partida:** conclua o capítulo anterior antes de continuar. Todos os caminhos abaixo partem da raiz da sua API, a pasta que contém `package.json`. Crie as subpastas indicadas no editor quando ainda não existirem.

## Resultado desta etapa

Login com JWT de 15 minutos; acesso por Bearer ou cookie HttpOnly; cada usuário consulta, altera e exclui apenas a própria conta.

| Rota | Acesso após este capítulo |
|---|---|
| `POST /users` | Público, com validação |
| `POST /login` | Público, com validação |
| `POST /logout` | Limpa o cookie; não revoga tokens Bearer já emitidos |
| `GET /users` | Autenticado; devolve uma lista com **a própria conta**, não todas as contas |
| `GET`, `PUT`, `DELETE /users/:id` | Autenticado; `id` deve ser o do token |

Não há papel de administrador neste tutorial. Autenticar alguém não concede permissão para alterar contas alheias.

| Termo | Para que serve |
|---|---|
| Autenticação / login | Confirma que a senha corresponde à conta informada |
| Autorização | Confere se a conta identificada pode fazer a operação solicitada |
| JWT / token | Texto assinado pela API que comprova o login durante 15 minutos; não é uma senha nem contém a senha |
| `JWT_SECRET` | Chave privada da aplicação usada para assinar e conferir o token |
| Bearer | Forma de enviar o token no cabeçalho `Authorization` do pedido |
| Cookie HttpOnly | Cookie enviado pelo navegador, mas indisponível para leitura pelo JavaScript da página |
| Origem / `Origin` | Combinação de protocolo, host e porta do site que fez o pedido, como `http://localhost:5173` |
| CORS | Regras que informam ao navegador quais origens podem ler as respostas da API |

Você não precisa criar um frontend neste capítulo. Primeiro vamos conferir a autenticação pelo CMD; ao final há um exemplo opcional de uso no navegador.

## 1. Criar o schema de login

**Propósito do passo:** O login recebe apenas e-mail e senha. Conferir esse formato antes da consulta evita que entradas incompletas cheguem ao serviço de autenticação.

**Arquivo: `src/schemas/auth.schema.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Define o formato de e-mail e senha aceito no login.

<!-- file: src/schemas/auth.schema.ts -->
```typescript
// Arquivo: src/schemas/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
    password: z.string().min(1).refine(value => Buffer.byteLength(value, 'utf8') <= 72),
  }).strict(),
});
```

## 2. Criar o serviço de autenticação

**Propósito do passo:** O serviço procura a conta, compara a senha com o hash armazenado e emite um token com prazo de validade. O token permitirá comprovar o login nos pedidos seguintes.

**Arquivo: `src/services/auth.service.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Confere as credenciais e assina um JWT válido por 15 minutos com a chave configurada no ambiente.

<!-- file: src/services/auth.service.ts -->
```typescript
// Arquivo: src/services/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../prisma/db.js';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';
import { toPublicUser } from './user.service.js';

export class AuthService {
  static async login(data: { email: string; password: string }) {
    const user = await db.orm.public.User.first({ email: data.email });
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new HttpError(401, 'Credenciais inválidas.');
    }
    const token = jwt.sign({ id: user.id }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: 'express-tutorial',
      audience: 'express-api',
    });
    return { token, user: toPublicUser(user) };
  }
}
```

Não existe uma chave secreta substituta definida no código. A aplicação falha ao iniciar se `JWT_SECRET` estiver ausente ou curta. O cliente recebe o mesmo erro de credenciais para usuário inexistente ou senha incorreta; falhas internas são tratadas como 500 pelo middleware central.

## 3. Criar controlador e rotas de autenticação

**Propósito do passo:** Vamos disponibilizar login e logout por HTTP. O controlador também grava o token em um cookie que o navegador pode enviar automaticamente.

**Arquivo: `src/controllers/auth.controller.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Responde ao login, grava o cookie de autenticação e remove esse cookie no logout.

<!-- file: src/controllers/auth.controller.ts -->
```typescript
// Arquivo: src/controllers/auth.controller.ts
import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { env } from '../config/env.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export class AuthController {
  static async login(req: Request, res: Response) {
    const result = await AuthService.login(req.body);
    res.cookie('token', result.token, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.json(result);
  }
  static logout(_req: Request, res: Response) {
    res.clearCookie('token', cookieOptions);
    res.status(204).send();
  }
}
```

**Arquivo: `src/routes/auth.route.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Disponibiliza os endereços de login e logout e conecta a validação de entrada ao controlador.

<!-- file: src/routes/auth.route.ts -->
```typescript
// Arquivo: src/routes/auth.route.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginSchema } from '../schemas/auth.schema.js';

const router = Router();
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
export default router;
```

## 4. Validar o token e a permissão sobre a conta

**Propósito do passo:** Autenticar confirma quem fez o pedido; autorizar decide o que essa pessoa pode acessar. Vamos verificar o token e impedir que uma conta consulte ou altere outra.

**Arquivo: `src/middlewares/auth.middleware.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Verifica o token e a permissão de acesso à própria conta. Em escritas autenticadas por cookie, também confere a origem.

<!-- file: src/middlewares/auth.middleware.ts -->
```typescript
// Arquivo: src/middlewares/auth.middleware.ts
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const authMiddleware: RequestHandler = (req, res, next) => {
  const authorization = req.get('authorization');
  let token: string | undefined;
  if (authorization !== undefined) {
    const match = /^Bearer ([^\s]+)$/i.exec(authorization);
    if (!match) {
      res.status(401).json({ error: 'Cabeçalho Authorization inválido.' });
      return;
    }
    token = match[1];
  } else if (typeof req.cookies?.token === 'string') {
    token = req.cookies.token;
  }
  if (!token) {
    res.status(401).json({ error: 'Token não fornecido.' });
    return;
  }
  // Cookies são enviados automaticamente pelo navegador: mutações exigem origem confiável.
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (authorization === undefined && unsafe &&
      ![env.FRONTEND_ORIGIN, env.API_ORIGIN].includes(req.get('origin') ?? '')) {
    res.status(403).json({ error: 'Origem obrigatória e confiável para autenticação por cookie.' });
    return;
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'], issuer: 'express-tutorial', audience: 'express-api',
    });
    if (typeof payload === 'string' || !Number.isInteger(payload.id) ||
        payload.id < 1 || payload.id > 2147483647) {
      throw new Error('Payload inválido.');
    }
    res.locals.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

export const requireSelf: RequestHandler = (req, res, next) => {
  if (Number(req.params.id) !== res.locals.userId) {
    res.status(403).json({ error: 'Você só pode acessar a própria conta.' });
    return;
  }
  next();
};
```

Bearer tem precedência quando o cabeçalho está presente. Tokens malformados, expirados, de outro emissor, audiência ou algoritmo são rejeitados. Nas rotas de conta com cookie, operações de escrita exigem `Origin` permitido; isso reduz o risco de CSRF. No capítulo 7 aplicaremos uma política de origem também às rotas públicas.

Emissor identifica quem criou o token; audiência identifica para qual aplicação ele foi criado. Conferir esses valores evita aceitar um token válido destinado a outro contexto. **CSRF** é uma tentativa de fazer o navegador enviar uma alteração a partir de uma página não autorizada; exigir uma origem confiável ajuda a impedir esse uso dos cookies.

## 5. Substituir o controlador de usuários

**Propósito do passo:** A listagem que antes mostrava todos os usuários agora precisa devolver somente a própria conta. Substituímos o controlador completo para aplicar essa regra de forma clara.

A diferença de política está em `getAllUsers`: a rota passa a devolver apenas o registro do usuário autenticado. O método de listagem global do serviço anterior deixa de ser usado por rotas públicas.

**Arquivo: `src/controllers/user.controller.ts`**

Substitua todo o conteúdo do arquivo existente. Recebe dados do pedido, chama o serviço e envia a resposta HTTP com o status adequado.

<!-- file: src/controllers/user.controller.ts -->
```typescript
// Arquivo: src/controllers/user.controller.ts
import type { Request, Response } from 'express';
import { createUser, getUserById, updateUser, deleteUser, toPublicUser } from '../services/user.service.js';

export class UserController {
  static async createUser(req: Request, res: Response) {
    const user = await createUser(req.body);
    res.status(201).json(toPublicUser(user));
  }
  static async getAllUsers(_req: Request, res: Response) {
    const user = await getUserById(res.locals.userId);
    res.json([toPublicUser(user)]);
  }
  static async getUserById(req: Request, res: Response) {
    res.json(toPublicUser(await getUserById(Number(req.params.id))));
  }
  static async updateUser(req: Request, res: Response) {
    res.json(toPublicUser(await updateUser(Number(req.params.id), req.body)));
  }
  static async deleteUser(req: Request, res: Response) {
    await deleteUser(Number(req.params.id));
    res.status(204).send();
  }
}
```

## 6. Substituir rotas e aplicação preservando as funcionalidades

**Propósito do passo:** Agora vamos conectar as novas rotas, a leitura dos cookies e a regra de origens permitidas. Mantemos a validação e o tratamento de erros que já funcionavam nos capítulos anteriores.

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

const router = Router();
router.post('/users', validate(createUserSchema), UserController.createUser);
router.get('/users', authMiddleware, UserController.getAllUsers);
router.get('/users/:id', authMiddleware, validate(userIdSchema), requireSelf, UserController.getUserById);
router.put('/users/:id', authMiddleware, validate(updateUserSchema), requireSelf, UserController.updateUser);
router.delete('/users/:id', authMiddleware, validate(userIdSchema), requireSelf, UserController.deleteUser);
export default router;
```

**Arquivo: `src/routes/index.ts`**

Substitua todo o conteúdo do arquivo existente. Reúne as rotas já criadas e as disponibiliza para app.ts. Só importe aqui um arquivo que já exista.

<!-- file: src/routes/index.ts -->
```typescript
// Arquivo: src/routes/index.ts
import { Router } from 'express';
import userRoutes from './user.route.js';
import authRoutes from './auth.route.js';

const routes = Router();
routes.use(userRoutes);
routes.use(authRoutes);
export default routes;
```

**Arquivo: `src/middlewares/cors.middleware.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Informa ao navegador quais origens podem ler as respostas da API e permite o envio de credenciais nessas origens.

<!-- file: src/middlewares/cors.middleware.ts -->
```typescript
// Arquivo: src/middlewares/cors.middleware.ts
import cors from 'cors';
import { env } from '../config/env.js';

export const corsMiddleware = cors({
  origin: [env.FRONTEND_ORIGIN, env.API_ORIGIN],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Arquivo: `src/app.ts`**

Substitua todo o conteúdo do arquivo existente. Configura o Express e os caminhos pelos quais os pedidos serão atendidos. Este arquivo será atualizado ao conectar novos recursos do guia.

<!-- file: src/app.ts -->
```typescript
// Arquivo: src/app.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const app = express();
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: '16kb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(routes);
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(errorHandler);
```

## 7. Verificar login, token e cookies

**Propósito do passo:** Vamos comparar pedidos sem login, login incorreto e login correto. Depois verificaremos as duas formas de enviar a identificação: cabeçalho Bearer e cookie.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm run typecheck
```

Com o servidor em execução, crie uma conta de teste se ainda não houver uma e teste:

Se o servidor estiver parado, execute `npm run dev` no primeiro CMD e deixe-o aberto. Execute os pedidos abaixo no segundo. Se já usou `login@example.com`, troque o e-mail em **todos** os pedidos de cadastro e login deste teste ou reutilize a conta existente sem repetir o cadastro.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
curl.exe -i http://localhost:3000/users
curl.exe -i -H "Content-Type: application/json" -d "{\"email\":\"login@example.com\",\"password\":\"Teste123!\",\"name\":\"Pessoa Teste\"}" http://localhost:3000/users
curl.exe -i -H "Content-Type: application/json" -d "{\"email\":\"login@example.com\",\"password\":\"SenhaErrada\"}" http://localhost:3000/login
curl.exe -i -c cookies.txt -H "Content-Type: application/json" -d "{\"email\":\"login@example.com\",\"password\":\"Teste123!\"}" http://localhost:3000/login
curl.exe -i -b cookies.txt http://localhost:3000/users
```

Espere 401, 201, 401, 200 e 200. O login deve devolver `token`, usuário sem `password` e cabeçalho `Set-Cookie` com `HttpOnly`. O arquivo temporário `cookies.txt` contém um token: não o versione; exclua-o quando encerrar o teste.

Copie o token para o CMD:

Na resposta do login, procure o campo `token`. Copie somente o texto entre as aspas, sem as aspas e sem a palavra `Bearer`. No comando `set` abaixo, substitua `COLE_O_TOKEN_DO_LOGIN` pelo texto copiado. `%TOKEN%` lê essa variável **nesse mesmo CMD**; ao abrir outro terminal, você precisa defini-la novamente.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
set TOKEN=COLE_O_TOKEN_DO_LOGIN
curl.exe -i -H "Authorization: Bearer %TOKEN%" http://localhost:3000/users
```

Consulte o próprio ID: 200. Consulte um ID de outra conta com o mesmo token: 403. IDs inválidos recebem 400 **após autenticar**. Sem autenticação, recebem 401.

Teste cookie em uma atualização, substituindo o ID:

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
curl.exe -i -X PUT -b cookies.txt -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -d "{\"name\":\"Nome Atualizado\"}" http://localhost:3000/users/1
curl.exe -i -X POST -b cookies.txt -c cookies.txt http://localhost:3000/logout
```

A atualização deve retornar 200; sem a origem confiável, 403. Logout retorna 204 e limpa o cookie. Para Bearer, o cliente deve descartar o token.

<details>
<summary>Usar o cookie no frontend</summary>

Um **frontend** é a página que a pessoa usa no navegador para enviar pedidos à API. Este guia constrói a API; a criação de uma página completa não é necessária para avançar. O exemplo abaixo mostra como essa página faria login.

Para experimentar agora, deixe a API em execução, abra `http://localhost:3000/health` no navegador e abra as ferramentas de desenvolvimento com F12. Selecione a aba **Console**, confira que a conta de teste ainda existe e execute o código abaixo. Ele é um exemplo para o console do navegador, **não** um novo arquivo da API. Também pode ser usado no console de um frontend já disponível em `http://localhost:5173`, usando `localhost` nas duas aplicações.

**Onde executar: console do navegador na página local da API, ou no frontend autorizado.**

```javascript
// Local de execução: console do navegador; não salvar em src/.
const response = await fetch('http://localhost:3000/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'login@example.com', password: 'Teste123!' }),
});
const result = await response.json();
console.log(response.status, result.user);
```

Nas requisições posteriores também use `credentials: 'include'`. No Axios, a opção equivalente é `withCredentials: true`. Não é necessário copiar o token para `localStorage`.

O resultado esperado é 200 e os campos públicos da conta no console. `credentials: 'include'` permite que o navegador receba e envie o cookie. HttpOnly impede que o código leia esse cookie por `document.cookie`; isso não impede seu envio automático nas requisições. Você pode conferir sua presença na área de cookies das ferramentas do navegador.

Cookies `SameSite=Lax` deste exercício pressupõem frontend e API no mesmo site, como `localhost` em portas diferentes. Sites distintos precisam de uma política de cookie/CSRF própria; não basta trocar `origin` por `*`.

</details>

> **ℹ️ Observação**
>
> JWTs são válidos por 15 minutos. Logout e troca de senha não revogam imediatamente os tokens já emitidos. Uma aplicação que precise de revogação imediata deve adicionar sessões ou um mecanismo de revogação. Em produção, cookies `Secure` exigem HTTPS; configure `API_ORIGIN` e `FRONTEND_ORIGIN` com as origens reais, sem caminhos ou barra final.

## Conferência antes de avançar

- [ ] Login correto retorna 200; credenciais incorretas, 401.
- [ ] JWT sem segredo configurado não permite iniciar a aplicação.
- [ ] Acesso sem token é bloqueado; outra conta recebe 403.
- [ ] Bearer e cookie funcionam; cookie em mutações exige origem confiável.
- [ ] Respostas de usuários e login não contêm hash de senha.

Referências: [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) · [CORS no Express](https://expressjs.com/en/resources/middleware/cors.html).

[← Anterior](04-validacao-de-dados-com-zod.md) · [06 · Logs →](06-monitorizacao-e-logs-com-winston.md)
