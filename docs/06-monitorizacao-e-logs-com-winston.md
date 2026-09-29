# 📊 Monitorização e Logs Profissionais (Winston & Morgan)

> [!NOTE]  
> Usar `console.log` é ótimo para o desenvolvimento inicial, mas péssimo para produção. Em um ambiente real, precisamos de logs bem estruturados (com data, hora e níveis de severidade) para investigar bugs. Para isso, usaremos o **Winston** em conjunto com o **Morgan** (que intercepta os logs das requisições HTTP).

## 2️⃣5️⃣ Configurando o Winston (O Gerador de Logs)

O Winston é altamente personalizável. Vamos criar um "logger" que imprime as mensagens no terminal com cores diferentes e salva os avisos e erros em arquivos de texto reais.

Crie a pasta `src/config/` e adicione o arquivo `logger.ts`:

```typescript
// src/config/logger.ts
import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Formatação visual do log (Data + Nível + Mensagem)
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define onde os logs serão guardados
const transports = [
  new winston.transports.Console(), // Imprime no terminal
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }), // Guarda apenas os erros graves neste arquivo
  new winston.transports.File({ filename: 'logs/all.log' }), // Guarda todos os logs aqui
];

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  levels,
  format,
  transports,
});
```

## 2️⃣6️⃣ Configurando o Morgan (O Espião HTTP)

O Morgan é um middleware que vigia todas as requisições HTTP que chegam no seu servidor. Nós vamos configurá-lo para encaminhar essas informações diretamente para o nosso Winston, assim tudo fica centralizado.

Crie o arquivo `src/middlewares/morgan.middleware.ts`:

```typescript
// src/middlewares/morgan.middleware.ts
import morgan, { StreamOptions } from 'morgan';
import { logger } from '../config/logger';

// Substitui a saída padrão do Morgan pelo "logger.http" do nosso Winston
const stream: StreamOptions = {
  write: (message) => logger.http(message.trim()),
};

export const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);
```

## 2️⃣7️⃣ Acoplando Tudo no Servidor Principal

Agora vamos habilitar o Morgan para escutar todas as requisições globais da aplicação, e aproveitar para substituir o velho `console.log`.

Abra o arquivo `src/server.ts` e atualize a importação e configuração:

```typescript
// src/server.ts
import express from 'express';
import routes from './routes/index';
import { logger } from './config/logger'; // 👈 IMPORTANDO O WINSTON
import { morganMiddleware } from './middlewares/morgan.middleware'; // 👈 IMPORTANDO O MORGAN

const app = express();
const port = 3000;

app.use(express.json());
app.use(morganMiddleware); // 👈 LIGANDO O ESPIÃO DE REQUISIÇÕES (Sempre antes das rotas)
app.use(routes);

app.listen(port, () => {
  logger.info(`🚀 Servidor rodando na porta ${port}`); // 👈 Dando adeus ao console.log
});
```

> [!TIP]  
> **A nova forma de printar no código!**  
> A partir de agora, utilize `logger.info()`, `logger.warn()` ou `logger.error()` em qualquer lugar do seu projeto (inclusive nos seus Controllers). Além de deixar o terminal bonito e colorido, tudo ficará devidamente salvo na pasta `logs/` para análises futuras.

---
➡️ *Vamos blindar as portas do servidor? Siga para a Parte 7:* [07-seguranca-e-rate-limit.md](./07-seguranca-e-rate-limit.md)
