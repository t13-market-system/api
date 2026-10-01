# 🔐 Autenticação com JWT e Rotas Protegidas

> [!NOTE]  
> Agora que nossa API consegue cadastrar e validar os dados de um usuário, precisamos de um sistema de **Login**. O objetivo é gerar um "crachá de acesso" (Token JWT) para o usuário logado e exigir esse crachá sempre que ele tentar acessar áreas restritas (como listar ou deletar contas).

## 2️⃣0️⃣ Esquema de Validação do Login

Antes de tentar logar alguém, precisamos garantir que a requisição trouxe um e-mail e uma senha.

Crie o arquivo `src/schemas/auth.schema.ts`:

```typescript
// src/schemas/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.email('Formato de e-mail inválido.'),
    password: z.string().min(1, 'A senha é obrigatória.'),
  }),
});
```

## 2️⃣1️⃣ Serviço de Autenticação (A Lógica)

O Serviço vai buscar o usuário no banco, verificar se a senha bate (usando o bcrypt) e, se tudo estiver certo, assinar e devolver um Token.

Crie o arquivo `src/services/auth.service.ts`:

```typescript
// src/services/auth.service.ts
import { prisma as db } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
  static async login(data: any) {
    // 1. Busca o usuário pelo e-mail
    const user = await db.orm.public.User.first({ email: data.email });
    if (!user) {
      throw new Error('Credenciais inválidas.');
    }

    // 2. Verifica se a senha está correta
    const senhaValida = await bcrypt.compare(data.password, user.password);
    if (!senhaValida) {
      throw new Error('Credenciais inválidas.');
    }

    // 3. Gera o Token JWT com duração de 1 dia
    const secret = process.env.JWT_SECRET || 'chave-secreta-fallback';
    const token = jwt.sign(
      { id: user.id, email: user.email }, // Payload (dados públicos)
      secret,                             // Chave secreta (.env)
      { expiresIn: '1d' }                 // Validade
    );

    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }
}
```

## 2️⃣2️⃣ Controlador e Rota de Login

O Controlador vai receber os dados da internet, passar para o Serviço e devolver o Token para o usuário.

**A.** Crie o arquivo `src/controllers/auth.controller.ts`:

```typescript
// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }
}
```

**B.** Crie o mapa de rotas em `src/routes/auth.route.ts`:

```typescript
// src/routes/auth.route.ts
import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema } from '../schemas/auth.schema';

const app = express.Router();

// 📍 Rota de Login protegida pelo Zod
app.post('/login', validate(loginSchema), AuthController.login);

export default app;
```

**C.** E não se esqueça de ativar essa rota no arquivo central `src/routes/index.ts`:

```typescript
// src/routes/index.ts
import { Router } from 'express';
import userRoutes from './user.route';
import authRoutes from './auth.route'; // 👈 NOVA IMPORTAÇÃO

const routes = Router();

routes.use(userRoutes);
routes.use(authRoutes); // 👈 ATIVANDO AS ROTAS DE AUTH

export default routes;
```

## 2️⃣3️⃣ O "Leão de Chácara" (Middleware JWT)

Agora nós temos um Token! Mas como exigimos que o usuário mostre esse token para acessar outras rotas? Criando um middleware interceptador focado em segurança.

Crie o arquivo `src/middlewares/auth.middleware.ts`:

```typescript
// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 1. O Token geralmente vem no Header: "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  // 2. Extrai a palavra "Bearer " e pega só o código do token
  const [, token] = authHeader.split(' ');

  try {
    const secret = process.env.JWT_SECRET || 'chave-secreta-fallback';
    
    // 3. Valida a assinatura do Token
    const decoded = jwt.verify(token, secret);
    
    // 4. Injeta os dados do usuário na requisição para uso nos próximos Controllers
    (req as any).user = decoded;
    
    return next(); // Tudo certo, pode entrar!
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};
```

## 2️⃣4️⃣ Trancando as Portas (Rotas Protegidas)

