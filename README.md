# 🚀 API com Express, TypeScript e Prisma 8

**Um guia progressivo para construir, testar e documentar uma API PostgreSQL.**

![Node.js 24](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)
![TypeScript ESM](https://img.shields.io/badge/TypeScript-ESM%20%2B%20NodeNext-3178C6?logo=typescript&logoColor=white)
![Prisma 8 RC](https://img.shields.io/badge/Prisma-8%20RC-2D3748?logo=prisma&logoColor=white)
![Documentação em português](https://img.shields.io/badge/Documenta%C3%A7%C3%A3o-pt--BR-blue)

> [!IMPORTANT]
> Este README orienta a **reconstrução em uma pasta nova**. A aplicação existente em `src/`, suas migrações e seu `package.json` não são automaticamente convertidos pelos exemplos. Siga os capítulos para construir a API do guia; não execute `orm init` sobre o projeto existente.

## 🧭 Comece aqui

1. Confira Node.js 24.15.0 ou posterior compatível e npm 11.
2. Prepare um banco PostgreSQL 15 ou superior **vazio**, local ou Neon, exclusivo para desenvolvimento.
3. Abra o CMD no diretório que conterá uma pasta nova `api`.
4. Siga [01 · Preparação do ambiente](docs/01-prepacao-do-ambiente.md).
5. Avance somente depois de concluir a lista de conferência do capítulo.

Se `api` já existe, use outro diretório pai ou outra pasta vazia. No PowerShell, comandos npm podem precisar de `npm.cmd`/`npx.cmd`, sem alterar a política de execução.

O [`.env.example`](.env.example) contém o mesmo modelo público do capítulo 1. Copie os valores necessários para o `.env` da **nova API**, preenchendo a conexão e gerando uma chave JWT própria. Se pretende aproveitar tabelas e um contrato existentes, leia a alternativa de adoção no [capítulo 2](docs/02-modelagem-e-sincronizacao-com-prisma.md); os campos do banco precisam corresponder aos serviços e ao gerador.

## 📚 Trilha completa

| Etapa | Guia | Entrega e critério de avanço |
|---|---|---|
| 01 | [Preparação do ambiente](docs/01-prepacao-do-ambiente.md) | Dependências fixadas, ESM, ambiente validado e `/health` 200 |
| 02 | [Contrato e migrações](docs/02-modelagem-e-sincronizacao-com-prisma.md) | `User` emitido e migrado; banco verificado e build aprovado |
| 03 | [Rotas, serviços e controladores](docs/03-criando-rotas-serv-contro.md) | CRUD local, erros HTTP e respostas sem hash de senha |
| 04 | [Validação com Zod](docs/04-validacao-de-dados-com-zod.md) | Normalização aplicada, campos extras e entradas inválidas rejeitados |
| 05 | [JWT, autorização e cookies](docs/05-autenticacao-com-jwt.md) | Login por Bearer/cookie; cada usuário acessa a própria conta |
| 06 | [Logs com Winston e Morgan](docs/06-monitorizacao-e-logs-com-winston.md) | Logs HTTP e JSON, sem perder CORS ou cookies |
| 07 | [Segurança e limites](docs/07-seguranca-e-rate-limit.md) | Helmet, origens explícitas, preflight e limites de API/login |
| 08 | [Swagger e OpenAPI](docs/08-documentacao-com-swagger.md) | Operações públicas/privadas documentadas em desenvolvimento e após o build |
| 09 | [Testes automatizados](docs/09-testes-automatizados-vitest.md) | 17 testes sem banco e integração real em banco separado |
| 10 | [Gerador de recursos com Plop](docs/10-automacao-e-geracao-de-codigo.md) | CRUD `Cliente`, quatro arquivos gerados e seis testes adicionais |
| 11 | [Validação final e operação](docs/11-validacao-ponta-a-ponta.md) | 23 testes, banco, CRUD, cookies e execução compilada conferidos |

A ordem importa: emitir contrato não aplica tabelas, gerar código não cria modelos e compilar não confirma conexão com o banco.

## 🏗️ Arquitetura construída pelo guia

```mermaid
flowchart TD
    C[Cliente HTTP / Swagger] --> A[Aplicação Express]
    A --> M[Origem, limites, cookies e validação]
    M --> J[Autenticação e autorização]
    J --> R[Rotas e controladores]
    R --> S[Serviços tipados]
    S --> P[Prisma 8]
    P --> D[(PostgreSQL)]
    R --> E[Middleware central de erros]
    A --> L[Logs Winston / Morgan]
```

```text
api/
├── src/
│   ├── app.ts                  # Express importável pelos testes
│   ├── server.ts               # Porta HTTP e encerramento das conexões
│   ├── config/                 # Ambiente, logger e Swagger
│   ├── controllers/            # Entrada/saída HTTP
│   ├── lib/                    # HttpError
│   ├── middlewares/            # Validação, JWT, CORS, origem, limites e erros
│   ├── prisma/
│   │   ├── contract.prisma     # Fonte do contrato
│   │   ├── contract.json       # Gerado e versionado
│   │   ├── contract.d.ts       # Gerado e versionado
│   │   └── db.ts               # Cliente compartilhado
│   ├── routes/                 # Usuários, autenticação e clientes
│   ├── schemas/                # Zod e tipos de entrada
│   └── services/               # Banco e regras de negócio
├── migrations/                 # Migrações, snapshots e refs versionados
├── tests/                      # Testes sem banco e integração real
├── plop-templates/             # Quatro templates do recurso de contatos
├── plopfile.js                 # Gerador ESM
├── prisma.config.ts
├── tsconfig.json
├── vitest.config.ts
├── vitest.integration.config.ts
├── .env.example                # Placeholders públicos
├── .env                        # Segredos locais; ignorado
├── .env.test                   # Banco separado; ignorado
├── package.json
└── package-lock.json
```

`dist/`, `logs/`, `coverage/` e `node_modules/` são artefatos locais, não fontes versionadas.

## 🧰 Versões e convenções

| Escolha | Convenção |
|---|---|
| Prisma CLI | `8.0.0-rc.15` |
| ORM PostgreSQL | `@prisma/orm-postgres@8.0.0-rc.11` |
| Datas no Node.js 24 | `temporal-polyfill@1.0.5`; import global no cliente antes das consultas |
| CLI engine | `@prisma/cli-engine@0.4.0`, correspondente à CLI |
| TypeScript | `5.9.3`, `module` e `moduleResolution` em `NodeNext` |
| Módulos | `type=module`; imports locais com extensão `.js` |
| Contrato | Caminho único em `src/prisma/contract.prisma`; primeira linha `// use prisma-8` |
| Dependências | Versões exatas nos comandos; `package-lock.json` versionado |
| Ambiente | Segredo JWT obrigatório; origens HTTP(S) explícitas |

> [!NOTE]
> Prisma 8 está em versão candidata nesta combinação. Evite trocar pacotes por `latest` durante o exercício. CLI e ORM possuem numeração própria; confira compatibilidade pelo toolchain, não apenas pelo sufixo da versão.

## 🔐 Política de acesso

| Recurso | Regra |
|---|---|
| Cadastro e login | Públicos, validados e limitados |
| Conta `User` | Somente o próprio titular; sem hash nas respostas |
| Contatos `Cliente` | Compartilhados entre usuários autenticados neste exercício |
| Cookie em escrita | Origem confiável obrigatória nas rotas autenticadas |
| JWT | HS256, emissor/audiência definidos e duração de 15 minutos |
| Logout | Limpa cookie; cliente descarta Bearer; não revoga JWT já emitido |

O tutorial não implementa administrador, recuperação de senha, revogação imediata, refresh token ou permissões individuais sobre contatos. Esses recursos precisam de regras próprias antes de expandir o produto.

## ▶️ Comandos da API depois de construída

Estes scripts são configurados **durante o guia**, não necessariamente no código existente deste repositório:

| Comando | Uso |
|---|---|
| `npm run dev` | Desenvolvimento com `tsx watch` |
| `npm run typecheck` | Conferir TypeScript sem emitir arquivos |
| `npm run contract:emit` | Atualizar contrato JSON e tipos |
| `npm run skills:sync` | Sincronizar instruções para agentes |
| `npm test` | Executar testes sem banco real |
| `npm run test:coverage` | Gerar relatório de cobertura |
| `npm run test:integration` | Alterar e testar banco exclusivo em `.env.test` |
| `npm run generate` | Criar os quatro arquivos de um recurso de contatos |
| `npm run build` | Compilar para `dist/` |
| `npm start` | Executar o JavaScript compilado |

Após o capítulo 8, a interface fica em [http://localhost:3000/api-docs](http://localhost:3000/api-docs) e o documento em [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json), salvo se você configurar outra porta/origem.

## ✅ Validação e seus limites

**Os onze capítulos foram executados em sequência em uma pasta nova (`api5`), com PostgreSQL real e bancos separados para desenvolvimento e integração, em 2 de outubro de 2026.** Passaram os 23 testes sem banco, o teste de integração, os CRUDs reais, o build, a execução sem dependências de desenvolvimento e a interação com Swagger e cookies no Edge. Os 40 arquivos finais identificados no Markdown correspondem aos arquivos executados.

Consulte o [registro da validação e suas evidências](docs/RELATORIO-DE-VALIDACAO.md). A aprovação se refere às versões e ao ambiente registrados; repita o [capítulo 11](docs/11-validacao-ponta-a-ponta.md) na sua própria instalação. Renderização no GitHub e publicação HTTPS não fizeram parte da execução local.

<details>
<summary>🛠️ Como ler e copiar os exemplos</summary>

- Blocos com nome de arquivo são completos, salvo quando explicitamente indicados como pares a acrescentar ao objeto `scripts`.
- Blocos `bat` são comandos CMD executados linha por linha, sem numeração embutida.
- Listas de conferência são critérios de aprovação, não comprovantes de execução.
- Alertas destacam dependências e operações de banco; se uma verificação falhar, use o diagnóstico antes de avançar.
- Os nomes dos arquivos antigos foram preservados para manter os links existentes, inclusive `01-prepacao-do-ambiente.md`.

</details>

<details>
<summary>📦 Retomar uma cópia da API já construída</summary>

Com `package-lock.json`, contratos e migrações versionados, configure `.env` e execute:

```bat
npm ci
npm run typecheck
npm test
npm run build
```

Confira o banco e aplique migrações revisadas conforme o capítulo 11 antes de `npm start`. Não reinicialize o Prisma. O clone deste repositório didático pode conter uma aplicação de outra etapa; os comandos acima se referem à API concluída seguindo a documentação.

</details>

## 📖 Referências

[Prisma ORM](https://www.prisma.io/docs/orm/core-concepts) · [Express](https://expressjs.com/) · [TypeScript](https://www.typescriptlang.org/) · [Zod](https://zod.dev/) · [Vitest](https://vitest.dev/) · [Plop](https://plopjs.com/documentation/)

A apresentação usa recursos renderizados pelo GitHub: títulos e sumário, tabelas, blocos com realce de sintaxe, alertas, listas de tarefas, diagramas Mermaid, imagens de badges e seções recolhíveis. Não depende de JavaScript ou CSS personalizado.
