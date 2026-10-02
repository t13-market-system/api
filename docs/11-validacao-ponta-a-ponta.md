<!-- Documento: docs/11-validacao-ponta-a-ponta.md -->

# 11 · Validação final e operação

[← Anterior](10-automacao-e-geracao-de-codigo.md) · [Índice](../README.md) · **Etapa 11 de 11**

## Objetivo

Registrar evidências de que a aplicação construída pelo guia funciona no seu ambiente. Marque uma verificação apenas depois de executar o comando ou observar a resposta; um build aprovado não confirma acesso ao banco.

## 1. Verificações automáticas

**Propósito do passo:** Vamos reunir as verificações do contrato, dos tipos, dos testes, da compilação e do banco. Cada comando confirma uma parte diferente da aplicação; por isso, todos precisam concluir sem erro.

Pare servidores duplicados e execute na raiz da API construída:

Volte aos terminais que executam o servidor e pressione Ctrl+C. Os comandos abaixo devem ser executados um de cada vez em um CMD aberto na pasta da API. Não avance para o seguinte se o anterior terminar com erro; use a mensagem e o diagnóstico ao final deste capítulo para localizar a causa.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm run contract:emit
npm run typecheck
npm test
npm run test:coverage
npm run build
npx prisma db verify
npx prisma migration status
```

| Verificação | Critério de aprovação |
|---|---|
| Emissão | Contratos atualizados com `User` e `Cliente` |
| TypeScript | Nenhum erro |
| Testes | 23 testes aprovados após o capítulo 10 |
| Cobertura | Relatório gerado; cenários ausentes identificados |
| Build | JavaScript em `dist`, com `dist/prisma/contract.json` |
| Banco de desenvolvimento | Compatível com contrato, sem migrações pendentes |

## 2. Integração real em banco de testes

**Propósito do passo:** O banco de testes também precisa receber a migração de Cliente. Depois vamos repetir o teste real de usuários para confirmar que a nova estrutura preservou o fluxo anterior.

Confira `.env.test`, inclusive `DIRECT_URL` quando usada. Aplique as migrações, agora também com `Cliente`:

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
node --env-file=.env.test ./node_modules/prisma/dist/prisma.js db migrate
node --env-file=.env.test ./node_modules/prisma/dist/prisma.js db verify
npm run test:integration
```

Espere o fluxo de usuários aprovado, sem registros de teste remanescentes. O CRUD real de clientes é conferido manualmente no passo seguinte; os seis testes adicionais de clientes usam banco substituído.

## 3. Testar a saída compilada

**Propósito do passo:** A versão compilada é a que será executada fora do modo de desenvolvimento. Vamos iniciar essa versão e repetir operações com dados descartáveis.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm start
```

Em outro CMD:

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
curl.exe -i http://localhost:3000/health
curl.exe -i http://localhost:3000/api-docs.json
```

Abra o Swagger, crie uma conta descartável e execute a sequência abaixo. Evite outras tentativas inválidas de login durante o teste dos limites; elas contam na mesma janela por IP.

