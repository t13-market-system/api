import { Request, Response } from 'express';
import { ClienteService } from '../services/cliente.service';

export class ClienteController {
  // POST - criar novo cliente
  static async createCliente(req: Request, res: Response) {
    const { nomeCliente, emailCliente } = req.body;

    if (!emailCliente || !nomeCliente) {
      return res.status(400).json({ error: 'Nome e email do cliente são obrigatórios.' });
    }

    try {
      const novoCliente = await ClienteService.createCliente({ nomeCliente, emailCliente });
      
      console.log(`Cliente criado com sucesso: ${novoCliente.emailCliente}`);
      return res.status(201).json(novoCliente);
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);

      if (error?.sqlState === '23505' || error?.code === 'P2002' || error?.message?.includes('unique constraint')) {
        return res.status(409).json({ error: 'Este e-mail já está em uso.' });
      }

      return res.status(500).json({ error: 'Erro interno ao salvar usuário.' });
    }
  }

  // GET - listar todos os clientes
  static async getAllClientes(req: Request, res: Response) {
    try {
      const users = await ClienteService.getAllClientes();
      return res.status(200).json(users);
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar clientes.' });
    }
  }

  // GET - buscar cliente por ID
  static async getClienteById(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const user = await ClienteService.getClienteById(Number(id));
      return res.status(200).json(user);
    } catch (error: any) {
      console.error('Erro ao buscar cliente:', error);
      
      if (error.message === 'Cliente não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno ao buscar cliente.' });
    }
  }

  // PUT - atualizar cliente por ID
  static async updateCliente(req: Request, res: Response) {
    const { id } = req.params;
    const { name, email, password } = req.body;

    try {
      const userAtualizado = await ClienteService.updateCliente(Number(id), { name, email, password });
      
      console.log(`Cliente atualizado com sucesso: ${userAtualizado.emailCliente}`);
      return res.status(200).json(userAtualizado);
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);

      if (error.message === 'Cliente não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      if (error?.sqlState === '23505' || error?.code === 'P2002' || error?.message?.includes('unique constraint')) {
        return res.status(409).json({ error: 'Este e-mail já está em uso.' });
      }

      return res.status(500).json({ error: 'Erro interno ao atualizar usuário.' });
    }
  }

  // DELETE - remover usuário por ID
  static async deleteClientes(req: Request, res: Response) {
    const { id } = req.params;

    try {
      await ClienteService.deleteCliente(Number(id));
      
      console.log(`Cliente removido com sucesso: id ${id}`);
      return res.status(200).json({ message: 'Cliente removido com sucesso.' });
    } catch (error: any) {
      console.error('Erro ao remover cliente:', error);
      
      if (error.message === 'Cliente não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno ao remover cliente.' });
    }
  }
}