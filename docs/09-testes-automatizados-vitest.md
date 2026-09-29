# 🧪 Introdução aos Testes Automatizados (Vitest & Supertest)

> [!NOTE]  
> Até agora, usamos ferramentas gráficas (como o Swagger ou o Insomnia) para testar nossa API. Mas o que acontece quando o projeto cresce e ganha dezenas de rotas diferentes? Fica impossível testar tudo manualmente a cada nova alteração! É aqui que entram os **Testes Automatizados**: o verdadeiro "seguro de vida" de qualquer projeto profissional.

## O "Porquê" testar?

No mercado de trabalho atual, não existe aplicação crítica que sobreviva sem testes automatizados. Nós paramos de depender exclusivamente de testes manuais no banco de dados porque humanos erram, esquecem cenários e perdem tempo. 

Adotar testes automatizados traz três superpoderes inegociáveis ao seu código:

1. **Prevenção de Regressão:** Você já consertou um bug e, sem querer, quebrou outra funcionalidade que estava perfeita? O teste automatizado é uma muralha que garante que atualizações futuras não quebrem o que já estava funcionando.
2. **O fim do trabalho manual repetitivo:** A máquina consegue rodar centenas de cenários de erro e sucesso em milissegundos. É o fim absoluto daquela rotina entediante de preencher payloads manualmente no Swagger ou olhar tabelas no DBeaver.
3. **Refatoração sem medo:** Quando você sabe que tem uma "rede de proteção", você ganha total liberdade e confiança para reescrever partes inteiras da sua arquitetura visando performance. Se os testes continuarem passando no final, você dorme tranquilo!

## 3️⃣4️⃣ Instalação das Ferramentas

Para criar nossa rede de proteção, usaremos a dupla mais moderna e eficiente do ecossistema Node.js na atualidade: **Vitest** e **Supertest**.

No seu terminal (dentro do projeto), execute o comando abaixo para instalá-los como dependências de desenvolvimento (já que testes só rodam na nossa máquina, e não no servidor de produção):

```bash
npm install -D vitest @vitest/coverage-v8 supertest @types/supertest
```

> [!TIP]  
> **Conhecendo seu novo arsenal:**
> - **`vitest`**: É o motor ultra-rápido que vai rodar os nossos testes. A grande vantagem dele sobre o antigo *Jest* é que o Vitest é **nativo para TypeScript** (zero horas perdidas com configurações complexas de compilação!).
> - **`@vitest/coverage-v8`**: Responsável por gerar um relatório visual mostrando qual a porcentagem exata do seu código que passou pelos testes (Cobertura de Código).
> - **`supertest`**: Uma biblioteca incrível que "finge" ser um usuário real. Ela inicia sua API na memória, faz requisições HTTP falsas e verifica se a resposta do servidor está correta de forma programática.

## 3️⃣5️⃣ Configuração dos Scripts

Com as ferramentas no projeto, vamos criar atalhos rápidos para comandá-las. 

Abra o arquivo `package.json` na raiz do seu projeto, encontre a seção `"scripts"` e adicione estes três novos atalhos:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

- **`test`**: Executa a bateria de testes uma única vez do início ao fim (Ideal para usar antes de enviar o código para o GitHub ou subir para produção).
- **`test:watch`**: Modo detetive! Ele fica escutando o código. A cada `Ctrl + S` que você der em qualquer arquivo, ele roda os testes instantaneamente.
- **`test:coverage`**: Roda os testes e cria um relatório completo apontando exatamente quais linhas de código estão vulneráveis por falta de testes.

> [!IMPORTANT]  
> **Terreno Preparado! 🚀**  
> Agora que o ambiente de testes está impecável, no próximo módulo nós colocaremos a mão na massa para escrever o nosso primeiro script de teste de integração da rota de Criação de Usuários!

---
➡️ *Cansado de digitar os mesmos códigos? Siga para a Parte 10:* [10-automacao-e-geracao-de-codigo.md](./10-automacao-e-geracao-de-codigo.md)
