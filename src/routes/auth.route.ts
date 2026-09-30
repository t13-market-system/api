import  express  from 'express';
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema } from "../schemas/auth.schema";

const app = express.Router();

// 📍 Rota de Login protegida pelo Zod
app.post('/login', validate(loginSchema), AuthController.login);

export default app;

