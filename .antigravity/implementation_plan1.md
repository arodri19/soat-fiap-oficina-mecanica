# Plano de Implementação: Associar Peças aos Serviços

Este plano descreve as mudanças necessárias para alterar o relacionamento das tabelas no banco de dados, garantindo que as peças (`Part`) fiquem associadas diretamente ao serviço prestado (`Service`), em vez de ficarem "soltas" na Ordem de Serviço (`OrderService`).

## User Review Required

> [!IMPORTANT]
> Precisamos confirmar a semântica dessa alteração de banco de dados. Existem duas formas principais de interpretar "associar peças ao serviço". Qual das opções abaixo atende melhor ao que você imaginou?
>
> **Opção 1 (Catálogo)**: Um Serviço específico no catálogo *sempre* exige um conjunto padrão de Peças. (Ex: O Serviço "Troca de Óleo" do catálogo sempre vem associado à Peça "Óleo" e "Filtro"). A associação seria entre os modelos `Service` e `Part` no esquema.
>
> **Opção 2 (Execução na Ordem)**: Dentro de uma Ordem de Serviço, ao executar um serviço (ex: Troca de Óleo), as peças utilizadas naquela execução específica ficam atreladas àquele item de serviço, e não à Ordem de Serviço como um todo. A associação seria entre os modelos `OrderServiceService` (o item de serviço da OS) e `Part`.
>
> *O plano abaixo foi desenhado seguindo a **Opção 2**, pois geralmente é a forma mais flexível de faturar e rastrear o que foi gasto em cada etapa do conserto do veículo. Por favor, confirme se é isso mesmo!*

## Proposed Changes

### Prisma Schema (`prisma/schema.prisma`)
Vamos alterar a tabela intermediária atual.

#### [MODIFY] schema.prisma
- **Remover** o modelo `OrderServicePart` (que ligava `Part` a `OrderService`).
- **Criar** um novo modelo `OrderServiceServicePart` (que ligará `Part` a `OrderServiceService`).
- **Atualizar** o modelo `OrderServiceService` para incluir a lista de peças associadas àquela execução (`parts OrderServiceServicePart[]`).
- **Atualizar** o modelo `OrderService` removendo o campo `parts`.

### Seed do Banco (`prisma/seed.js`)
#### [MODIFY] seed.js
- Atualizaremos o script para criar as ordens de serviço aninhando a criação das peças *dentro* da criação dos serviços.

### Repositórios e Serviços (`src/repositories/order.repository.js` e `budget.repository.js`)
#### [MODIFY] order.repository.js e budget.repository.js
- Onde as consultas (como `findMany` e `findUnique`) pediam `include: { parts: { include: { part: true } } }` na raiz da OS, passaremos a pedir o aninhamento:
  `services: { include: { service: true, parts: { include: { part: true } } } }`

## Verification Plan

### Automated Tests
*   Rodar `npx prisma migrate dev` para aplicar a mudança estrutural.
*   Rodar os testes unitários (`npm run test`) e corrigir quaisquer quebras devido à nova estrutura de retorno das consultas.

### Manual Verification
*   Rodar o comando `npx prisma db seed` para repopular os dados no novo formato.
*   Verificar no `npx prisma studio` se a tabela `OrderServiceService` agora exibe as peças atreladas diretamente a ela.
