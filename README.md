# 🚀 API com Express.js, TypeScript e Prisma

Bem-vindo(a) ao repositório oficial do nosso projeto prático! Neste guia, aprenderá passo a passo como construir uma API RESTful moderna, segura e escalável, utilizando as melhores ferramentas do mercado e seguindo padrões profissionais de arquitetura.

## 🛠️ Tecnologias Utilizadas

Este projeto foi desenhado para simular um ambiente de desenvolvimento real. Durante as aulas, vamos utilizar:

* **[Node.js](https://nodejs.org/) & [TypeScript](https://www.typescriptlang.org/):** A base da nossa aplicação, garantindo tipagem forte e prevenção de erros.
* **[Express.js](https://expressjs.com/):** O *framework* web mais popular do Node.js para criação das nossas rotas.
* **[Prisma ORM](https://www.prisma.io/):** Uma ferramenta incrível e moderna para modelar o banco de dados e fazer consultas.
* **PostgreSQL (Neon):** O nosso banco de dados relacional na nuvem.
* **Segurança & Autenticação:** `bcrypt` (para encriptar senhas), `jsonwebtoken` (JWT para login), `helmet` e `cors`.
* **Validação:** `Zod` (para garantir que os dados recebidos estão no formato correto).
* **Monitorização:** `Winston` e `Morgan` para um sistema profissional de *logs*.

---

## 📂 Estrutura do Projeto

Nossa arquitetura está dividida em camadas bem definidas. Esta organização (separando Rotas, Controladores e Serviços) é um padrão de mercado que facilita a manutenção e o crescimento da aplicação:

```text
/api
 ┣ 📂 docs           # 📖 Tutoriais e passo a passo das aulas (Opcional, se usar o Github Docs)
 ┣ 📂 prisma         # Configurações do Banco de Dados
 ┃ ┗ 📜 schema.prisma # Definição das tabelas do banco de dados (PostgreSQL/Neon)
 ┣ 📂 src
 ┃ ┣ 📂 config       # Inicialização de bibliotecas externas (ex: configurações do Winston para logs)
 ┃ ┣ 📂 controllers  # Funções que recebem a requisição (req), chamam os serviços e enviam a resposta (res)
 ┃ ┣ 📂 middlewares  # Interceptadores de segurança e validação (JWT, Zod, Helmet, Rate Limit)
 ┃ ┣ 📂 models       # Classes ou tipos auxiliares para manipulação de dados mais complexos (além do Prisma)
 ┃ ┣ 📂 routes       # Os arquivos que definem as URLs da sua API (ex: rotas para listagem/avaliações)
 ┃ ┣ 📂 services     # O coração do sistema: regras de negócio e chamadas ao Prisma para ler/gravar no banco
 ┃ ┣ 📂 utils        # Funções reaproveitáveis (ex: formatadores de data, funções de hash com bcrypt)
 ┃ ┗ 📜 server.ts    # 🟢 O arquivo principal que inicializa o servidor Express e conecta tudo
 ┣ 📜 .env           # Variáveis de ambiente (sua URL secreta do Neon e chaves do JWT)
 ┣ 📜 package.json   # Lista de dependências e scripts de execução
 ┗ 📜 tsconfig.json  # Regras de compilação do TypeScript
 ```

 # 1 - [01 - Preparação do Ambiente](./docs/01-prepacao-do-ambiente.md)
 # 2 - [02 - Modelagem-e-sincronizacao-com-prisma](./docs/02-modelagem-e-sincronizacao-com-prisma.md)
 # 3 - [02 - Criando Rotas,  Services e  Controllers](./docs/03-criando-rotas-serv-contro.md)