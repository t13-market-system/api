import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
    // POST - login de usuário
    static async login(req: Request, res: Response) {
        try{
            const { email, password } = req.body;
            const result = await AuthService.login({ email, password });
            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Erro ao fazer login:', error);
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
    }
}