Use [http://localhost:3000/api-docs](http://localhost:3000/api-docs) e a sequência de **Try it out**, **Execute** e **Authorize** explicada no capítulo 8. Anote os IDs das contas e dos clientes criados. Para testar “outra conta”, cadastre uma segunda conta descartável; continue usando o token da primeira ao consultar o ID da segunda.

| Cenário | Resultado |
|---|---|
| Cadastrar conta válida | 201; senha ausente na resposta |
| Repetir e-mail | 409 |
| Enviar campos extras ou senha inválida | 400 |
| Login incorreto | 401 |
| Login correto | 200; token e cookie HttpOnly |
| Listar própria conta por Bearer | 200; somente a própria conta |
| Consultar outra conta | 403 |
| Atualizar própria conta | 200; sem hash de senha |
| Tentar usar e-mail de outra conta | 409 |
| Usar ID inválido com token válido | 400 |
| Usar token ausente ou inválido | 401 |
| Usar cookie em leitura | 200 |
| Usar cookie em escrita com origem confiável | 200 |
| Usar cookie em escrita sem origem confiável | 403 |
| Criar, listar, consultar e editar cliente com token | 201/200 |
| Consultar clientes sem token | 401 |
| Excluir cliente criado | 204; consulta posterior 404 |
| Logout por cookie | 204; cookie removido |
| Excluir conta descartável por Bearer | 204; conta ausente no banco |
| Tentar login dessa conta após exclusão | 401 |
| Sexta tentativa de login sem sucesso na janela | 429 |
| Rota desconhecida | 404 em JSON |
| Preflight de origem permitida | 204; origem explícita e credenciais |

Para cookie em escrita no curl, envie `Origin` com `FRONTEND_ORIGIN` ou `API_ORIGIN`, como no capítulo 5. O navegador envia esse cabeçalho nas requisições de escrita. Para testar o limite isoladamente em desenvolvimento, reinicie o processo antes das seis tentativas.

## 4. Conferir logs e arquivos versionados

**Propósito do passo:** Vamos conferir o que será compartilhado e o que deve permanecer local. Isso evita perder arquivos necessários para reconstruir a API e evita incluir segredos ou arquivos gerados no Git.

- [ ] Logs HTTP presentes em `logs/all.log`.
- [ ] Logs sem senhas, tokens e cookies.
- [ ] `.env`, `.env.test`, `cookies.txt`, `node_modules`, `dist`, `logs` e `coverage` fora do Git.
- [ ] `package.json` e `package-lock.json` versionados.
- [ ] Fonte do contrato, `contract.json` e `contract.d.ts` versionados.
- [ ] Pasta `migrations/` completa, incluindo snapshots e refs.
- [ ] Templates, `plopfile.js`, testes e configurações de teste versionados.

Se criou o arquivo de cookies do capítulo 5, acrescente `cookies.txt` ao `.gitignore` ou exclua o arquivo local. No repositório da API, se Git estiver inicializado, confira:

**Versionar** significa guardar os arquivos no histórico do Git para reconstruir o projeto depois. `git status --short` lista alterações; `git check-ignore` mostra quais caminhos são ignorados. Se você ainda não usa Git, não execute esses comandos agora: confira `.gitignore` no editor e guarde os arquivos de fonte, contratos e migrações listados acima para a etapa de versionamento.

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
git status --short
git check-ignore .env .env.test node_modules dist logs coverage
```

## 5. Preparar produção com os limites do exercício em mente

**Propósito do passo:** Publicar significa executar a API em um ambiente acessível aos usuários. Vamos entender a ordem de instalação, compilação e migração, além das configurações que dependem do provedor escolhido.

> **📌 Importante**
>
> O tutorial valida uma API local. Publicação envolve decisões de infraestrutura que dependem do seu provedor: domínio, TLS, proxy, segredos, banco, retenção de logs e armazenamento dos limites. Não trate a aprovação local como certificação de produção.

| Item | Configuração necessária |
|---|---|
| Ambiente | `NODE_ENV=production`; segredo aleatório definido no provedor |
| Origens | `FRONTEND_ORIGIN` e `API_ORIGIN` reais, sem caminho nem barra final |
| Transporte | HTTPS; cookie `Secure` não funciona sobre HTTP em produção |
| Banco | URL correta, TLS do provedor, migrações revisadas antes de aplicar |
| Deploy | Artefatos de build, contrato JSON e dependências de execução |
| Proxy | `trust proxy` restrito à infraestrutura real, quando necessário |
| Escala | Armazenamento compartilhado dos contadores de limite quando houver vários processos da API |
| Logs | Coleta e retenção apropriadas; não divulgar informações sensíveis |
| Swagger | Decidir se deve ser público, restrito ou desativado |
| Sessões | Revogação imediata exige mecanismo adicional; JWT dura 15 minutos |
| Dados | Paginação para listas grandes; contatos compartilhados só se a política do produto permitir |

Faça o build em uma etapa que tenha as dependências de desenvolvimento instaladas. A CLI de migrações e o TypeScript são ferramentas de desenvolvimento; não estarão disponíveis em uma instalação feita apenas com `--omit=dev`.

Fluxo de referência para uma cópia limpa da **API já construída e versionada**:

```bat
REM Execute no CMD, na raiz da sua API (pasta que contém package.json).
npm ci
npm run typecheck
npm test
npm run build
npx prisma db migrate
npx prisma db verify
npm prune --omit=dev
npm start
```

Antes das duas operações de banco, configure a conexão do ambiente de destino e revise as migrações. Em produção, não use `--advance-ref db`: a referência local do desenvolvedor não deve ser alterada pelo deploy. Nunca rode `orm init` no deploy. Depois de `npm prune`, para voltar a desenvolver use `npm ci` novamente.

<details>
<summary>Diagnóstico por sintoma</summary>

| Sintoma | Conferência |
|---|---|
| `Cannot use import statement outside a module` | `type=module`; build com `NodeNext` |
| Módulo local não encontrado em produção | Extensão `.js` nos imports; execute o build completo |
| `contract.json` ausente | Emita contrato antes do build; mantenha fonte em `src/prisma` |
| Cadastro 500 com `RUNTIME.TEMPORAL_UNAVAILABLE` | `temporal-polyfill@1.0.5` instalado em execução e import global no início de `src/prisma/db.ts` |
| `ZodPipe` sem `.max()` | Aplique `.max()` antes de `.pipe(z.email())`, como nos exemplos |
| Erro de conexão/assinatura | URL correta, migrações aplicadas e `db verify` |
| 401 no Swagger | Login, token recente e Authorize preenchido com apenas o token |
| Cookie não chega | `credentials: include`, origens corretas, SameSite e HTTPS coerentes |
| 403 com cookie no curl | Falta `Origin` confiável para escrita |
| 429 durante testes manuais | Limite por IP; aguarde a janela ou reinicie apenas o servidor local |
| Nenhum teste encontrado | Arquivos e configuração do capítulo 9 precisam existir |
| Plop recusa arquivos | Recurso já gerado; não force sobrescrita de código editado |
| Cliente não aparece no ORM | Modelo presente, contrato emitido e tipos atualizados |
| Swagger vazio depois do build | Comentários preservados e busca `.js` em `dist/routes` |

</details>

## Registro de conclusão

Copie esta lista para suas anotações e preencha os resultados:

- [ ] Capítulos 1 a 10 executados na ordem, sem saltar migrações.
- [ ] 23 testes sem banco aprovados.
- [ ] Integração real de usuários aprovada no banco separado.
- [ ] CRUD real de clientes aprovado.
- [ ] API compilada e Swagger conferidos.
- [ ] Cookies, autorização, origens e limites conferidos.
- [ ] Logs e arquivos versionados revisados.

Se alguma verificação não foi executada, registre **pendente**, com o motivo. Não declare aprovação integral apenas por não ter observado um erro.

[← Anterior](10-automacao-e-geracao-de-codigo.md) · [Voltar ao índice](../README.md)
