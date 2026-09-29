import { prisma as db } from '../lib/prisma';
import bcrypt from 'bcrypt';

export class UserService {
  // 1. CRIAR USUÁRIO
  static async createUser(data: any) {
    // Regra de Negócio: Encriptar a senha antes de salvar
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
    // Verifica se o usuário existe primeiro
    const userExiste = await db.orm.public.User.first({ id });
    if (!userExiste) {
      throw new Error('Usuário não encontrado.');
    }

    const dataToUpdate = { ...data };

    // Se o usuário mandou uma nova senha, encripta também
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