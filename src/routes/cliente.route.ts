import express from 'express';
import { ClienteController } from '../controllers/cliente.controller';

const app = express.Router();

// Rotas de Clientes
app.post('/clientes', ClienteController.createCliente);
app.get('/clientes', ClienteController.getAllClientes);
app.get('/clientes/:id', ClienteController.getClienteById);
app.put('/clientes/:id', ClienteController.updateCliente);
app.delete('/clientes/:id', ClienteController.deleteClientes);
export default app;