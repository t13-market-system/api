import express from 'express';
import { UserController } from '../controllers/user.controller';

const app = express.Router();

// Rotas de Usuários
app.post('/users', UserController.createUser);
app.get('/users', UserController.getAllUsers);
app.get('/users/:id', UserController.getUserById);
app.put('/users/:id', UserController.updateUser);
app.delete('/users/:id', UserController.deleteUser);

export default app;