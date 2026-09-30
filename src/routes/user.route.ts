import express from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';
import { authMiddleware } from '../middlewares/auth.middleware';

const app = express.Router();

// A Rota do POST será pública por isso não precisa do authMiddleware
app.post('/users', validate(createUserSchema), UserController.createUser);

// Rotas privadas, protegidas pelo authMiddleware
app.get('/users', authMiddleware, UserController.getAllUsers);
app.get('/users/:id', authMiddleware, UserController.getUserById);
app.put('/users/:id', authMiddleware, validate(updateUserSchema), UserController.updateUser);
app.delete('/users/:id', authMiddleware, UserController.deleteUser);

export default app;