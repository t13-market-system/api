# Preparação do Ambiente

# 1 - Instalação do package.json

No terminal do VS Code, execute o comando abaixo (a flag -y pula as perguntas e preenche tudo com o padrão):

npm init -y

# 2 - Instalação das dependências principais (produção)

Agora vamos instalar o "motor" da nossa aplicação. Essas são as bibliotecas que rodarão no servidor final:

````bash
npm install express pg @prisma/client bcrypt jsonwebtoken zod helmet cors express-rate-limit morgan winston
````
Core & Banco de dados: express (rotas), @prisma/client e pg (comunicação com banco PostgreSQL).

Segurança: helmet, cors e express-rate-limit.

Autenticação: bcrypt (criptografia) e jsonwebtoken (tokens de acesso).

Validação & Logs: zod (validação de dados), morgan e winston (registro de atividades e erros).

# 3 - Instalação das dependências de desenvolvimento

Como estamos usando TypeScript, precisamos ensinar a ele como as bibliotecas acima funcionam. Também instalaremos ferramentas que nos ajudarão apenas na hora de programar.

````bash
npm install -D prisma typescript @types/node @types/express @types/bcrypt @types/jsonwebtoken @types/cors @types/morgan tsx
````

# 4 - Configuração do TypeScript
O TypeScript precisa de um "manual de instruções". Vamos criar o arquivo tsconfig.json rodando:

````bash
npx tsc --init
````

Após criar o arquivo tsconfig.json, substitua todo o conteúdo dele por esta configuração moderna e otimizada:

````json
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
````

