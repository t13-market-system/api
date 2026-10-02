<!-- Documento: docs/07-seguranca-e-rate-limit.md -->

# 07 · Cabeçalhos, origens e limite de requisições

[← Anterior](06-monitorizacao-e-logs-com-winston.md) · [Índice](../README.md) · **Etapa 7 de 11** · [Próxima →](08-documentacao-com-swagger.md)

**Ponto de partida:** conclua o capítulo anterior antes de continuar. Todos os caminhos abaixo partem da raiz da sua API, a pasta que contém `package.json`. Crie as subpastas indicadas no editor quando ainda não existirem.

## Resultado desta etapa

Helmet, limites separados para API e login, política de origem explícita e autenticação por cookie preservada.

**Cabeçalhos HTTP** são informações enviadas junto do corpo do pedido ou da resposta. Helmet acrescenta cabeçalhos de proteção nas respostas. Um **preflight** é um pedido `OPTIONS` que o navegador pode enviar antes de uma operação entre origens diferentes, para conferir se a operação é permitida.

## 1. Criar os limitadores

**Propósito do passo:** Um limitador conta os pedidos de cada endereço IP em um intervalo. Usaremos um limite geral e outro mais restrito para tentativas de login sem sucesso.

**Arquivo: `src/middlewares/rateLimit.middleware.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Define os limites de pedidos por IP e de tentativas de login sem sucesso.

<!-- file: src/middlewares/rateLimit.middleware.ts -->
```typescript
// Arquivo: src/middlewares/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Limite de requisições excedido. Tente novamente mais tarde.' },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' },
});
```

O limite geral é por IP, de 100 requisições por 15 minutos. O login permite até cinco respostas sem sucesso por IP na janela. Limites globais não substituem autorização nem garantem proteção contra todo ataque de negação de serviço.

## 2. Rejeitar origens desconhecidas em escritas

**Propósito do passo:** A origem identifica o endereço do site que fez o pedido. Vamos recusar escritas de sites desconhecidos, além da verificação já feita nas operações autenticadas por cookie.

CORS controla o que o **navegador** pode ler. Ele não é autenticação e não impede todos os clientes HTTP de enviar requisições. Por isso, adicionamos uma verificação explícita de `Origin` em métodos que alteram dados.

**Arquivo: `src/middlewares/origin.middleware.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Recusa pedidos de escrita que informem uma origem fora da lista permitida.

<!-- file: src/middlewares/origin.middleware.ts -->
```typescript
// Arquivo: src/middlewares/origin.middleware.ts
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';

export const originGuard: RequestHandler = (req, res, next) => {
  const origin = req.get('origin');
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (unsafe && origin !== undefined && ![env.FRONTEND_ORIGIN, env.API_ORIGIN].includes(origin)) {
    res.status(403).json({ error: 'Origem não permitida.' });
    return;
  }
  next();
};
```

Clientes como curl com Bearer podem não enviar `Origin`. Nas **rotas autenticadas por cookie**, o middleware do capítulo 5 continua exigindo uma origem confiável em mutações. Não remova essa verificação.

## 3. Substituir `src/app.ts` completo

**Propósito do passo:** A ordem das funções de proteção importa. Vamos colocá-las antes das rotas e manter a resposta de disponibilidade acessível mesmo quando o limite geral for atingido.

**Arquivo: `src/app.ts`**

Substitua todo o conteúdo do arquivo existente. Configura o Express e os caminhos pelos quais os pedidos serão atendidos. Este arquivo será atualizado ao conectar novos recursos do guia.

<!-- file: src/app.ts -->
```typescript
// Arquivo: src/app.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import routes from './routes/index.js';
import { env } from './config/env.js';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { morganMiddleware } from './middlewares/morgan.middleware.js';
import { originGuard } from './middlewares/origin.middleware.js';
import { limiter, loginLimiter } from './middlewares/rateLimit.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const app = express();
app.use(morganMiddleware);
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : {
    directives: { 'upgrade-insecure-requests': null },
  },
}));
app.use(corsMiddleware);
app.use(originGuard);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(limiter);
app.use('/login', loginLimiter);
app.use(cookieParser());
app.use(express.json({ limit: '16kb' }));
app.use(routes);
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(errorHandler);
```

