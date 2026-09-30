import { prisma as db } from "../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class AuthService {
    // 1. LOGIN DE USUÁRIO
    static async login(data: any) {
        // Busca o usuário pelo e-mail
        const user = await db.orm.public.User.first({ email: data.email });
        if (!user) {
            throw new Error("Credenciais inválidas.");
        }
        // 2 Verifica se a senha está correta
        const senhaValida = await bcrypt.compare(data.password, user.password);
        if (!senhaValida) {
            throw new Error("Credenciais inválidas.");
        }
        // 3. Gera o token JWT
        const secret = process.env.JWT_SECRET || "segredo"; 
        const token = jwt.sign({
            id: user.id,
            email: user.email
        }, secret, { expiresIn: "1d" });

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        };
    }
}

