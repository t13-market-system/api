import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  // POST - criar novo usuário
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

  // GET - listar todos os usuários
  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await UserService.getAllUsers();
      return res.status(200).json(users);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar usuários.' });
    }
  }

  // GET - buscar usuário por ID
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

  // PUT - atualizar usuário por ID
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

  // DELETE - remover usuário por ID
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