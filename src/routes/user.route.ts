import express from 'express';
import { prisma as db } from '../lib/prisma'; 


const app = express.Router();
app.use(express.json());

export default app;
// POST - criar novo usuário
app.post('/users', async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
   
    const novoUser = await db.orm.public.User.create({
      name,
      email,
      password,
    });

    console.log(`Usuário criado com sucesso: ${novoUser.email}`);
    return res.status(201).json(novoUser);
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);


    if (error?.sqlState === '23505' || error?.code === 'P2002' || error?.message?.includes('unique constraint')) {
      return res.status(409).json({ error: 'Este e-mail já está em uso.' });
    }

    return res.status(500).json({ error: 'Erro interno ao salvar usuário.' });
  }
});


// FIm do POST - criar novo usuário

// GET - listar todos os usuários
app.get('/users', async (req, res) => {
  try {
    const users = await db.orm.public.User.all();
    return res.status(200).json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar usuários.' });
  }
});

// GET - buscar usuário por ID
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await db.orm.public.User.first({ id: Number(id) });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar usuário.' });
  }
});

// PUT - atualizar usuário por ID
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  try {
    const userExiste = await db.orm.public.User.first({ id: Number(id) });

    if (!userExiste) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const userAtualizado = await db.orm.public.User
      .where({ id: Number(id) })
      .update({ name, email, password });

    if (!userAtualizado) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    console.log(`Usuário atualizado com sucesso: ${userAtualizado.email}`);
    return res.status(200).json(userAtualizado);
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);

    if (error?.sqlState === '23505' || error?.code === 'P2002' || error?.message?.includes('unique constraint')) {
      return res.status(409).json({ error: 'Este e-mail já está em uso.' });
    }

    return res.status(500).json({ error: 'Erro interno ao atualizar usuário.' });
  }
});

// DELETE - remover usuário por ID
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const userExiste = await db.orm.public.User.first({ id: Number(id) });

    if (!userExiste) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await db.orm.public.User.where({ id: Number(id) }).delete();

    console.log(`Usuário removido com sucesso: id ${id}`);
    return res.status(200).json({ message: 'Usuário removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    return res.status(500).json({ error: 'Erro interno ao remover usuário.' });
  }
});
