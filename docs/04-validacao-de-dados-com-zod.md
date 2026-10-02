# 04 · Validação e normalização com Zod

[← Anterior](03-criando-rotas-serv-contro.md) · [Índice](../README.md) · **Etapa 4 de 11** · [Próxima →](05-autenticacao-com-jwt.md)

## Resultado desta etapa

Entradas verificadas antes do serviço: e-mail normalizado, senha com limite compatível com bcrypt, campos extras rejeitados e IDs válidos.

## 1. Criar schemas de usuário

<!-- file: src/schemas/user.schema.ts -->
```typescript
import { z } from 'zod';

export const idParams = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser numérico.').refine(value => {
    const id = Number(value);
    return Number.isSafeInteger(id) && id >= 1 && id <= 2147483647;
  }, 'ID fora do intervalo permitido.'),
});

const password = z.string().min(8, 'Use pelo menos 8 caracteres.').refine(
  value => Buffer.byteLength(value, 'utf8') <= 72,
  'A senha deve ter no máximo 72 bytes em UTF-8.',
);

export const createUserBody = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password,
}).strict();

export const updateUserBody = createUserBody.partial().refine(
  value => Object.keys(value).length > 0,
  'Informe pelo menos um campo.',
);

export const createUserSchema = z.object({ body: createUserBody });
export const updateUserSchema = z.object({ body: updateUserBody, params: idParams });
export const userIdSchema = z.object({ params: idParams });
```

`.strict()` rejeita campos desconhecidos como `id`, `createdAt` e `role`. O limite da senha usa **bytes**, porque bcrypt considera até 72 bytes; não corte senhas silenciosamente. Atualizações vazias recebem 400.

## 2. Criar middleware que utiliza o resultado validado

<!-- file: src/middlewares/validate.middleware.ts -->
```typescript
import type { RequestHandler } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodType): RequestHandler => async (req, res, next) => {
  const result = await schema.safeParseAsync({ body: req.body, params: req.params, query: req.query });
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    })) });
    return;
  }
  const parsed = result.data as { body?: unknown };
  if ('body' in parsed) req.body = parsed.body;
  next();
};
```

> [!IMPORTANT]
> O Zod devolve um novo resultado. Validar e descartar esse resultado mantém a entrada original. Aqui `req.body` é substituído pelo valor normalizado. Os IDs permanecem strings validadas em `req.params`; o controlador os converte. Não atribua a `req.query`, que é um getter no Express 5.

## 3. Substituir as rotas

<!-- file: src/routes/user.route.ts -->
```typescript
import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema, userIdSchema } from '../schemas/user.schema.js';

const router = Router();
router.post('/users', validate(createUserSchema), UserController.createUser);
router.get('/users', UserController.getAllUsers);
router.get('/users/:id', validate(userIdSchema), UserController.getUserById);
router.put('/users/:id', validate(updateUserSchema), UserController.updateUser);
router.delete('/users/:id', validate(userIdSchema), UserController.deleteUser);
export default router;
```

O controlador completo do capítulo 3 pode ser mantido. Sua verificação básica no cadastro é redundante após o middleware, mas não impede o funcionamento e não exige substituir parcialmente a classe.

## 4. Conferir rejeição e normalização

```bat
npm run typecheck
```

Com a API aberta, em outro CMD:

```bat
curl.exe -i -H "Content-Type: application/json" -d "{\"email\":\"email-invalido\",\"password\":\"123\"}" http://localhost:3000/users
curl.exe -i -H "Content-Type: application/json" -d "{\"email\":\"valido@example.com\",\"password\":\"Teste123!\",\"id\":99}" http://localhost:3000/users
curl.exe -i -H "Content-Type: application/json" -d "{\"email\":\" NORMALIZADO@EXAMPLE.COM \",\"password\":\"Teste123!\"}" http://localhost:3000/users
```

Espere **400**, **400** e **201**, respectivamente. Na terceira resposta, `email` deve ser `normalizado@example.com`. Se já cadastrou esse e-mail, use outro para não receber 409.

## Conferência antes de avançar

- [ ] Campo desconhecido rejeitado.
- [ ] E-mail normalizado chega ao banco.
- [ ] Senha curta ou acima de 72 bytes recebe 400.
- [ ] Atualização vazia e IDs inválidos recebem 400.
- [ ] `npm run typecheck` conclui sem erro.

Referências: [parsing no Zod](https://zod.dev/basics) · [schemas no Zod](https://zod.dev/api).

[← Anterior](03-criando-rotas-serv-contro.md) · [05 · Autenticação e autorização →](05-autenticacao-com-jwt.md)
