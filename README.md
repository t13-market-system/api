# 🚀 API com Express.js, TypeScript e Prisma 8

> [!NOTE]  
> Bem-vindo(a) ao repositório oficial do nosso projeto prático! Neste guia, você aprenderá passo a passo como construir uma **API RESTful** moderna, segura e escalável, utilizando a nova arquitetura do **Prisma 8** e seguindo os melhores padrões do mercado.

## 🛠️ Tecnologias Utilizadas

Este projeto foi desenhado para simular um ambiente de desenvolvimento real. Durante as aulas, vamos utilizar:

- 🟢 **[Node.js](https://nodejs.org/) & [TypeScript](https://www.typescriptlang.org/):** A base da nossa aplicação, garantindo tipagem forte e prevenção de erros.
- 🚂 **[Express.js](https://expressjs.com/):** O *framework* web minimalista mais popular do ecossistema Node.js.
- 🗄️ **[Prisma 8 (ORM)](https://www.prisma.io/):** Abordagem *Contract-First* ultramoderna para modelar o banco de dados e garantir segurança de tipagem de ponta a ponta.
- 🐘 **PostgreSQL (Neon):** Banco de dados relacional *Serverless* na nuvem.
- 🛡️ **Segurança & Autenticação:** `bcrypt` (criptografia), `jsonwebtoken` (JWT), `helmet` e `cors`.
- 📝 **Validação & Qualidade:** `zod` (validação de dados), `winston` e `morgan` (sistema profissional de logs).

---

## 📂 Estrutura do Projeto

Nossa arquitetura está dividida em camadas **MVC** bem definidas. Esta organização isola regras de negócio, rotas e a comunicação HTTP, facilitando imensamente a manutenção e a escalabilidade:

```text
/api
 ┣ 📂 docs           # 📖 Guias passo a passo (Veja os links abaixo)
 ┣ 📂 prisma         # 🗄️ Configurações do Banco de Dados
 ┃ ┗ 📜 contract.prisma  # Definição das tabelas e esquemas (Substituto do antigo schema.prisma)
 ┣ 📂 src
 ┃ ┣ 📂 config       # ⚙️ Configurações de bibliotecas externas (Winston, etc.)
 ┃ ┣ 📂 controllers  # 🚦 Intermediários: recebem req, chamam services e enviam res
 ┃ ┣ 📂 lib          # 📦 Instâncias globais (ex: src/lib/prisma.ts contendo o Singleton do BD)
 ┃ ┣ 📂 middlewares  # 🛡️ Interceptadores de requisições (Autenticação JWT, Validação Zod, etc.)
 ┃ ┣ 📂 routes       # 📍 O mapa de URLs da API (ex: rotas de usuários, clientes)
 ┃ ┣ 📂 services     # ❤️ O coração: regras de negócio exclusivas e comunicação com o Prisma
 ┃ ┗ 📜 server.ts    # 🟢 Arquivo principal que inicializa o Express e agrupa as rotas
 ┣ 📜 prisma.config.ts # ⚙️ Configuração central de ambiente do Prisma 8
 ┣ 📜 .env           # 🔑 Variáveis de ambiente (sua URL secreta e chaves locais - NÃO versionado)
 ┣ 📜 package.json   # 📦 Lista de dependências e scripts mágicos (npm run dev)
 ┗ 📜 tsconfig.json  # 📘 Regras rígidas de compilação do TypeScript
```

---

## 📚 Documentação Passo a Passo

Siga os tutoriais abaixo na ordem apresentada para reconstruir esse projeto do zero. Eles foram escritos com muito cuidado para garantir um aprendizado fluido.

1️⃣ **[Preparação do Ambiente](./docs/01-prepacao-do-ambiente.md)**  
*Instalação do Node.js, dependências, TSConfig e a inicialização da CLI do Prisma 8.*

2️⃣ **[Modelagem e Sincronização com Prisma](./docs/02-modelagem-e-sincronizacao-com-prisma.md)**  
*Configuração global do banco em `lib/prisma.ts`, sintaxe do novo `contract.prisma` e comandos de migração (Contract-First).*

3️⃣ **[Criando Rotas, Serviços e Controladores](./docs/03-criando-rotas-serv-contro.md)**  
*A separação limpa das camadas MVC, construção do CRUD de Usuários e o engate final das rotas no `server.ts`.*

---
> [!TIP]  
> **Dica de Ouro:** Não copie e cole os códigos cegamente! Digite-os, entenda o fluxo dos dados (Rota ➡️ Controller ➡️ Service ➡️ Banco) e você dominará a criação de backends em pouquíssimo tempo! 🚀