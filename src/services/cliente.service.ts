/*
model Cliente {
  idCliente    Int          @id(map: "cliente_pkey") @default(autoincrement()) @map("id_cliente")
  nomeCliente  String?      @map("nome_cliente")
  emailCliente String?      @map("email_cliente")
  telClientes  TelCliente[]

  @@map("cliente")
}
*/

import { db } from '../prisma/db.js';
import { HttpError } from '../lib/http-error.js';

//usando TypeScript para tipar o retorno do banco de dados
export interface CreateClienteInput {
  nomeCliente: string;
  emailCliente: string;
}

//tipo para atualizar o cliente, pode receber todos os campos, mas não são obrigatórios
export type UpdateClienteInput = Partial<CreateClienteInput>;

//tipo para o retorno do banco de dados
type ClienteRow = Awaited<ReturnType<typeof db.orm.public.Cliente.create>>;


//função para converter o retorno do banco de dados para um objeto público
export const toPublicCliente = (cliente: ClienteRow) => ({
    idCliente: cliente.idCliente,
    nomeCliente: cliente.nomeCliente,
    emailCliente: cliente.emailCliente,
});

//função para criar um novo cliente
export async function createCliente(data: CreateClienteInput) {
    return db.orm.public.Cliente.create({
        nomeCliente: data.nomeCliente,
        emailCliente: data.emailCliente,
    });
}

//função para buscar todos os clientes
export async function getAllClientes() {
    return db.orm.public.Cliente.all();
}

//função para buscar um cliente por id
export async function getClienteById(id: number) {
    const cliente = await db.orm.public.Cliente.first({ idCliente: id });
    if (!cliente) throw new HttpError(404, 'Cliente não encontrado.');
    return cliente;
}

//função para atualizar um cliente
export async function updateCliente(id: number, data: UpdateClienteInput) {
    const changes: UpdateClienteInput = {};
    if (data.nomeCliente !== undefined) changes.nomeCliente = data.nomeCliente;
    if (data.emailCliente !== undefined) changes.emailCliente = data.emailCliente;
    if (Object.keys(changes).length === 0) throw new HttpError(400, 'Informe pelo menos um campo.');
    const cliente = await db.orm.public.Cliente.where({ idCliente: id }).update(changes);
    if (!cliente) throw new HttpError(404, 'Cliente não encontrado.');
    return cliente;
}

//função para deletar um cliente
export async function deleteCliente(id: number) {
    const cliente = await db.orm.public.Cliente.where({ idCliente: id }).delete();
    if (!cliente) throw new HttpError(404, 'Cliente não encontrado.');
}
