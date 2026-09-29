# 🏗️ Arquitetura MVC: Rotas, Serviços e Controladores

> [!NOTE]  
> Para manter o código profissional, fácil de ler e simples de manter, vamos separar nossas responsabilidades em três camadas fundamentais: **Services** (Regras de negócio), **Controllers** (Tráfego HTTP) e **Routes** (Mapa de URLs).

## 1️⃣2️⃣ Camada de Serviços (O Coração)

Na nossa arquitetura limpa, a pasta `services/` é responsável **exclusivamente** por conversar com o banco de dados e aplicar regras de negócio (como criptografar senhas). O Serviço não sabe o que é a internet, requisições ou Express.

Crie `src/services/user.service.ts` utilizando a sintaxe do **Prisma 8** (`db.orm.public.User`):

```typescript
// src/services/user.service.ts
import { prisma as db } from '../lib/prisma';
import bcrypt from 'bcrypt';

export class UserService {
  // 🟢 1. CRIAR USUÁRIO
  static async createUser(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const novoUser = await db.orm.public.User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });
    return novoUser;
  }

  // 🔵 2. LISTAR TODOS OS USUÁRIOS
  static async getAllUsers() {
    return await db.orm.public.User.all();
  }

  // 🟡 3. BUSCAR USUÁRIO POR ID
  static async getUserById(id: number) {
    const user = await db.orm.public.User.first({ id });
    if (!user) throw new Error('Usuário não encontrado.');
    return user;
  }

  // 🟠 4. ATUALIZAR USUÁRIO
  static async updateUser(id: number, data: any) {
    const userExiste = await db.orm.public.User.first({ id });
    if (!userExiste) throw new Error('Usuário não encontrado.');

    const dataToUpdate = { ...data };
    if (data.password) {
      dataToUpdate.password = await bcrypt.hash(data.password, 10);
    }

    const userAtualizado = await db.orm.public.User.where({ id }).update(dataToUpdate);
    if (!userAtualizado) throw new Error('Usuário não encontrado.');

    return userAtualizado;
  }

  // 🔴 5. REMOVER USUÁRIO
  static async deleteUser(id: number) {
    const userExiste = await db.orm.public.User.first({ id });
    if (!userExiste) throw new Error('Usuário não encontrado.');

    await db.orm.public.User.where({ id }).delete();
    return true;
  }
}
```

## 1️⃣3️⃣ Camada de Controladores (O Garçom)

O Controlador é o intermediário perfeito. A única função dele é extrair os dados da requisição HTTP (`req`), mandar pro nosso Serviço processar, e devolver a resposta formatada (`res`) para o usuário.

Crie o arquivo `src/controllers/user.controller.ts`:

```typescript
// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  static async createUser(req: Request, res: Response) {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios.' });

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

  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await UserService.getAllUsers();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao buscar usuários.' });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const user = await UserService.getUserById(Number(req.params.id));
      return res.status(200).json(user);
    } catch (error: any) {
      if (error.message === 'Usuário não encontrado.') return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: 'Erro interno ao buscar usuário.' });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const user = await UserService.updateUser(Number(req.params.id), req.body);
      return res.status(200).json(user);
    } catch (error: any) {
      if (error.message === 'Usuário não encontrado.') return res.status(404).json({ error: error.message });
      if (error?.code === 'P2002' || error?.message?.includes('unique constraint')) return res.status(409).json({ error: 'E-mail em uso.' });
      return res.status(500).json({ error: 'Erro interno ao atualizar usuário.' });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      await UserService.deleteUser(Number(req.params.id));
      return res.status(200).json({ message: 'Usuário removido com sucesso.' });
    } catch (error: any) {
      if (error.message === 'Usuário não encontrado.') return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: 'Erro interno ao remover usuário.' });
    }
  }
}
```

## 1️⃣4️⃣ Camada de Rotas (O Mapa da API)

Agora que separamos a lógica pesada, veja como o arquivo de rotas fica elegante. Ele funciona estritamente como um mapa, conectando uma URL a uma função direta do Controlador.

Crie o arquivo `src/routes/user.route.ts`:

```typescript
// src/routes/user.route.ts
import express from 'express';
import { UserController } from '../controllers/user.controller';

const app = express.Router();

// 📍 Mapeamento das Rotas de Usuário
app.post('/users', UserController.createUser);
app.get('/users', UserController.getAllUsers);
app.get('/users/:id', UserController.getUserById);
app.put('/users/:id', UserController.updateUser);
app.delete('/users/:id', UserController.deleteUser);

export default app;
```

> [!TIP]  
> **Arquitetura Desacoplada**  
> Se no futuro precisarmos mudar de banco de dados, mexemos **apenas** no Service. Se precisarmos mudar a forma como a internet acessa os dados, mexemos **apenas** no Controller. Mágico, não? ✨

## 1️⃣5️⃣ Conectando as Rotas ao Servidor Central

Agora que temos nossas rotas criadas, precisamos avisar o servidor (`server.ts`) de que elas existem. Uma excelente prática é ter um arquivo centralizador de rotas.

**A.** Crie o arquivo `index.ts` dentro de `src/routes/`:

```typescript
// src/routes/index.ts
import { Router } from 'express';
import userRoutes from './user.route';
import clienteRoutes from './cliente.route'; // Exemplo caso tenha mais rotas

const routes = Router();

routes.use(userRoutes);
routes.use(clienteRoutes);

export default routes;
```

**B.** Atualize o seu `src/server.ts` para importar este arquivo central e plugar as rotas no app:

```typescript
// src/server.ts
import express from 'express';
import routes from './routes/index';

const app = express();
const port = 3000;

app.use(express.json());
app.use(routes); // 🔌 Aqui conectamos todas as rotas!

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
```

> [!IMPORTANT]  
> **Tudo Pronto! 🎉**  
> Volte para o seu CMD e rode o comando `npm run dev`. O seu projeto agora tem uma separação de camadas limpa, uma integração moderna com o Prisma 8, e está com o servidor perfeitamente exposto para a internet!

---
➡️ *Quer mais segurança? Siga para a Parte 4:* [04-validacao-de-dados-com-zod.md](./04-validacao-de-dados-com-zod.md)