// Arquivo: src/services/user.service.ts
import bcrypt from 'bcrypt';
import { db } from '../prisma/db.js';
import { HttpError } from '../lib/http-error.js';

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
}
export type UpdateUserInput = Partial<CreateUserInput>;
type UserRow = Awaited<ReturnType<typeof db.orm.public.User.create>>;

export const toPublicUser = (user: UserRow) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt,
});

export async function createUser(data: CreateUserInput) {
  return db.orm.public.User.create({
    email: data.email,
    name: data.name ?? null,
    password: await bcrypt.hash(data.password, 12),
  });
}

export async function getAllUsers() {
  return db.orm.public.User.all();
}

export async function getUserById(id: number) {
  const user = await db.orm.public.User.first({ id });
  if (!user) throw new HttpError(404, 'Usuário não encontrado.');
  return user;
}

export async function updateUser(id: number, data: UpdateUserInput) {
  const changes: UpdateUserInput = {};
  if (data.name !== undefined) changes.name = data.name;
  if (data.email !== undefined) changes.email = data.email;
  if (data.password !== undefined) changes.password = await bcrypt.hash(data.password, 12);
  if (Object.keys(changes).length === 0) throw new HttpError(400, 'Informe pelo menos um campo.');
  const user = await db.orm.public.User.where({ id }).update(changes);
  if (!user) throw new HttpError(404, 'Usuário não encontrado.');
  return user;
}

export async function deleteUser(id: number) {
  const user = await db.orm.public.User.where({ id }).delete();
  if (!user) throw new HttpError(404, 'Usuário não encontrado.');
}