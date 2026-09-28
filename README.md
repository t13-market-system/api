Construindo uma API com Express.js, TypeScript e Prisma
Este guia apresenta o passo a passo para a construção da nossa API. Siga as instruções abaixo para configurar o ambiente corretamente.

#Passo 1: Inicializando o Projeto
O primeiro passo é criar o arquivo package.json, que funcionará como a "identidade" do nosso projeto. Ele guardará a lista de todas as bibliotecas que vamos usar e os scripts de execução.

No terminal do VS Code, execute o comando abaixo (a flag -y pula as perguntas e preenche tudo com o padrão):
npm init -y

Passo 2: Instalando as Dependências Principais (Produção)
Agora vamos instalar o "motor" da nossa aplicação. Essas são as bibliotecas que rodarão no servidor final:


````bash
npm install express pg @prisma/client bcrypt jsonwebtoken zod helmet cors express-rate-limit morgan winston
Core & Banco de dados: express (rotas), @prisma/client e pg (comunicação com banco PostgreSQL).

Segurança: helmet, cors e express-rate-limit.

Autenticação: bcrypt (criptografia) e jsonwebtoken (tokens de acesso).

Validação & Logs: zod (validação de dados), morgan e winston (registro de atividades e erros).

Passo 3: Instalando as Dependências de Desenvolvimento
Como estamos usando TypeScript, precisamos ensinar a ele como as bibliotecas acima funcionam. Também instalaremos ferramentas que nos ajudam apenas na hora de programar.

Bash
npm install -D prisma typescript @types/node @types/express @types/bcrypt @types/jsonwebtoken @types/cors @types/morgan tsx
@types/...: São dicionários que ativam o autocompletar no VS Code.

tsx: Uma ferramenta moderna para rodar nosso código TypeScript diretamente e reiniciar o servidor automaticamente ao salvarmos um arquivo.

prisma: A ferramenta de linha de comando para gerenciarmos nosso banco de dados.

Passo 4: Configurando o TypeScript
O TypeScript precisa de um "manual de instruções". Vamos criar o arquivo tsconfig.json rodando:

Bash
npx tsc --init
Após criar o arquivo, substitua todo o conteúdo dele por esta configuração moderna e otimizada:

JSON
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
rootDir e outDir: Programamos na pasta src/, mas a versão final do código (traduzida para JavaScript) irá para a pasta dist/.

strict: true: Ativa todas as verificações de segurança do TypeScript para evitar erros silenciosos.
