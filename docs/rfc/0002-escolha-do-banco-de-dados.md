# RFC 0002: Escolha do banco de dados

## Resumo
Define o banco de dados relacional usado pela aplicação principal, agora provisionado como um RDS gerenciado (repositório `soat-fiap-oficina-mecanica-infra-data`) em vez de rodar dentro do cluster Kubernetes.

## Problema
O domínio da oficina mecânica é fortemente relacional (Cliente → Veículo → Ordem de Serviço → Serviços/Peças/Orçamento, ver [modelo ER](../database/modelo-er.md)), com necessidade de integridade referencial e transações ACID (ex.: cálculo de orçamento, aprovação de OS). A partir da Fase 3, o banco deixa de ser um `StatefulSet` no cluster (usado só para desenvolvimento local) e passa a ser um serviço gerenciado, exigindo uma escolha explícita de motor e de estratégia de acesso.

## Alternativas consideradas

### 1. PostgreSQL (RDS)
- **Prós**: suporte completo a ACID, chaves estrangeiras e constraints; tipos de dados ricos (JSON, arrays) se o domínio crescer; excelente integração com Prisma (migrations, tipagem gerada); solução madura, open source, sem custo de licença.
- **Contras**: exige conhecimento de SQL/administração relacional para otimizações futuras (mitigado pelo uso do Prisma para o dia a dia).

### 2. MySQL (RDS)
- **Prós**: também maduro, ACID, amplamente suportado.
- **Contras**: menos recursos avançados de tipos/consulta que o Postgres; não traz vantagem concreta sobre o Postgres para este domínio, apenas trocaria de motor sem ganho.

### 3. SQL Server (RDS)
- **Prós**: recursos corporativos avançados (Always On, etc.).
- **Contras**: custo de licenciamento; nenhum requisito do domínio (relatórios corporativos complexos, integração .NET) justifica a escolha aqui.

### 4. Banco NoSQL (ex.: DynamoDB/MongoDB)
- **Prós**: escalabilidade horizontal simples, sem schema fixo.
- **Contras**: o domínio exige justamente o oposto — relacionamentos fortes e consistência transacional entre Ordem de Serviço, Orçamento, Serviços e Peças. Modelar isso em um banco de documentos exigiria desnormalização e lógica de consistência manual na aplicação, sem necessidade real de escala horizontal do banco no volume esperado.

## Recomendação
**PostgreSQL**, mantendo a decisão já tomada e documentada em [ADR 0001](../adr/0001-uso-de-postgresql-como-banco-de-dados.md) desde a Fase 1/2 — nenhuma das alternativas resolve melhor as restrições do domínio, e a migração para RDS gerenciado (Fase 3) preserva 100% de compatibilidade com o schema Prisma existente.

## Decisão
Adotado — RDS PostgreSQL 16, provisionado no repositório `soat-fiap-oficina-mecanica-infra-data`, em subnet privada, acessível apenas pelos worker nodes do EKS e pela Lambda de autenticação. Justificativa formal completa e diagrama ER em [`docs/database/modelo-er.md`](../database/modelo-er.md).
