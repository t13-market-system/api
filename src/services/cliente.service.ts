import { prisma as db } from '../lib/prisma';

export class ClienteService {
  // 1. CRIAR CLIENTE
  static async createCliente(data: any) {

    const novoUser = await db.orm.public.Cliente.create({
      nomeCliente: data.nomeCliente,
      emailCliente: data.emailCliente
    });

    return novoUser;
  }

  // 2. LISTAR TODOS OS CLIENTES
  static async getAllClientes() {
    return await db.orm.public.Cliente.all();
  }

  // 3. BUSCAR CLIENTE POR ID
  static async getClienteById(id: number) {
    const cliente = await db.orm.public.Cliente.first({ idCliente: id });
    if (!cliente) {
      throw new Error('Cliente não encontrado.');
    }
    return cliente;
  }

  // 4. ATUALIZAR CLIENTE
  static async updateCliente(id: number, data: any) {
    // Verifica se o cliente existe primeiro
    const clienteExiste = await db.orm.public.Cliente.first({ idCliente: id });
    if (!clienteExiste) {
      throw new Error('Cliente não encontrado.');
    }

    const dataToUpdate = { ...data };


    const userAtualizado = await db.orm.public.Cliente
      .where({ idCliente: id })
      .update(dataToUpdate);

    if (!userAtualizado) {
      throw new Error('Cliente não encontrado.');
    }

    return userAtualizado;
  }

  // 5. REMOVER CLIENTE
  static async deleteCliente(id: number) {
    const clienteExiste = await db.orm.public.Cliente.first({ idCliente: id });
    if (!clienteExiste) {
      throw new Error('Cliente não encontrado.');
    }

    await db.orm.public.Cliente.where({ idCliente: id }).delete();
    return true;
  }
}
