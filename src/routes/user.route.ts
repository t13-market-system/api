import express from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';

const app = express.Router();

// Rotas de Usuários
app.post('/users', validate(createUserSchema), UserController.createUser);
app.get('/users', UserController.getAllUsers);
app.get('/users/:id', UserController.getUserById);
app.put('/users/:id', validate(updateUserSchema), UserController.updateUser);
app.delete('/users/:id', UserController.deleteUser);

export default app;