<!-- Documento: docs/04-validacao-de-dados-com-zod.md -->

# 04 · Validação e normalização com Zod

[← Anterior](03-criando-rotas-serv-contro.md) · [Índice](../README.md) · **Etapa 4 de 11** · [Próxima →](05-autenticacao-com-jwt.md)

**Ponto de partida:** conclua o capítulo anterior antes de continuar. Todos os caminhos abaixo partem da raiz da sua API, a pasta que contém `package.json`. Crie as subpastas indicadas no editor quando ainda não existirem.

## Resultado desta etapa

Entradas verificadas antes do serviço: e-mail normalizado, senha com limite compatível com bcrypt, campos extras rejeitados e IDs válidos.

## 1. Criar schemas de usuário

**Propósito do passo:** Um schema do Zod descreve o formato de entrada aceito pela API. Ele é diferente do contrato do Prisma: um confere os pedidos HTTP, e o outro descreve o banco.

**Arquivo: `src/schemas/user.schema.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Define quais campos o cadastro e a atualização aceitam e quais formatos de ID são válidos.

<!-- file: src/schemas/user.schema.ts -->
```typescript
// Arquivo: src/schemas/user.schema.ts
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

O schema define campos permitidos e suas regras. A normalização remove espaços das extremidades do e-mail e o converte para minúsculas antes de conferir seu formato. Um caractere com acento pode ocupar mais de um byte em UTF-8; por isso, contar apenas os caracteres da senha não é suficiente para respeitar o limite do bcrypt.

## 2. Criar middleware que utiliza o resultado validado

**Propósito do passo:** Um middleware é uma função executada no caminho entre a chegada do pedido e o controlador. Aqui ele interrompe entradas inválidas e entrega ao controlador os valores já corrigidos, como o e-mail sem espaços.

**Arquivo: `src/middlewares/validate.middleware.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Executa o schema de validação antes do controlador e troca o corpo do pedido pelo resultado normalizado.

<!-- file: src/middlewares/validate.middleware.ts -->
```typescript
// Arquivo: src/middlewares/validate.middleware.ts
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

> **📌 Importante**
>
> O Zod devolve um novo resultado. Validar e descartar esse resultado mantém a entrada original. Aqui `req.body` é substituído pelo valor normalizado. Os IDs permanecem strings validadas em `req.params`; o controlador os converte. `req.query`, que representa os parâmetros após `?` na URL, é uma propriedade de leitura no Express 5; não tente substituí-la como fazemos com `req.body`.

## 3. Substituir as rotas

**Propósito do passo:** Criar a validação não a ativa automaticamente. Vamos incluí-la nas rotas para que ela seja executada antes dos controladores nas operações que recebem dados.

**Arquivo: `src/routes/user.route.ts`**

Substitua todo o conteúdo do arquivo existente. Relaciona os endereços de usuários aos controladores. Ao longo do guia também recebe validação, autenticação e comentários para o Swagger.

<!-- file: src/routes/user.route.ts -->
```typescript
// Arquivo: src/routes/user.route.ts
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

**Arquivo: `src/routes/index.ts`**

Certifique-se de que este arquivo reúne as rotas e repassa os pedidos para `user.route.js`. Caso ainda não esteja configurado para importar o arquivo de rotas, substitua todo o conteúdo:

<!-- file: src/routes/index.ts -->
```typescript
// Arquivo: src/routes/index.ts
import { Router } from 'express';
import userRoutes from './user.route.js';

const routes = Router();
routes.use(userRoutes);
export default routes;
```

O controlador completo do capítulo 3 pode ser mantido. Sua verificação básica no cadastro é redundante após o middleware, mas não impede o funcionamento e não exige substituir parcialmente a classe.

## 4. Conferir rejeição e normalização

**Propósito do passo:** Vamos enviar dados incorretos de propósito e depois um e-mail que precisa de normalização. A comparação das respostas mostra se a validação rejeita erros e se o valor corrigido chega ao banco.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm run typecheck
```

Com a API aberta, em outro CMD:

Se parou o servidor para editar os arquivos, execute `npm run dev` no primeiro terminal e espere a mensagem de inicialização. Os comandos abaixo vão no segundo terminal, na raiz da mesma API.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
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
