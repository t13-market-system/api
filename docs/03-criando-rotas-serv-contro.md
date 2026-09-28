## Passo 12: A Camada de Serviços (O Coração da Aplicação)

Na nossa arquitetura limpa, a pasta `services/` é responsável EXCLUSIVAMENTE por conversar com o banco de dados e aplicar regras de negócio (como criptografar senhas). O Serviço não sabe o que é a internet, rotas ou respostas HTTP.

Crie uma pasta chamada `services` dentro de `src/`, e adicione o arquivo `user.service.ts`. 

Neste arquivo, vamos usar a sintaxe do **Prisma v8** (`db.orm.public.User`) para isolar todas as nossas operações de CRUD (Criar, Ler, Atualizar, Apagar):

```typescript
// src/services/user.service.ts
import { prisma as db } from '../lib/prisma';
import bcrypt from 'bcrypt';

export class UserService {
  // 1. CRIAR USUÁRIO
  static async createUser(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const novoUser = await db.orm.public.User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    return novoUser;
  }

  // 2. LISTAR TODOS OS USUÁRIOS
  static async getAllUsers() {
    return await db.orm.public.User.all();
  }

  // 3. BUSCAR USUÁRIO POR ID
  static async getUserById(id: number) {
    const user = await db.orm.public.User.first({ id });
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }
    return user;
  }

  // 4. ATUALIZAR USUÁRIO
  static async updateUser(id: number, data: any) {
    const userExiste = await db.orm.public.User.first({ id });
    if (!userExiste) {
      throw new Error('Usuário não encontrado.');
    }

    const dataToUpdate = { ...data };

    if (data.password) {
      dataToUpdate.password = await bcrypt.hash(data.password, 10);
    }

    const userAtualizado = await db.orm.public.User
      .where({ id })
      .update(dataToUpdate);

    if (!userAtualizado) {
      throw new Error('Usuário não encontrado.');
    }

    return userAtualizado;
  }

  // 5. REMOVER USUÁRIO
  static async deleteUser(id: number) {
    const userExiste = await db.orm.public.User.first({ id });
    if (!userExiste) {
      throw new Error('Usuário não encontrado.');
    }

    await db.orm.public.User.where({ id }).delete();
    return true;
  }
}
```

##  13: A Camada de Controladores (O Garçom)

O Controlador é o intermediário. A sua única função é extrair os dados que vêm da requisição da internet (req), enviar para o nosso Serviço processar, e devolver a resposta formatada (res) para o usuário.

Crie uma pasta chamada controllers dentro de src/, e adicione o arquivo user.controller.ts:

```typescript
// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  static async createUser(req: Request, res: Response) {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
      const novoUser = await UserService.createUser({ name, email, password });
      console.log(`Usuário criado com sucesso: ${novoUser.email}`);
      return res.status(201).json(novoUser);
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
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
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar usuários.' });
    }
  }

  static async getUserById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const user = await UserService.getUserById(Number(id));
      return res.status(200).json(user);
    } catch (error: any) {
      console.error('Erro ao buscar usuário:', error);
      if (error.message === 'Usuário não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno ao buscar usuário.' });
    }
  }

  static async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const { name, email, password } = req.body;
    try {
      const userAtualizado = await UserService.updateUser(Number(id), { name, email, password });
      console.log(`Usuário atualizado com sucesso: ${userAtualizado.email}`);
      return res.status(200).json(userAtualizado);
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      if (error.message === 'Usuário não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      if (error?.sqlState === '23505' || error?.code === 'P2002' || error?.message?.includes('unique constraint')) {
        return res.status(409).json({ error: 'Este e-mail já está em uso.' });
      }
      return res.status(500).json({ error: 'Erro interno ao atualizar usuário.' });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await UserService.deleteUser(Number(id));
      console.log(`Usuário removido com sucesso: id ${id}`);
      return res.status(200).json({ message: 'Usuário removido com sucesso.' });
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error);
      if (error.message === 'Usuário não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno ao remover usuário.' });
    }
  }
}
```
## Passo 14: A Camada de Rotas (O Mapa da API)
Agora que separamos a lógica, veja como o arquivo de rotas fica elegante. Ele serve apenas como um mapa, conectando uma URL a uma função do Controlador.

Dentro de  `/src/routes`   e adicione o arquivo `user.route.ts` caso ainda não tenho feito com o seguinte conteúdo:

```typescript
// src/routes/user.route.ts
import express from 'express';
import { UserController } from '../controllers/user.controller';

const app = express.Router();

// Rotas de Usuários mapeadas para o Controlador
app.post('/users', UserController.createUser);
app.get('/users', UserController.getAllUsers);
app.get('/users/:id', UserController.getUserById);
app.put('/users/:id', UserController.updateUser);
app.delete('/users/:id', UserController.deleteUser);

export default app;
```

Obs.: Se no futuro precisarmos mudar de banco de dados, mexemos apenas no Service. Se precisarmos mudar a forma como a internet acessa os dados, mexemos no Controller. Isso torna o código profissional, fácil de ler e simples de manter!