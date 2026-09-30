import { Request , Response , NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token nao fornecido' });
    }
    const [, token] = authHeader.split(' ');
    try {
        const secret = process.env.JWT_SECRET || 'chave-secreta-fallback';
        const decoded = jwt.verify(token, secret);
        (req as any).user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({ error: ' Token Inválido ou Expirado' });
    }
};