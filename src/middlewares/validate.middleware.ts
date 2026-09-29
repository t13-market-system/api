import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export const validate = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 🛡️ Valida a requisição contra o schema definido
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next(); // Se estiver tudo certo, permite que a requisição siga para o Controller
    } catch (error) {
      if (error instanceof ZodError) {
        // Formata os erros do Zod para uma resposta mais amigável
        const formattedErrors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        return res.status(400).json({ errors: formattedErrors });
      }
      return res.status(500).json({ error: 'Erro interno na validação dos dados.' });
    }
  };
};