| Ordem | Motivo |
|---|---|
| Logs antes das respostas | Registrar também rejeições e limites |
| Helmet e CORS | Definir cabeçalhos; responder preflight antes dos limites |
| Guarda de origem | Rejeitar escrita de origem desconhecida |
| `/health` antes do limite | Não bloquear a verificação de disponibilidade por excesso na API |
| Limites antes do JSON | Evitar parse desnecessário em requisições bloqueadas |
| Cookie parser antes das rotas | Permitir autenticação por cookie |
| Middleware de erros por último | Tratar falhas das funções executadas anteriormente |

`/health` comprova que HTTP responde; não comprova que o banco está acessível. A confirmação estrutural do banco continua sendo `prisma db verify`.

## 4. Testar cabeçalhos, preflight e origem

**Propósito do passo:** Vamos observar os cabeçalhos de proteção, a permissão para o navegador e o bloqueio de uma origem desconhecida. Depois repetiremos um login inválido para conferir o limite.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm run typecheck
```

Com o servidor aberto, execute no CMD:

Se ele estiver parado, execute `npm run dev` no primeiro terminal. Nos pedidos abaixo, `Origin` simula o endereço da página, e os cabeçalhos `Access-Control-Request-*` simulam a pergunta de permissão feita pelo navegador.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
curl.exe -i http://localhost:3000/health
curl.exe -i -X OPTIONS -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" http://localhost:3000/login
curl.exe -i -H "Origin: https://origem-desconhecida.example" -H "Content-Type: application/json" -d "{}" http://localhost:3000/login
```

Espere cabeçalhos do Helmet, preflight 204 com a origem permitida e `Access-Control-Allow-Credentials: true`, e escrita rejeitada com 403.

Para testar o limite de login, use um e-mail inexistente, em um servidor recém-iniciado:

No primeiro terminal, pare `npm run dev` com Ctrl+C e inicie-o novamente com o mesmo comando. Não altere os limites para fazer o teste passar. No segundo CMD, execute o laço abaixo: ele envia o mesmo login incorreto seis vezes, uma após a outra.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
for /L %i in (1,1,6) do @curl.exe -i -H "Content-Type: application/json" -d "{\"email\":\"inexistente@example.com\",\"password\":\"SenhaErrada\"}" http://localhost:3000/login
```

> **💡 Dica**
>
> No CMD interativo, use `%i` como acima. Em um arquivo `.bat`, use `%%i`. Cada chamada mostra seus próprios cabeçalhos e status. O resultado esperado é cinco respostas 401 e a sexta 429. Se houve outras tentativas na janela, o bloqueio pode chegar antes.

O armazenamento padrão fica em memória. Reiniciar o servidor local limpa os contadores; em produção com múltiplas instâncias, use um armazenamento compartilhado suportado pelo pacote. Não configure `trust proxy: true` indiscriminadamente: configure os proxies reais para que os IPs usados pelo limite sejam confiáveis.

## Conferência antes de avançar

- [ ] CORS mantém origens explícitas e credenciais.
- [ ] Preflight não exige token.
- [ ] Helmet aparece nas respostas.
- [ ] Origem desconhecida em escrita retorna 403.
- [ ] Excesso de login retorna 429.
- [ ] Login e autenticação por cookie continuam funcionando.

Referências: [Helmet](https://helmetjs.github.io/) · [express-rate-limit](https://express-rate-limit.mintlify.app/overview) · [CORS](https://expressjs.com/en/resources/middleware/cors.html).

[← Anterior](06-monitorizacao-e-logs-com-winston.md) · [08 · Swagger →](08-documentacao-com-swagger.md)
