<!-- Documento: docs/06-monitorizacao-e-logs-com-winston.md -->

# 06 · Logs com Winston e Morgan

[← Anterior](05-autenticacao-com-jwt.md) · [Índice](../README.md) · **Etapa 6 de 11** · [Próxima →](07-seguranca-e-rate-limit.md)

**Ponto de partida:** conclua o capítulo anterior antes de continuar. Todos os caminhos abaixo partem da raiz da sua API, a pasta que contém `package.json`. Crie as subpastas indicadas no editor quando ainda não existirem.

## Resultado desta etapa

Logs legíveis no terminal e JSON em arquivos, sem remover cookies, CORS, rotas ou tratamento de erros.

## 1. Criar o logger

**Propósito do passo:** Um log é um registro do que ocorreu na aplicação. Vamos preparar um registrador que mostre mensagens no terminal e salve arquivos para consultar depois.

**Arquivo: `src/config/logger.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Configura o Winston, os níveis de mensagens e os arquivos onde os registros serão gravados.

<!-- file: src/config/logger.ts -->
```typescript
// Arquivo: src/config/logger.ts
import winston from 'winston';
import { env } from './env.js';

const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
winston.addColors({ error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'white' });

export const logger = winston.createLogger({
  levels,
  level: env.NODE_ENV === 'production' ? 'http' : 'debug',
  silent: env.NODE_ENV === 'test',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: env.NODE_ENV === 'test' ? [] : [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5242880, maxFiles: 3 }),
    new winston.transports.File({ filename: 'logs/all.log', maxsize: 5242880, maxFiles: 3 }),
  ],
});
```

O nível inclui `http` também em produção. O ambiente da etapa 1 tem padrão `development`; não dependemos de uma variável ausente para decidir se os logs aparecem. Cores ficam apenas no console; os arquivos preservam JSON. A rotação limita o crescimento local, mas não substitui uma política de retenção em produção.

## 2. Criar middleware de logs HTTP

**Propósito do passo:** Morgan observa os pedidos HTTP e envia informações resumidas ao Winston. Isso permite saber qual rota foi acessada, qual resposta saiu e quanto tempo demorou.

**Arquivo: `src/middlewares/morgan.middleware.ts`**

Crie este arquivo e copie todo o conteúdo abaixo. Registra um resumo de cada pedido HTTP sem copiar corpo, senhas, tokens ou cookies.

<!-- file: src/middlewares/morgan.middleware.ts -->
```typescript
// Arquivo: src/middlewares/morgan.middleware.ts
import morgan from 'morgan';
import { logger } from '../config/logger.js';

morgan.token('safe-path', req => (req.url ?? '/').split('?')[0]);
export const morganMiddleware = morgan(
  ':method :safe-path :status :response-time ms',
  { stream: { write: message => logger.http(message.trim()) } },
);
```

Registramos método, caminho sem query string, status e duração. Não registre corpo, senha, JWT, cookies ou cabeçalho Authorization.

Os parâmetros após `?` na URL são chamados query string; eles são retirados do caminho gravado. Por exemplo, um acesso a `/users?filtro=exemplo` registra apenas `/users`. O tempo registrado é a duração do atendimento do pedido, em milissegundos.

## 3. Substituir o middleware central de erros

**Propósito do passo:** Vamos trocar a impressão de erros no console pelo registro centralizado. As respostas HTTP já implementadas permanecem, e os registros evitam copiar informações sensíveis das exceções.

**Arquivo: `src/middlewares/error.middleware.ts`**

Substitua todo o conteúdo do arquivo existente. Converte erros em respostas HTTP e evita devolver detalhes internos ao cliente. Deve ser registrado depois das rotas.

<!-- file: src/middlewares/error.middleware.ts -->
```typescript
// Arquivo: src/middlewares/error.middleware.ts
import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../lib/http-error.js';
import { logger } from '../config/logger.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (typeof error === 'object' && error !== null && 'sqlState' in error && error.sqlState === '23505') {
    res.status(409).json({ error: 'Este e-mail já está em uso.' });
    return;
  }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    if (error.status === 400) {
      res.status(400).json({ error: 'JSON inválido.' });
      return;
    }
    if (error.status === 413) {
      res.status(413).json({ error: 'Corpo da requisição muito grande.' });
      return;
    }
  }
  logger.error('Erro interno na API.', {
    errorType: error instanceof Error ? error.name : 'unknown',
    sqlState: typeof error === 'object' && error !== null && 'sqlState' in error ? error.sqlState : undefined,
  });
  res.status(500).json({ error: 'Erro interno do servidor.' });
};
```

Os logs também evitam despejar exceções inteiras que possam carregar SQL, parâmetros ou credenciais. Erros operacionais esperados, como 404 e 409, continuam respondendo com seus próprios status.

## 4. Substituir a aplicação e o servidor

**Propósito do passo:** O registro de pedidos só funciona se estiver ligado à aplicação. Também vamos registrar a inicialização e o encerramento do servidor para identificar essas situações nos logs.

**Arquivo: `src/app.ts`**

Substitua todo o conteúdo do arquivo existente. Configura o Express e os caminhos pelos quais os pedidos serão atendidos. Este arquivo será atualizado ao conectar novos recursos do guia.

<!-- file: src/app.ts -->
```typescript
// Arquivo: src/app.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { morganMiddleware } from './middlewares/morgan.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const app = express();
app.use(morganMiddleware);
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: '16kb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(routes);
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(errorHandler);
```

**Arquivo: `src/server.ts`**

Substitua todo o conteúdo do arquivo existente. Inicia a escuta na porta configurada. A aplicação fica em app.ts para que os testes possam importá-la separadamente.

<!-- file: src/server.ts -->
```typescript
// Arquivo: src/server.ts
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { db } from './prisma/db.js';

const server = app.listen(env.PORT, () => {
  logger.info(`API disponível em http://localhost:${env.PORT}`);
});
const shutdown = () => {
  server.close(() => {
    void db.close().then(() => {
      logger.info('Servidor encerrado.');
      process.exit(0);
    }).catch(() => process.exit(1));
  });
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
```

## 5. Conferir os registros

**Propósito do passo:** Vamos fazer um pedido válido e outro para uma rota ausente. Ambos precisam aparecer no arquivo de acessos, o que confirma que os registros não dependem apenas de erros internos.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm run typecheck
npm run dev
```

Em outro terminal:

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
curl.exe -i http://localhost:3000/health
curl.exe -i http://localhost:3000/rota-inexistente
```

Espere 200 e 404. Veja as entradas HTTP no console e em `logs/all.log`. Esses acessos **não** devem gerar um erro em `logs/error.log`; o arquivo de erros pode permanecer vazio. Confira que login e cookie continuam funcionando após a substituição de `app.ts`.

Abra `logs/all.log` no editor dentro da pasta da API. Cada linha é um registro JSON; procure `GET /health 200` e `GET /rota-inexistente 404`. A pasta e os arquivos são criados automaticamente pelo logger; você não precisa criar um log vazio ou escrever manualmente nele.

## Conferência antes de avançar

- [ ] Log de inicialização visível.
- [ ] Acessos 200 e 404 registrados em `all.log`.
- [ ] Arquivos sem códigos de cor e sem tokens/senhas.
- [ ] CORS e cookies preservados.
- [ ] Pasta `logs/` ignorada pelo Git.

Referências: [Winston](https://github.com/winstonjs/winston) · [Morgan](https://expressjs.com/en/resources/middleware/morgan.html).

[← Anterior](05-autenticacao-com-jwt.md) · [07 · Segurança e limites →](07-seguranca-e-rate-limit.md)
