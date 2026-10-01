import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
    // POST - login de usuário
    static async login(req: Request, res: Response) {
        try{
            const { email, password } = req.body;
            const result = await AuthService.login({ email, password });
            
            // Salvando o token em um cookie HTTP Only
            res.cookie('token', result.token, {
                httpOnly: true,       // Protege contra XSS (não pode ser lido via document.cookie)
                secure: false,        // Use 'true' em produção se tiver HTTPS
                sameSite: 'lax',      // Bom para segurança entre mesma origem
                maxAge: 24 * 60 * 60 * 1000 // 1 dia
            });

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Erro ao fazer login:', error);
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
    }
}