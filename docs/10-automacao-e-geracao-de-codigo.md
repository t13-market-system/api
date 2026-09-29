# ⚡ Automação e Produtividade (Geradores de Código)

> [!NOTE]  
> Você já sabe criar Rotas, Controladores, Serviços e Schemas do zero. Essa é a base de um desenvolvedor forte! Porém, no mercado de trabalho, se tivermos 30 ou 50 tabelas no banco de dados, criar dezenas de arquivos idênticos à mão é um desperdício de tempo. Para ganharmos a velocidade de um desenvolvedor Sênior, vamos automatizar a criação do código repetitivo (*boilerplate*) usando o **Plop.js**.

## A Regra de Ouro da Arquitetura
*"A arquitetura do projeto deve ser verbosa e segura, mas a sua digitação não."*

## 3️⃣6️⃣ Instalando o Plop.js

O Plop.js é uma ferramenta muito famosa em projetos Node e React. Ele faz perguntas simples no terminal e cria arquivos inteiros baseados em "moldes" pré-definidos.

No terminal, instale o pacote:

```bash
npm install -D plop
```

E crie o atalho no seu `package.json`:

```json
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "test": "vitest run",
    "generate": "plop" 
  }
```

## 3️⃣7️⃣ Criando os Moldes (Templates)

O Plop usa uma linguagem de marcação chamada Handlebars (`.hbs`). Nela, podemos injetar o nome que digitarmos no terminal diretamente no código. Se digitarmos "produto", ele formata para `ProdutoService` ou `produto.controller.ts` automaticamente.

Crie uma pasta chamada `plop-templates` na raiz do seu projeto. Dentro dela, vamos criar um molde de exemplo para o seu **Serviço**.

Crie o arquivo `plop-templates/service.ts.hbs`:

```typescript
// src/services/{{camelCase name}}.service.ts
import { prisma as db } from '../lib/prisma';

export class {{pascalCase name}}Service {
  
  // 🟢 CRIAR
  static async create(data: any) {
    return await db.orm.public.{{pascalCase name}}.create(data);
  }

  // 🔵 LISTAR TODOS
  static async getAll() {
    return await db.orm.public.{{pascalCase name}}.all();
  }

  // 🟠 BUSCAR POR ID
  static async getById(id: number) {
    const record = await db.orm.public.{{pascalCase name}}.first({ id });
    if (!record) throw new Error('{{pascalCase name}} não encontrado.');
    return record;
  }
}
```

> [!TIP]  
> Você pode fazer o mesmo e criar os moldes para `controller.ts.hbs`, `route.ts.hbs` e `schema.ts.hbs`. O limite da automação é a sua imaginação!

## 3️⃣8️⃣ O Arquivo Maestro (plopfile.js)

Agora precisamos ensinar o Plop a ler o nosso molde e jogá-lo na pasta correta (`src/services/`).

Na raiz do seu projeto (junto com o `package.json`), crie o arquivo `plopfile.js`:

```javascript
export default function (plop) {
  plop.setGenerator('recurso', {
    description: 'Gera a base de código para uma nova tabela (CRUD completo)',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Qual o nome do recurso? (ex: produto, categoria, pedido)',
      },
    ],
    actions: [
      // Ação 1: Criar o Serviço
      {
        type: 'add',
        path: 'src/services/{{camelCase name}}.service.ts',
        templateFile: 'plop-templates/service.ts.hbs',
      },
      // Aqui você poderia adicionar ações para gerar as Rotas, Controladores, etc.
    ],
  });
}
```

## 3️⃣9️⃣ A Mágica Acontecendo! 🪄

Agora, abra o seu terminal e rode o comando que criamos:

```bash
npm run generate
```

O terminal vai te perguntar:  
`? Qual o nome do recurso? (ex: produto, categoria, pedido)`

Se você digitar **`cliente`** e dar Enter, o Plop vai instantaneamente criar o arquivo `src/services/cliente.service.ts`, já com as funções `ClienteService.create()`, `ClienteService.getAll()` apontando corretamente para o banco de dados.

> [!IMPORTANT]  
> **Você acaba de elevar o seu nível!** 🚀  
> Imagine ter os 4 moldes criados (Service, Controller, Route, Zod). Com apenas UMA palavra no terminal, você cria a engrenagem inteira e funcional em menos de 1 segundo. Isso é o que difere desenvolvedores comuns de verdadeiros engenheiros de software focados em produtividade comercial.
