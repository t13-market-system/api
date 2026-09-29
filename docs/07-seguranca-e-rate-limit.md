# 🛡️ Segurança: Rate Limit, Helmet e CORS

> [!NOTE]  
> Nossa API está funcional e sendo monitorada perfeitamente. Mas, se for colocada na internet do jeito que está, ela fica vulnerável a ataques de força bruta, negação de serviço (DDoS) e chamadas não autorizadas de outros sites. Para trancar essas portas, vamos usar três pacotes incríveis que **já instalamos** lá no Passo 1: `express-rate-limit`, `helmet` e `cors`.

## 2️⃣8️⃣ O Limitador de Requisições (Rate Limit)

O `express-rate-limit` funciona como um porteiro da balada. Se a mesma pessoa (mesmo IP) tentar entrar várias vezes por segundo (o que pode ser um ataque DDoS ou de força bruta para descobrir senhas), ele bloqueia temporariamente aquele IP.

Crie o arquivo `src/middlewares/rateLimit.middleware.ts`:

```typescript
// src/middlewares/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita cada IP a 100 requisições por janela de 15 minutos
  message: {
    error: 'Muitas requisições deste IP. Por favor, tente novamente mais tarde.',
  },
  standardHeaders: true, // Retorna os headers de limite (RateLimit-*)
  legacyHeaders: false, // Desabilita os headers antigos (X-RateLimit-*)
});
```

> [!TIP]  
> Se quiser, você pode criar regras mais severas apenas para a rota de `/login` (ex: bloquear após 5 tentativas erradas), importando o `rateLimit` direto no `auth.route.ts`. Mas aqui, aplicaremos no servidor inteiro!

## 2️⃣9️⃣ Blindando a Aplicação (Helmet e CORS)

- **Helmet**: Adiciona vários cabeçalhos (headers) HTTP que fecham brechas conhecidas de segurança (como esconder que a API foi feita em Express).
- **CORS**: Define quais sites (domínios) têm permissão para fazer requisições para a nossa API pelo navegador.

Abra o arquivo `src/server.ts` e adicione essas camadas logo no começo:

```typescript
// src/server.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { limiter } from './middlewares/rateLimit.middleware';
import routes from './routes/index';
import { logger } from './config/logger';
import { morganMiddleware } from './middlewares/morgan.middleware';

const app = express();
const port = 3000;

// 🛡️ 1. Helmet (Proteção de Cabeçalhos HTTP)
app.use(helmet());

// 🌍 2. CORS (Quem pode acessar a API)
app.use(cors({
  origin: '*', // Em produção, troque '*' pelo URL do seu site (ex: 'https://meusite.com')
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// ⏱️ 3. Rate Limit (Proteção contra DDoS)
app.use(limiter);

// 📦 Outros Middlewares e Rotas
app.use(express.json());
app.use(morganMiddleware);
app.use(routes);

app.listen(port, () => {
  logger.info(`🚀 Servidor rodando na porta ${port}`);
});
```

> [!IMPORTANT]  
> **A Ordem Importa!**  
> Repare que colocamos a segurança ANTES de todas as rotas e até mesmo do `express.json()`. Se a requisição for maliciosa, o Rate Limit, Helmet ou o CORS já vão barrá-la imediatamente, poupando processamento e mantendo seu servidor rápido!

---
➡️ *Quer ver a sua API brilhar na internet? Siga para a Parte 8:* [08-documentacao-com-swagger.md](./08-documentacao-com-swagger.md)
