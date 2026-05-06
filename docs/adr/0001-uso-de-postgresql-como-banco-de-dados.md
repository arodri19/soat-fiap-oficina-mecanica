# ADR 0001: Uso do PostgreSQL como Banco de Dados Principal

## Status
Aceito

## Contexto
O sistema da Oficina Mecânica precisa armazenar dados estruturados relacionados a clientes, veículos, ordens de serviço, orçamentos, peças e serviços. O sistema possui relacionamentos estruturados complexos, como orçamentos contendo múltiplas peças e serviços, que por sua vez estão vinculados a ordens de serviço e veículos específicos. Além disso, é necessário garantir a integridade dos dados, suporte a transações (ACID) seguras e consultas eficientes para a geração de métricas operacionais da oficina. O projeto já utiliza o Prisma como ORM.

## Decisão
Decidimos adotar o **PostgreSQL** como o banco de dados relacional principal do sistema da oficina mecânica.

## Justificativa
1. **Modelo Relacional e Integridade de Dados:** O domínio do sistema exige uma estrutura fortemente relacionada (Cliente -> Veículo -> Ordem de Serviço -> Orçamento). O PostgreSQL garante a integridade referencial por meio de chaves estrangeiras, restrições e tipagem forte.
2. **Confiabilidade e Transações (ACID):** Operações críticas, como a aprovação de orçamentos associada à atualização de ordens de serviço, exigem atomicidade (operações all-or-nothing). O PostgreSQL provê total suporte a ACID.
3. **Sinergia com as Tecnologias Escolhidas:** O PostgreSQL possui integração nativa e altamente otimizada com o Prisma ORM, facilitando a criação de esquemas, versionamento do banco (migrations) e queries seguras em Node.js.
4. **Desempenho e Recursos Avançados:** Além de lidar muito bem com concorrência, o PostgreSQL possui recursos sofisticados para consultas complexas, úteis ao levantar as métricas da oficina.
5. **Maturidade e Custo:** É uma solução Open Source de altíssima adoção no mercado, madura e consolidada, eliminando custos de licenciamento e oferecendo vasta documentação.

## Consequências
- **Positivas:** 
  - Consistência rigorosa para os dados do negócio.
  - Excelente suporte a relacionamentos complexos.
  - Ambiente de desenvolvimento facilmente reprodutível utilizando Docker (já implementado no `docker-compose.yml`).
- **Negativas:** 
  - Exige conhecimento em linguagem SQL e administração de bancos relacionais para otimizações futuras.
  - Exige a gestão rigorosa de migrations sempre que o modelo de domínio sofrer alterações.
