import express from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes/index';
import { corsMiddleware } from './middlewares/cors.middleware';

const app = express();
const port = 3000;

app.use(corsMiddleware); // Nosso middleware de CORS
app.use(cookieParser()); // Middleware para ler cookies

app.use(express.json());
app.use(routes);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});