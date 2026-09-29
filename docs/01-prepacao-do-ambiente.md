# 🛠️ Preparação do Ambiente

> [!NOTE]  
> Este guia pressupõe que você já tenha o Node.js instalado. Vamos configurar uma API moderna usando Express e a versão mais recente do Prisma (Prisma 8).

## 1️⃣ Criação do `package.json`

O arquivo `package.json` é o coração do seu projeto Node.js, responsável por gerenciar todas as dependências e scripts.

> [!IMPORTANT]  
> Abra o **Prompt de Comando (CMD)** sem acesso de administrador na pasta raiz do seu projeto e execute o comando abaixo (a flag `-y` pula as perguntas e preenche tudo com o padrão):

```bash
npm init -y
```

## 2️⃣ Instalação das Dependências (Produção)

Agora vamos instalar o "motor" da nossa aplicação. Estas são as bibliotecas que rodarão no servidor final:

```bash
npm install express pg @prisma/client bcrypt jsonwebtoken zod helmet cors express-rate-limit morgan winston temporal-polyfill
```

**O que estamos instalando?**
- 🗄️ **Core & BD**: `express` (rotas), `@prisma/client` e `pg` (comunicação com PostgreSQL).
- 🛡️ **Segurança**: `helmet`, `cors` e `express-rate-limit`.
- 🔐 **Autenticação**: `bcrypt` (criptografia) e `jsonwebtoken` (tokens).
- 📝 **Validação & Logs**: `zod`, `morgan`, `winston` e `temporal-polyfill`.

## 3️⃣ Instalação das Dependências (Desenvolvimento)

Como estamos usando TypeScript, precisamos instalar suas tipagens (`@types/*`) e ferramentas para rodar o código localmente.

```bash
npm install -D prisma typescript @types/node @types/express @types/bcrypt @types/jsonwebtoken @types/cors @types/morgan tsx @prisma/orm-postgres dotenv
```

## 4️⃣ Configuração do TypeScript

O TypeScript precisa de um "manual de instruções". Vamos criar o arquivo `tsconfig.json`:

```bash
npx tsc --init
```

Após criar o arquivo, substitua todo o conteúdo dele por esta configuração moderna e otimizada:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "prisma/**/*"]
}
```

## 5️⃣ Inicializar o Prisma 8

Agora, vamos preparar a fundação do nosso banco de dados utilizando a nova CLI do Prisma 8 (Prisma Next).

```bash
npx prisma orm init --target postgres
```

> [!TIP]  
> **O que acabou de ser gerado?**
> - **Pasta `prisma/` com `contract.prisma`:** No Prisma 8, este arquivo é o coração do seu banco. É onde "desenhamos" os modelos usando a sintaxe atualizada. *(Nota: Se a CLI criou a pasta dentro de `src/`, você pode movê-la para a raiz para manter o padrão deste tutorial).*
> - **Arquivo `prisma.config.ts` na raiz:** Configuração principal do Prisma.
> - **Arquivo `.env.example` na raiz:** Modelo de variáveis de ambiente.

> [!WARNING]  
> **Segurança:** Renomeie `.env.example` para `.env`. Este arquivo guarda credenciais sensíveis (como a URL do banco). Ele **NUNCA** deve ser enviado para o GitHub! Certifique-se de que a palavra `.env` está listada no seu `.gitignore`.

## 6️⃣ Scripts de Execução

Para facilitar, vamos criar "atalhos" no `package.json`. Substitua a seção `"scripts"` pelo código abaixo:

```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1",
  "postinstall": "prisma skills sync || exit 0",
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js"
}
```

- 🟢 **`npm run dev`**: O seu melhor amigo! Usa o `tsx watch` para rodar e reiniciar o servidor automaticamente a cada salvamento (Hot-Reload).
- 🛠️ **`npm run build`**: Traduz todo o TypeScript (`.ts`) para JavaScript (`.js`) na pasta `dist/`.
- 🚀 **`npm start`**: Executa o código final de produção.

## 7️⃣ Criando o Ponto de Entrada (`server.ts`)

Crie uma pasta chamada `src/` na raiz do projeto, e dentro dela o arquivo `server.ts`:

```typescript
// src/server.ts
import express from 'express';

const app = express();
const port = 3000;

app.use(express.json());

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
```

> [!TIP]  
> **Hora de testar!** No CMD, digite `npm run dev`. Se aparecer *"🚀 Servidor rodando na porta 3000"*, sua API está viva! 🎉

## 8️⃣ Variáveis de Ambiente (`.env`)

Abra (ou crie) o arquivo `.env` na raiz e configure suas credenciais:

```env
DATABASE_URL="sua_url_de_conexao_do_postgresql_neon_aqui"
JWT_SECRET="sua_chave_secreta_para_os_tokens_aqui"
```

> [!NOTE]  
> - **DATABASE_URL**: Obtenha no dashboard do Neon Postgres.
> - **JWT_SECRET**: Use uma string aleatória forte (Ex: `@1093b^2&Fh#j*zU`).

---
➡️ *Tudo pronto! Siga para a Parte 2:* [02-modelagem-e-sincronizacao-com-prisma.md](./02-modelagem-e-sincronizacao-com-prisma.md)
