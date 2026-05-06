---
name: Replica projeto oficina
overview: Plano para recriar um backend equivalente ao projeto atual (Node.js + Express + Prisma + PostgreSQL), mantendo arquitetura por camadas, módulos de negócio, autenticação JWT, documentação Swagger, testes e execução local/Docker.
todos:
  - id: bootstrap-node-express
    content: Inicializar projeto npm, dependências e scripts equivalentes do backend atual
    status: completed
  - id: setup-prisma-postgres
    content: Modelar schema Prisma, gerar migrations e seed inicial
    status: completed
  - id: auth-jwt
    content: Implementar autenticação JWT e middleware de proteção de rotas
    status: completed
  - id: business-modules
    content: Implementar domínios centrais de Cliente, Ordem de Serviço, Orçamento, Veículo, Peças e Serviços
    status: completed
  - id: test-coverage-90
    content: Configurar e garantir cobertura mínima de 90% nos testes
    status: pending
  - id: swagger-tests-docker
    content: Configurar Swagger, testes (Jest/Supertest), Docker e documentação final
    status: completed
isProject: false
---

# Plano para recriar projeto equivalente

## Objetivo
Construir um backend novo com o mesmo escopo técnico e funcional do projeto atual de oficina mecânica, mantendo estrutura em camadas, domínio, API REST, persistência em PostgreSQL via Prisma, testes e documentação.

## Escopo técnico a replicar
- Stack: Node.js + Express + Prisma + PostgreSQL + JWT + Swagger + Jest/Supertest.
- Arquitetura em camadas (`routes`, `controllers`, `services`, `repositories`) com separação de domínio/aplicação/infraestrutura.
- Execução em dois modos: local (Node) e containerizado (Docker Compose).
- Domínios centrais obrigatórios: `Cliente`, `Ordem de Serviço`, `Orçamento`, `Veículo`, `Peças` e `Serviços`.

## Etapas de implementação
1. Inicializar projeto Node e dependências base
   - Criar projeto npm e instalar dependências de runtime e dev equivalentes às do projeto atual.
   - Definir scripts de execução, Prisma e testes no `package.json`.
   - Referência: [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/package.json`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/package.json).

2. Estruturar diretórios e bootstrap da API
   - Criar esqueleto de pastas em `src/` (entrypoint, app, config, rotas, middlewares, camadas).
   - Configurar `src/index.js`, `src/app.js`, `src/config.js`, `src/routes/index.js`.
   - Referências: [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/index.js`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/index.js), [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/app.js`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/app.js), [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/routes/index.js`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/routes/index.js).

3. Configurar banco e Prisma
   - Criar `prisma/schema.prisma` com os mesmos modelos de domínio (usuário, cliente PF/PJ, veículo, peça, serviço, ordem, orçamento e relacionamentos).
   - Gerar migrations iniciais e seed de usuário admin.
   - Referências: [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/prisma/schema.prisma`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/prisma/schema.prisma), [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/prisma/seed.js`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/prisma/seed.js).

4. Implementar autenticação e autorização
   - Criar módulo de auth (registro/login) com hash de senha e geração de JWT.
   - Implementar middleware para proteger rotas privadas e extrair usuário autenticado.
   - Referências: [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/middlewares`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/middlewares), [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/routes`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/routes).

5. Implementar módulos de negócio
   - Priorizar os domínios `Cliente`, `Ordem de Serviço`, `Orçamento`, `Veículo`, `Peças` e `Serviços` como núcleo funcional do projeto.
   - Entregar CRUD e fluxos completos desses domínios, incluindo relacionamentos e validações de negócio.
   - Replicar regras críticas relacionadas: associação de peças/serviços, baixa de estoque e cálculos de orçamento.
   - Referências: [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/services`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/services), [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/controllers`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/controllers).

6. Adicionar documentação Swagger
   - Configurar geração e UI em `/api-docs` com schemas e endpoints principais.
   - Referências: [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/swagger.js`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/swagger.js), [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/swagger-schemas.js`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/src/swagger-schemas.js).

7. Criar testes automatizados
   - Configurar Jest/Supertest e escrever suites unitárias e de integração por módulo crítico.
   - Configurar thresholds globais no Jest/NYC para cobertura mínima de 90% (`branches`, `functions`, `lines`, `statements`).
   - Manter scripts para execução local e CI com falha automática abaixo da meta.
   - Referências: [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/jest.config.js`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/jest.config.js), [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/tests`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/tests).

8. Preparar ambiente de execução e entrega
   - Criar `.env.example` com `DATABASE_URL`, `JWT_SECRET`, `PORT`.
   - Configurar `Dockerfile` e `docker-compose.yml` para API + PostgreSQL (+ pgAdmin opcional).
   - Documentar execução local e docker no README.
   - Referências: [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/Dockerfile`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/Dockerfile), [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/docker-compose.yml`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/docker-compose.yml), [`/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/README.md`](/home/andre/Projetos/fiap/soat-fiap-oficina-mecanica/README.md).

## Critérios de pronto
- API sobe localmente e via Docker sem ajustes manuais.
- Migrations e seed executam com sucesso.
- Rotas públicas/privadas funcionam com JWT.
- Fluxo completo e validado para os domínios `Cliente`, `Ordem de Serviço`, `Orçamento`, `Veículo`, `Peças` e `Serviços`.
- Swagger acessível em `/api-docs`.
- Testes unitários e de integração executando com sucesso.
- Cobertura total de testes >= 90% com threshold configurado no projeto.

## Ordem recomendada
- Primeiro: estrutura + Prisma + Auth.
- Depois: domínios centrais (`Cliente`, `Ordem de Serviço`, `Orçamento`, `Veículo`, `Peças`, `Serviços`).
- Em seguida: documentação, testes com meta de cobertura e empacotamento Docker.
- Finalizar com README e checklist de validação end-to-end.