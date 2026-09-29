# 🛡️ Validação de Dados com Zod e Middlewares

> [!NOTE]  
> Atualmente, o nosso `UserController` possui validações manuais (como `if (!email || !password)`). Embora funcione, isso polui o Controlador. O ideal é que o Controlador foque apenas em orquestrar o fluxo. Para resolver isso, vamos usar o **Zod** para criar esquemas de validação e um **Middleware** para interceptar as requisições, limpando e validando os dados antes de chegarem ao Controlador.

## 1️⃣6️⃣ Criando Esquemas de Validação (Schemas)

Os esquemas definem as regras que os nossos dados devem seguir (ex: "o email deve ser um email válido", "a senha deve ter no mínimo 6 caracteres").

Crie a pasta `src/schemas/` e dentro dela o arquivo `user.schema.ts`:

```typescript
// src/schemas/user.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.').optional(),
    email: z.email('Formato de e-mail inválido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.').optional(),
    email: z.email('Formato de e-mail inválido.').optional(),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.').optional(),
  }),
  params: z.object({
    id: z.string().refine((val) => /^\d+$/.test(val), { message: 'O ID deve ser numérico.' }),
  }),
});
```

## 1️⃣7️⃣ Criando o Middleware Interceptador

O Middleware é uma função que fica no "meio" do caminho entre a requisição do usuário e o nosso Controlador. Ele vai receber o esquema do Zod, validar os dados (`req.body`, `req.query`, `req.params`) e, caso algo esteja errado, bloquear a requisição e retornar um erro amigável, impedindo que o fluxo continue.

Crie a pasta `src/middlewares/` e o arquivo `validate.middleware.ts`:

```typescript
// src/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export const validate = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 🛡️ Valida a requisição contra o schema definido
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next(); // Se estiver tudo certo, permite que a requisição siga para o Controller
    } catch (error) {
      if (error instanceof ZodError) {
        // Formata os erros do Zod para uma resposta mais amigável
        const formattedErrors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        return res.status(400).json({ errors: formattedErrors });
      }
      return res.status(500).json({ error: 'Erro interno na validação dos dados.' });
    }
  };
};
```

## 1️⃣8️⃣ Aplicando o Middleware nas Rotas

Agora precisamos plugar o nosso validador nas rotas! Vamos dizer para o mapa de rotas: "Antes de chamar o Controlador, passe pelo Validador".

Atualize o arquivo `src/routes/user.route.ts`:

```typescript
// src/routes/user.route.ts
import express from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';

const app = express.Router();

// 📍 Mapeamento das Rotas de Usuário com Validação (Zod)
app.post('/users', validate(createUserSchema), UserController.createUser);
app.get('/users', UserController.getAllUsers);
app.get('/users/:id', UserController.getUserById);
app.put('/users/:id', validate(updateUserSchema), UserController.updateUser);
app.delete('/users/:id', UserController.deleteUser);

export default app;
```

## 1️⃣9️⃣ O Controlador Limpo

Como a validação agora é feita de forma automática e centralizada pelo middleware `validate`, o nosso `UserController` não precisa se preocupar com dados mal formatados. O código fica muito mais focado no fluxo de negócio!

Veja como o `src/controllers/user.controller.ts` fica estruturado:

```typescript
// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  static async createUser(req: Request, res: Response) {
    const { name, email, password } = req.body;

    try {
      const novoUser = await UserService.createUser({ name, email, password });
      console.log(`Usuário criado: ${novoUser.email}`);
      return res.status(201).json(novoUser);
    } catch (error: any) {
      if (error?.sqlState === '23505' || error?.code === 'P2002' || error?.message?.includes('unique constraint')) {
        return res.status(409).json({ error: 'Este e-mail já está em uso.' });
      }
      return res.status(500).json({ error: 'Erro interno ao salvar usuário.' });
    }
  }

  // ... (restante do controlador permanece igual)
}
```

> [!TIP]  
> **Segurança e Agilidade!** 🚀  
> Com essa abordagem, o seu `UserController` tem a garantia absoluta de que `req.body` contém os dados no formato exato que ele espera (exigido pelo Zod). Nenhum payload malicioso ou mal formatado chegará à camada de Serviços!
