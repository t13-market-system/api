import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.').optional(),
    email: z.email('Formato de e-mail inválido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.').optional(),
    email: z.email('Formato de e-mail inválido.').optional(),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.').optional(),
  }),
  params: z.object({
    id: z.string().refine((val) => /^\d+$/.test(val), { message: 'O ID deve ser numérico.' }),
  }),
});