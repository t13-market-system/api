import { Router } from 'express';
import userRoutes from './user.route';
import clienteRoutes from './cliente.route';
import authRoutes from './auth.route'; // Importe a rota de autenticação


const routes = Router();


routes.use(userRoutes);
routes.use(authRoutes); // Adicionei a rota de autenticação aqui

routes.use(clienteRoutes);


// routes.use('/testes', testeRoutes);

export default routes;
