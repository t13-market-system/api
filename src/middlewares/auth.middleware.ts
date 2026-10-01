import { Request , Response , NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Busca o token nos cookies ou no header Authorization
    let token = req.cookies?.token;

    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            [, token] = authHeader.split(' ');
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Token nao fornecido' });
    }
    
    try {
        const secret = process.env.JWT_SECRET || 'chave-secreta-fallback';
        const decoded = jwt.verify(token, secret);
        (req as any).user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({ error: ' Token Inválido ou Expirado' });
    }
};