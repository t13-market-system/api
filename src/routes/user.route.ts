import express from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';
import { authMiddleware } from '../middlewares/auth.middleware';

const app = express.Router();
/**
 * @swagger
 * tags:
 *   - name: Usuários
 *     description: Operações relacionadas aos usuários
 */


/**
 * @swagger
 * /users:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [Usuários]
 *     description: Cria um novo usuário. Esta rota é pública e não necessita de autenticação.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@email.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 123456
 *
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *
 *       400:
 *         description: Erro de validação dos dados (Zod)
 *
 *       409:
 *         description: E-mail já cadastrado
 *
 *       500:
 *         description: Erro interno do servidor
 */
app.post('/users', validate(createUserSchema), UserController.createUser);


/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista todos os usuários
 *     tags: [Usuários]
 *     description: Retorna todos os usuários cadastrados. Esta rota exige autenticação.
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     nullable: true
 *                     example: João Silva
 *                   email:
 *                     type: string
 *                     example: usuario@email.com
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2026-10-01T20:00:00.000Z
 *
 *       401:
 *         description: Token não informado ou inválido
 *
 *       500:
 *         description: Erro interno do servidor
 */
app.get('/users', authMiddleware, UserController.getAllUsers);


/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Busca um usuário pelo ID
 *     tags: [Usuários]
 *     description: Retorna os dados de um usuário específico. Esta rota exige autenticação.
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do usuário
 *         schema:
 *           type: integer
 *           example: 1
 *
 *     responses:
 *       200:
 *         description: Usuário encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   nullable: true
 *                   example: João Silva
 *                 email:
 *                   type: string
 *                   example: usuario@email.com
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-10-01T20:00:00.000Z
 *
 *       400:
 *         description: ID inválido
 *
 *       401:
 *         description: Token não informado ou inválido
 *
 *       404:
 *         description: Usuário não encontrado
 *
 *       500:
 *         description: Erro interno do servidor
 */

// A Rota do POST será pública por isso não precisa do authMiddleware
app.post('/users', validate(createUserSchema), UserController.createUser);

// Rotas privadas, protegidas pelo authMiddleware
app.get('/users', authMiddleware, UserController.getAllUsers);
app.get('/users/:id', authMiddleware, UserController.getUserById);
app.put('/users/:id', authMiddleware, validate(updateUserSchema), UserController.updateUser);
app.delete('/users/:id', authMiddleware, UserController.deleteUser);

export default app;