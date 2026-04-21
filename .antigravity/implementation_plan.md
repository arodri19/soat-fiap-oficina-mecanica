# Plano de Implementação: Seed do Banco de Dados com Prisma

Este plano descreve as alterações necessárias para popular o banco de dados do projeto com dados de exemplo utilizando o Prisma. O objetivo é criar três instâncias de cada um dos seguintes domínios: Cliente, Veículo, Ordem de Serviço, Orçamento, Peças e Serviços.

## User Review Required

> [!IMPORTANT]
> Por favor, revise os dados propostos para o seed do banco de dados. Os dados são fictícios e criados apenas para fins de teste e desenvolvimento. Confirme se as relações estabelecidas (ex: quais peças e serviços vão em quais ordens de serviço) estão adequadas para o seu cenário de testes.

## Open Questions

> [!WARNING]
> O domínio "Cliente" no Prisma está dividido entre `ClientPF` e `ClientPJ`. O plano atual propõe criar 3 instâncias de `ClientPF`. Você gostaria que fosse uma mistura (ex: 2 `ClientPF` e 1 `ClientPJ`), ou apenas `ClientPF` já é suficiente?

## Proposed Changes

Os dados serão inseridos atualizando o arquivo `prisma/seed.js`. O script atual apenas cria um usuário administrador. Nós vamos expandi-lo.

### prisma

Atualizaremos o script de seed para criar os registros na ordem correta, respeitando as restrições de chaves estrangeiras.

#### [MODIFY] [seed.js](file:///home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/prisma/seed.js)

O arquivo será modificado para incluir as seguintes criações (3 de cada):

1.  **Serviços (`Service`)**:
    *   Exemplo 1: Troca de Óleo (SLA: 60 mins)
    *   Exemplo 2: Alinhamento e Balanceamento (SLA: 120 mins)
    *   Exemplo 3: Revisão Completa (SLA: 240 mins)
2.  **Peças (`Part`)**:
    *   Exemplo 1: Óleo de Motor 5W40 (Quantidade: 50)
    *   Exemplo 2: Filtro de Óleo (Quantidade: 30)
    *   Exemplo 3: Pastilha de Freio (Quantidade: 20)
3.  **Clientes (`ClientPF`)**:
    *   Exemplo 1: João Silva (CPF: 111.222.333-44)
    *   Exemplo 2: Maria Oliveira (CPF: 555.666.777-88)
    *   Exemplo 3: Carlos Souza (CPF: 999.888.777-66)
4.  **Veículos (`Vehicle`)**:
    *   Exemplo 1: Honda Civic 2020 (Placa: ABC-1234, vinculado ao João)
    *   Exemplo 2: Toyota Corolla 2021 (Placa: DEF-5678, vinculado à Maria)
    *   Exemplo 3: VW Nivus 2022 (Placa: GHI-9012, vinculado ao Carlos)
5.  **Orçamentos (`Budget`)**:
    *   Exemplo 1: Total R$ 350,00
    *   Exemplo 2: Total R$ 800,00
    *   Exemplo 3: Total R$ 1500,00
6.  **Ordens de Serviço (`OrderService`)**:
    *   Exemplo 1: Status `FINALIZADA`, usando o Serviço 1 e a Peça 1. Vinculado ao Veículo 1 e Orçamento 1.
    *   Exemplo 2: Status `EM_EXECUCAO`, usando o Serviço 2. Vinculado ao Veículo 2 e Orçamento 2.
    *   Exemplo 3: Status `AGUARDANDO_APROVACAO`, usando o Serviço 3 e a Peça 3. Vinculado ao Veículo 3 e Orçamento 3.

## Verification Plan

### Automated Tests
*   Executar o comando de reset e seed do Prisma: `npx prisma migrate reset --force` seguido de `npm run prisma:seed` ou `npx prisma db seed`.

### Manual Verification
*   Acessar o banco de dados via Prisma Studio (`npx prisma studio`) para verificar visualmente se as tabelas foram populadas com os 3 registros de cada entidade solicitada e se os relacionamentos estão corretos.
