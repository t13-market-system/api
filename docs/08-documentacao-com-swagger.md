# 📖 Documentação Interativa com Swagger

> [!NOTE]  
> Uma API não está 100% pronta até que os outros desenvolvedores (ou o time de Frontend) saibam como usá-la! O **Swagger** permite criar uma interface gráfica maravilhosa e interativa, onde qualquer pessoa pode ler a documentação das rotas, ver os formatos esperados e testá-las diretamente pelo navegador, sem precisar abrir ferramentas complexas como o Postman.

## 3️⃣0️⃣ Instalando as Bibliotecas do Swagger

Para gerar essa interface dinâmica a partir do nosso próprio código, precisaremos instalar as bibliotecas base e suas respectivas tipagens para TypeScript. 

No seu terminal (dentro da pasta do projeto), rode:

```bash
npm install swagger-ui-express swagger-jsdoc
npm install -D @types/swagger-ui-express @types/swagger-jsdoc
```

## 3️⃣1️⃣ Configuração Principal do Swagger

Nesta etapa, nós criamos as "instruções" para o Swagger, definindo o título da nossa documentação, a versão e os métodos de segurança (para suportar o nosso botão de "cadeado" do JWT Token).

Crie a pasta `src/config/` (se não existir) e adicione o arquivo `swagger.ts`:

```typescript
// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Minha API Profissional (Node + Prisma 8)',
      version: '1.0.0',
      description: 'Documentação oficial e interativa da nossa API RESTful.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor Local de Desenvolvimento',
      },
    ],
    components: {
      // Configuração para permitir inserir o Bearer Token pelo botão "Authorize"
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // O Swagger vai varrer todos os arquivos ".ts" dentro de "routes/" buscando os nossos comentários
  apis: ['./src/routes/*.ts'], 
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Cria a rota /api-docs que renderiza a tela gráfica do Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
```

## 3️⃣2️⃣ Acoplando o Swagger no Servidor

Agora que o módulo está configurado, precisamos injetá-lo no fluxo principal da aplicação.

Abra `src/server.ts` e atualize:

```typescript
// src/server.ts
import express from 'express';
// ... (outros imports de segurança e rotas)
import { setupSwagger } from './config/swagger'; // 👈 IMPORTANDO O MÓDULO DO SWAGGER

const app = express();
const port = 3000;

// ... (configurações do Helmet, CORS, Limiters, app.use(routes))

// 📖 Inicia a documentação gráfica
setupSwagger(app);

app.listen(port, () => {
  logger.info(`🚀 Servidor rodando na porta ${port}`);
  logger.info(`📖 Documentação disponível em http://localhost:${port}/api-docs`); // 👈 NOVO AVISO
});
```

## 3️⃣3️⃣ Comentando as Rotas (A Mágica Final)

Como o Swagger sabe quais são as nossas rotas, quais campos elas exigem e o que retornam? Simples: Nós escrevemos comentários especiais no formato **JSDoc (YAML)** logo acima de cada endpoint. O Swagger lê isso e desenha os formulários visuais sozinho!

Vá no seu arquivo `src/routes/auth.route.ts` e cole este bloco de comentário logo acima da rota de login:

```typescript
// src/routes/auth.route.ts

// ... imports e const app ...

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Autentica o usuário e retorna o Token JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: usuario@email.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login bem sucedido (Retorna o Token)
 *       400:
 *         description: Erro de formatação dos dados (Zod)
 *       401:
 *         description: Credenciais inválidas
 */
app.post('/login', validate(loginSchema), AuthController.login);
```

> [!TIP]  
> **A Mágica Aconteceu!** ✨  
> Reinicie o seu servidor com o `npm run dev` e acesse no navegador: `http://localhost:3000/api-docs`. 
> 
> Você verá uma interface incrivelmente profissional. Se você clicar na rota `/login`, pode até clicar em **"Try it out"**, digitar seu e-mail e senha ali mesmo, e apertar Execute! Depois, basta copiar o token devolvido, clicar no botão verde gigante **"Authorize"** no topo da tela, colar o token, e você ganha passe livre (VIP) para testar as rotas privadas sem usar uma única linha de código.

---
➡️ *Chegou a hora do "seguro de vida"! Siga para a Parte 9:* [09-testes-automatizados-vitest.md](./09-testes-automatizados-vitest.md)
