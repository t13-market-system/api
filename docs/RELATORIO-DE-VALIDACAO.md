# Registro de validação da documentação

[← Índice](../README.md) · [Lista para executar no seu ambiente](11-validacao-ponta-a-ponta.md)

**Data da revisão:** 2 de outubro de 2026.
**Escopo:** README e exemplos progressivos dos capítulos 1 a 11. A aplicação existente do repositório não foi modificada para corresponder ao guia.

## Método

Os blocos de arquivos foram extraídos diretamente do Markdown para projetos temporários separados por etapa. Os scripts foram acumulados na ordem dos capítulos. As dependências foram instaladas em uma pasta isolada, usando as versões indicadas. As verificações não usaram credenciais reais nem alteraram bancos de dados.

| Ambiente | Versão |
|---|---|
| Node.js | 24.15.0 |
| npm | 11.12.1 |
| TypeScript | 5.9.3 |
| Prisma CLI | 8.0.0-rc.15 |
| ORM PostgreSQL | 8.0.0-rc.11 |
| Vitest e coverage-v8 | 4.1.11 |
| Plop | 4.0.5 |

## Verificações executadas

| Verificação | Resultado | Evidência e limite |
|---|---|---|
| UTF-8 e português | ✅ Conferidos | Acentos, `ç`, símbolos, ausência de caracteres de substituição e de interrogações inseridas em palavras |
| Links internos e blocos Markdown | ✅ Conferidos | Destinos locais existentes e cercas de código equilibradas |
| Inicialização Prisma | ✅ Executada | Comando não interativo criou schema e cliente em `src/prisma`, configuração e `.env` |
| Emissão de contrato | ✅ Executada | Contrato `User` e contrato `User` + `Cliente` emitidos |
| Typecheck da aplicação | ✅ Executado | Capítulos 2 a 10 aprovados separadamente |
| Typecheck de testes/configurações | ✅ Executado | Capítulos 9 e 10, incluindo o teste de integração, sem abrir conexão |
| Build | ✅ Executado | Capítulos 2 a 10; JSON do contrato presente em `dist/prisma` |
| Primeira migração | ✅ Planejada offline | Plano cria a tabela de usuários e unicidade de e-mail; não foi aplicado |
| Migração de Cliente | ✅ Planejada offline | Referência simulada do contrato anterior; plano acrescenta apenas Cliente e sua unicidade |
| Skills | ✅ Sincronizadas em projeto temporário | Configuração `agents` aceita pela CLI |
| Testes de usuários | ✅ 17 aprovados | Banco substituído; validação, hash, respostas, JWT, cookies, autorização, erros, CORS, Swagger e login limitado |
| Gerador Plop | ✅ Executado | Quatro arquivos Cliente gerados a partir dos templates do capítulo 10 |
| Testes após geração | ✅ 23 aprovados | 17 testes de usuários e seis de contatos, com banco substituído |
| Cobertura | ✅ Gerada | 95,28% de linhas e 79,20% de branches no conjunto medido; runtime Prisma e servidor excluídos conforme configuração |
| JavaScript compilado | ✅ Executado | Servidor iniciou com Node; health 200, acesso sem token 401 e preflight 204 |
| Swagger compilado | ✅ Conferido por HTTP | Interface retornou HTML e documento JSON apresentou rotas de usuários, autenticação e clientes |

Os números de cobertura descrevem esta revisão, não um requisito de aprovação nem uma garantia de ausência de bugs. A interface Swagger foi conferida por HTTP; a interação visual no navegador permanece na lista manual.

## Verificações que dependem do seu ambiente

> [!IMPORTANT]
> Sem um banco real configurado, não foi possível aprovar conexão, aplicação das migrações ou o teste de integração. A documentação fornece os passos para fazê-los sem misturar bancos de desenvolvimento e testes.

- [ ] Conexão e TLS no PostgreSQL/Neon escolhido.
- [ ] Aplicação das duas migrações no banco de desenvolvimento e `db verify`.
- [ ] Migrações e teste de integração no banco separado de `.env.test`.
- [ ] CRUD real de usuários e clientes.
- [ ] Interação no navegador com Swagger, frontend e cookies.
- [ ] Renderização visual final dos diagramas e alertas no GitHub.
- [ ] Configuração de HTTPS, proxy, segredos e limites compartilhados para um eventual deploy.

## Como repetir a aprovação

Siga os capítulos em uma pasta vazia e complete a [validação final](11-validacao-ponta-a-ponta.md). Não reaproveite credenciais, migrações ou arquivos de uma tentativa anterior sem conferir sua compatibilidade. Registre comandos, códigos de saída e respostas; mantenha segredos fora das evidências públicas.

**Situação:** exemplos locais e testes sem banco aprovados; integração com banco real e verificações visuais pendentes de execução no ambiente do leitor.