Agora é só escolher quais rotas exigem esse "crachá". Vamos bloquear a listagem, edição e exclusão de usuários!

Abra o arquivo `src/routes/user.route.ts` e atualize:

```typescript
// src/routes/user.route.ts
import express from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';
import { authMiddleware } from '../middlewares/auth.middleware'; // 👈 IMPORTANDO O SEGURANÇA

const app = express.Router();

// 🔓 Rota Pública (Qualquer um pode criar conta)
app.post('/users', validate(createUserSchema), UserController.createUser);

// 🔒 Rotas Privadas (Exigem o authMiddleware)
app.get('/users', authMiddleware, UserController.getAllUsers);
app.get('/users/:id', authMiddleware, UserController.getUserById);
app.put('/users/:id', authMiddleware, validate(updateUserSchema), UserController.updateUser);
app.delete('/users/:id', authMiddleware, UserController.deleteUser);

export default app;
```

> [!IMPORTANT]  
> **Pronto! Sua API agora tem controle de acesso profissional.** 🚀  
> Teste o seu login enviando um POST para `/login`, copie o `token` gerado, e envie-o no Header `Authorization` como `Bearer SEU_TOKEN_AQUI` para conseguir listar os usuários no `/users`!

## 2️⃣5️⃣ Configurando o CORS para o Front-End

Para que uma aplicação Front-End (como o React) rodando em uma porta diferente (ex: `5173`) consiga bater no `/login` e trafegar cookies via Axios de forma segura, precisamos configurar a permissão de **CORS**. 

Pare a sua API e instale o pacote:
```bash
npm install cors
npm install -D @types/cors
```

Crie o arquivo `src/middlewares/cors.middleware.ts`:
```typescript
import cors from 'cors';

export const corsMiddleware = cors({
  origin: 'http://localhost:5173', // A exata URL do seu Front-End
  credentials: true, // Permite que a API receba/envie Cookies (HttpOnly)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'] // Cabeçalhos permitidos
});
```

E ative ele no seu `src/server.ts` **antes** das rotas:
```typescript
import { corsMiddleware } from './middlewares/cors.middleware';

// ...
app.use(corsMiddleware); // <- Adicione aqui, antes do app.use(express.json()) e das rotas
```

## 2️⃣6️⃣ Salvando o Token em Cookie HTTP Only

Para enviar e ler cookies no seu servidor (aumentando a segurança e evitando armazenar tokens no `localStorage` do frontend), precisamos do pacote `cookie-parser`.

Instale o pacote:
```bash
npm install cookie-parser
npm install -D @types/cookie-parser
```

Ative ele no seu `src/server.ts` logo após o CORS:
```typescript
import cookieParser from 'cookie-parser';

// ...
app.use(corsMiddleware); // Nosso middleware de CORS
app.use(cookieParser()); // Middleware para ler cookies
```

Agora, no seu `src/controllers/auth.controller.ts`, configure para enviar o token pelo cookie quando o login tiver sucesso:
```typescript
            const result = await AuthService.login({ email, password });
            
            // Salvando o token em um cookie HTTP Only
            res.cookie('token', result.token, {
                httpOnly: true,       // Protege contra XSS
                secure: false,        // Use 'true' em produção com HTTPS
                sameSite: 'lax',      // Bom para segurança entre a mesma origem
                maxAge: 24 * 60 * 60 * 1000 // 1 dia
            });

            return res.status(200).json(result);
```

Por fim, atualize o `src/middlewares/auth.middleware.ts` para que ele consiga extrair o token que está vindo dos cookies em todas as requisições autenticadas:
```typescript
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Busca o token nos cookies ou no header Authorization
    let token = req.cookies?.token;

    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            [, token] = authHeader.split(' ');
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Token nao fornecido' });
    }
    
    // ... restante do código do middleware
```

---
➡️ *Que tal registrar tudo o que acontece? Siga para a Parte 6:* [06-monitorizacao-e-logs-com-winston.md](./06-monitorizacao-e-logs-com-winston.md)
