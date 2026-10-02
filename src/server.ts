import express from 'express';
import helmet from 'helmet';
import { limiter } from './middlewares/rateLimit.middleware';
import cookieParser from 'cookie-parser';
import routes from './routes/index';
import { corsMiddleware } from './middlewares/cors.middleware';
import { morganMiddleware } from './middlewares/morgan.middleware';
import { logger } from './config/logger';
import { setupSwagger } from './config/swagger';

const app = express();
const port = 3000;

//Obs: Repare que a ordem dos middlewares importa, 
// por isso o corsMiddleware deve vir antes das rotas, 
// e por isso também e o morganMiddleware deve vir antes do 
// corsMiddleware para logar todas as requisições, incluindo as de CORS.

app.use(helmet()); // Middleware de segurança
app.use(limiter); // Middleware de rate limiting
app.use(corsMiddleware); // Nosso middleware de CORS
app.use(cookieParser()); // Middleware para ler cookies
app.use(morganMiddleware); // Middleware para logar requisições
setupSwagger(app);
app.use(express.json());
app.use(routes);

app.listen(port, () => {
  logger.info(`Servidor rodando na porta ${port}`);
  logger.info(`Documentação da API disponível em http://localhost:${port}/api-docs`);
});


// A partir de agorora sempre que precisarmos printar 
// algo no console iremos usar o logger, que já está configurado para logar em arquivo e no console.
// exemplo: logger.info('Mensagem de log'); ou logger.error('Mensagem de erro');