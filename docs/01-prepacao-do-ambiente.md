# Preparação do Ambiente

# 1 - Criação do package.json
O comando abaixo cria o arquivo package.json, que é o arquivo que vai guardar as dependências do projeto.
No terminal do VS Code, execute o comando abaixo (a flag -y pula as perguntas e preenche tudo com o padrão):
```bash
npm init -y
```

# 2 - Instalação das dependências principais (produção)

Agora vamos instalar o "motor" da nossa aplicação. Essas são as bibliotecas que rodarão no servidor final:

```bash
npm install express pg @prisma/client bcrypt jsonwebtoken zod helmet cors express-rate-limit morgan winston
```
Core & Banco de dados: express (rotas), @prisma/client e pg (comunicação com banco PostgreSQL).

Segurança: helmet, cors e express-rate-limit.

Autenticação: bcrypt (criptografia) e jsonwebtoken (tokens de acesso).

Validação & Logs: zod (validação de dados), morgan e winston (registro de atividades e erros).

# 3 - Instalação das dependências de desenvolvimento

Como estamos usando TypeScript, precisamos ensinar a ele como as bibliotecas acima funcionam. Também instalaremos ferramentas que nos ajudarão apenas na hora de programar.

```bash
npm install -D prisma typescript @types/node @types/express @types/bcrypt @types/jsonwebtoken @types/cors @types/morgan tsx
```

# 4 - Configuração do TypeScript
O TypeScript precisa de um "manual de instruções". Vamos criar o arquivo tsconfig.json rodando:

```bash
npx tsc --init
```

Após criar o arquivo tsconfig.json, substitua todo o conteúdo dele por esta configuração moderna e otimizada:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

## Passo 5: Inicializar o Prisma (Interface com o Banco)

Agora, vamos preparar a fundação do nosso banco de dados. Ao rodar o comando abaixo, o Prisma criará uma pasta chamada prisma com o arquivo schema.prisma e também um arquivo .env na raiz do projeto.

```bash
npx prisma init
```
O que acabou de ser gerado no seu projeto?

Pasta prisma/ com contract.prisma: No Prisma v8, este arquivo é o coração da base de dados da nossa aplicação. É nele que vamos "desenhar" as nossas tabelas (modelos) utilizando a sintaxe atualizada do Prisma.

Arquivo .env na raiz: Este arquivo guarda as nossas Variáveis de Ambiente. É aqui que colocaremos o URL secreto de ligação à nossa base de dados PostgreSQL (neste caso, usando o Neon).

🚨 Aviso de Segurança Crucial: O arquivo .env contém informações sensíveis, como senhas e chaves secretas. Ele NUNCA deve ser enviado para o GitHub! Certifique-se sempre de que a palavra .env está listada dentro do arquivo .gitignore.

## Passo 6: Configurar os Scripts de Execução

Para facilitar a vida na hora de rodar o projeto, vamos criar "atalhos" no arquivo `package.json`. Em vez de digitar comandos longos no terminal todas as vezes, usaremos estes scripts.

Abra o seu arquivo `package.json` e substitua a seção `"scripts"` (que provavelmente tem um script de teste padrão) por este código:

```json
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
```

  Entendendo os comandos:

npm run dev: O seu melhor amigo durante as aulas! Ele usa o tsx watch para rodar o nosso arquivo principal (src/server.ts) e fica "vigiando" o código. Se você salvar qualquer alteração, ele reinicia o servidor automaticamente sem precisarmos parar e rodar de novo.

npm run build: Usa o TypeScript Compiler (tsc) para traduzir todo o nosso código TypeScript (.ts) para JavaScript puro (.js), guardando o resultado final na pasta dist/.

npm start: É o comando usado quando o projeto vai para "produção" (quando for publicado na internet). Ele executa o código JavaScript final que foi gerado pelo comando build.

## Passo 7: Escrever o Código do server.ts

Chegou a hora de escrevermos o nosso código! Vamos criar o ponto de entrada da nossa API, o arquivo responsável por iniciar o servidor.

  Crie uma pasta chamada `src` na raiz do seu projeto e, dentro dela, crie o arquivo `server.ts`. Adicione o seguinte código:

```typescript
import express from 'express';

const app = express();
const port = 3000;

app.use(express.json());

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});

```

💡 Hora de Testar!
Lembra-se do atalho que configurámos no passo anterior? Abra o terminal e digite npm run dev. Se aparecer a mensagem "🚀 Servidor rodando na porta 3000" no terminal, parabéns, a sua API já está viva e a funcionar com hot-reload!

## Passo 8: Configurar as Variáveis de Ambiente (.env)

O `.env` é um arquivo usado para armazenar variáveis de ambiente da aplicação. Em uma API Express, ele é especialmente útil para guardar configurações que não devem ficar expostas diretamente no código, principalmente credenciais e informações que mudam conforme o ambiente (desenvolvimento, teste e produção).

Abra o arquivo ou crie caso ainda não o tenha o arquivo `.env`  e configure as credenciais principais da nossa API:

```env
DATABASE_URL="sua_url_de_conexao_do_postgresql_neon_aqui"
JWT_SECRET="sua_chave_secreta_para_os_tokens_aqui"
```
Obs.: DATABASE_URL foi obtida quando criarmos um banco de dados na NEON.
Obs.: JWT_SECRET deve ser uma string aleatória de sua preferência. Ex.: "@1093b^2&Fh#j*zU"

Com  a finalização do passo 8 terminamos a primeira parte do nosso projeto. siga para o 02-modelagem-e-sincronizacao-com-prisma.md
