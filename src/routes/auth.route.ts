import  express  from 'express';
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema } from "../schemas/auth.schema";

const app = express.Router();

// src/routes/auth.route.ts

// ... imports e const app ...

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Autentica o usuário e retorna o Token JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: usuario@email.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login bem sucedido (Retorna o Token)
 *       400:
 *         description: Erro de formatação dos dados (Zod)
 *       401:
 *         description: Credenciais inválidas
 */




// 📍 Rota de Login protegida pelo Zod
app.post('/login', validate(loginSchema), AuthController.login);

export default app;

