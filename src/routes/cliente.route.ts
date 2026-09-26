import express from 'express';
import { prisma as db } from '../lib/prisma';

const app = express.Router();
app.use(express.json());

export default app;

// POST - criar novo cliente
app.post('/clientes', async (req, res) => {
  const { nomeCliente, emailCliente } = req.body;

  try {
    const cliente = await db.orm.public.Cliente.create({
      nomeCliente,
      emailCliente,
    });
    return res.status(201).json(cliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar cliente.' });
  }
});

// GET - listar clientes.
app.get('/clientes', async (req, res) => {
  try {
    const clientes = await db.orm.public.Cliente.all();
    return res.status(200).json(clientes);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar clientes.' });
  }
});

// GET - buscar cliente por ID
app.get('/clientes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const cliente = await db.orm.public.Cliente.first({ idCliente: Number(id) });
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }
    return res.status(200).json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar cliente.' });
  }
});

// PUT - atualizar cliente por ID
app.put('/clientes/:id', async (req, res) => {
  const { id } = req.params;
  const { nomeCliente, emailCliente } = req.body;

  try {
    const clienteExiste = await db.orm.public.Cliente.first({ idCliente: Number(id) });

    if (!clienteExiste) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const cliente = await db.orm.public.Cliente
      .where({ idCliente: Number(id) })
      .update({ nomeCliente, emailCliente });
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }
    return res.status(200).json(cliente);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar cliente.' });
  }
});

// DELETE - remover cliente por ID
app.delete('/clientes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const cliente = await db.orm.public.Cliente.first({ idCliente: Number(id) });
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }
    await db.orm.public.Cliente.where({ idCliente: Number(id) }).delete();

    return res.status(200).json({ message: 'Cliente removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover cliente:', error);
    return res.status(500).json({ error: 'Erro interno ao remover cliente.' });
  }
});
