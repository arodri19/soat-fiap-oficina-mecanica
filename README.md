# Oficina Mecânica — Backend

Backend em **Node.js / Express** com **PostgreSQL** e **Prisma ORM**, construído com **Clean Architecture** e práticas de **Clean Code**.

## Funcionalidades

- Autenticação com JWT e bcrypt (roles: `ATTENDANT`, `MECHANIC`)
- CRUD de Clientes Pessoa Física e Jurídica
- Validação de CPF e CNPJ com cálculo de **dígito verificador (módulo 11)**
- CRUD de Veículos com placas nos formatos **Antigo (ABC1234)** e **Mercosul (ABC1D23)**
- CRUD de Serviços e Peças com preços
- **Orçamento calculado automaticamente** a partir dos preços dos serviços e peças associados
- Ordens de Serviço com **máquina de estados** (transições válidas enforçadas no domínio)
- **Aprovação da ordem pelo cliente** via rota pública (`/api/track/:externalId`) sem JWT
- Reposição automática de estoque com notificação mock ao fornecedor
- Métricas de tempo médio de execução de ordens
- Testes unitários com Jest (277 testes, cobertura com relatório HTML/LCOV)

## Tecnologias

| Categoria | Tecnologias |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| ORM | Prisma |
| Banco de dados | PostgreSQL 16 |
| Autenticação | JWT + bcrypt |
| Testes | Jest + Supertest |
| Infraestrutura | Docker Compose (multi-stage build) |
| Documentação | Swagger UI |

## Arquitetura

O projeto segue **Clean Architecture**, organizando o código em camadas com dependências apontando para dentro.

```
src/
├── domain/                        ← regras de negócio puras
│   ├── entities/
│   │   ├── Order.js               ← entidade com máquina de estados
│   │   ├── Client.js              ← entidades PF e PJ
│   │   └── User.js
│   └── value-objects/
│       ├── OrderStatus.js         ← status + transições válidas como VO imutável
│       └── Document.js            ← CPF e CNPJ com dígito verificador
│
├── application/                   ← casos de uso e orquestração
│   ├── use-cases/
│   │   ├── OrderUseCases.js       ← 9 casos de uso (1 responsabilidade cada)
│   │   ├── ClientUseCases.js
│   │   └── AuthUseCases.js
│   ├── services/
│   │   ├── OrderApplicationService.js   ← fachada de DI
│   │   ├── ClientApplicationService.js
│   │   └── AuthApplicationService.js
│   └── dtos/
│       ├── OrderDTOs.js
│       ├── ClientPFDTOs.js
│       └── ...
│
├── infrastructure/                ← adaptadores externos
│   ├── interfaces/                ← contratos abstratos (DIP)
│   │   ├── IOrderRepository.js
│   │   ├── IPartRepository.js
│   │   ├── IClientRepository.js
│   │   └── IUserRepository.js
│   ├── repositories/              ← implementações Prisma
│   │   ├── PrismaOrderRepository.js
│   │   ├── PrismaPartRepository.js
│   │   ├── PrismaClientRepository.js
│   │   └── PrismaUserRepository.js
│   └── container/
│       └── Container.js           ← Service Locator (DI)
│
├── controllers/                   ← adaptadores HTTP
├── routes/                        ← mapeamento de rotas
├── middlewares/                   ← JWT auth, error handler
├── services/                      ← serviços legados (budget, metrics, etc.)
└── models/                        ← validadores de entrada (vehicle, part, etc.)
```

### Fluxo de Dependências

```
Controller → ApplicationService → UseCase → [Interface] → PrismaRepository → Prisma
                                           ↑
                                    DomainEntity / ValueObject
```

O `Container.js` instancia as dependências como singletons e injeta via construtor — sem acoplamento direto entre camadas de negócio e infraestrutura.

### Banco de Dados: PostgreSQL

Com base no **ADR 0001**, o **PostgreSQL** foi escolhido por:

- **Modelo relacional:** o domínio exige relacionamentos fortemente tipados (Cliente → Veículo → Ordem → Serviços/Peças)
- **ACID:** operações críticas de orçamento e status exigem atomicidade
- **Sinergia com Prisma:** migrations versionadas e queries seguras
- **Maturidade:** desempenho comprovado para as métricas da oficina

Para mais detalhes, consulte o [ADR 0001](docs/adr/0001-uso-de-postgresql-como-banco-de-dados.md).

## Como usar

### Pré-requisitos

- Docker e Docker Compose instalados
- (Opcional) Node.js 20+ para desenvolvimento local

### Rodar com Docker Compose

```bash
# Copia as variáveis de ambiente
cp .env.example .env

# Sobe banco, aplicação e pgAdmin
docker compose up --build
```

O backend estará disponível em `http://localhost:4000`.

> **Nota:** o `docker-compose.yml` usa `healthcheck` no PostgreSQL. A aplicação aguarda o banco estar pronto antes de iniciar e executa `prisma migrate deploy` automaticamente.

### Desenvolvimento local

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente e ajustar DATABASE_URL
cp .env.example .env

# 3. Gerar Prisma Client
npx prisma generate

# 4. Aplicar migrações (banco deve estar rodando)
npx prisma migrate dev

# 5. Popular banco com dados iniciais
npm run prisma:seed

# 6. Iniciar servidor
npm start
```

Usuário criado pelo seed:

| Campo | Valor |
|---|---|
| Email | admin@oficina.com |
| Senha | Admin123! |
| Role | ATTENDANT |

## Endpoints Obrigatórios — Fase 02

> Estes cinco endpoints são os requisitos principais entregues na **Fase 02** do Tech Challenge FIAP SOAT.

| # | Método | Rota | Descrição |
|---|---|---|---|
| 1 | `POST` | `/api/orders` | **Abertura de Ordem de Serviço** — cria nova OS com status `RECEBIDA` |
| 2 | `GET` | `/api/orders` | **Listagem de Ordens de Serviço** — retorna todas as OS com filtro por status |
| 3 | `PATCH` | `/api/orders/:id/status` | **Atualização de status da OS** — avança o status respeitando a máquina de estados |
| 4 | `GET` | `/api/track/:externalId` | **Consulta de status da OS** — rota pública (sem JWT), cliente acompanha pelo UUID |
| 5 | `POST` | `/api/track/:externalId/approve` | **Aprovação de orçamento** — cliente aprova ou reprova (`AGUARDANDO_APROVACAO → EM_EXECUCAO / CANCELADA`) |

---

## Rotas

> Rotas protegidas exigem header `Authorization: Bearer <token>`.

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cadastrar usuário |
| `POST` | `/api/auth/login` | Login (retorna JWT) |

### Clientes

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/clients/pf` | Listar clientes PF |
| `POST` | `/api/clients/pf` | Criar cliente PF |
| `GET` | `/api/clients/pf/:id` | Obter cliente PF |
| `PUT` | `/api/clients/pf/:id` | Atualizar cliente PF |
| `DELETE` | `/api/clients/pf/:id` | Remover cliente PF |
| `GET` | `/api/clients/pj` | Listar clientes PJ |
| `POST` | `/api/clients/pj` | Criar cliente PJ |
| `GET` | `/api/clients/pj/:id` | Obter cliente PJ |
| `PUT` | `/api/clients/pj/:id` | Atualizar cliente PJ |
| `DELETE` | `/api/clients/pj/:id` | Remover cliente PJ |

### Veículos

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/vehicles` | Listar veículos |
| `POST` | `/api/vehicles` | Criar veículo (placa Antigo ou Mercosul) |
| `GET` | `/api/vehicles/:id` | Obter veículo |
| `PUT` | `/api/vehicles/:id` | Atualizar veículo |
| `DELETE` | `/api/vehicles/:id` | Remover veículo |

### Serviços e Peças

| Método | Rota | Descrição |
|---|---|---|
| `GET/POST` | `/api/services` | Listar / criar serviço |
| `GET/PUT/DELETE` | `/api/services/:id` | Obter / atualizar / remover |
| `GET/POST` | `/api/parts` | Listar / criar peça |
| `GET/PUT/DELETE` | `/api/parts/:id` | Obter / atualizar / remover |

### Ordens de Serviço

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/orders` | Criar ordem de serviço |
| `GET` | `/api/orders` | Listar todas as ordens |
| `GET` | `/api/orders/:id` | Obter ordem |
| `PATCH` | `/api/orders/:id/status` | Avançar status (sequência validada) |
| `POST` | `/api/orders/:id/service` | Associar serviço (recalcula orçamento) |
| `POST` | `/api/orders/:id/part` | Associar peça (desconta estoque, recalcula orçamento) |
| `GET` | `/api/orders/:id/progress` | Progresso interno |

### Acompanhamento pelo Cliente (rota pública — sem JWT)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/track/:externalId` | Consultar progresso da ordem via UUID |
| `POST` | `/api/track/:externalId/approve` | Aprovar execução (`AGUARDANDO_APROVACAO → EM_EXECUCAO`) |

### Orçamentos e Métricas

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/budgets` | Criar orçamento consolidando múltiplas ordens |
| `GET` | `/api/budgets` | Listar orçamentos |
| `GET` | `/api/budgets/:id` | Obter orçamento |
| `PUT` | `/api/budgets/:id` | Atualizar orçamento |
| `DELETE` | `/api/budgets/:id` | Remover orçamento |
| `GET` | `/api/metrics/average-execution-time` | Tempo médio de execução de ordens |

## Máquina de Estados — Ordem de Serviço

```
RECEBIDA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → EM_EXECUCAO → FINALIZADA → ENTREGUE
```

- Transições fora da sequência retornam `400 ValidationError`
- `AGUARDANDO_APROVACAO → EM_EXECUCAO` **requer aprovação do cliente** via `/api/track/:externalId/approve`
- `startAt` é definido automaticamente ao entrar em `EM_EXECUCAO`
- `endAt` é definido automaticamente ao entrar em `FINALIZADA`

## Validações de Domínio

| Campo | Regra |
|---|---|
| CPF | 11 dígitos, rejeita sequências repetidas, valida 2 dígitos verificadores (módulo 11) |
| CNPJ | 14 dígitos, rejeita sequências repetidas, valida 2 dígitos verificadores (módulo 11) |
| Placa Antiga | Formato `ABC1234` (3 letras + 4 dígitos) |
| Placa Mercosul | Formato `ABC1D23` (3 letras + 1 dígito + 1 letra + 2 dígitos) |
| Orçamento | Calculado automaticamente: `Σ serviço.price + Σ (peça.price × quantidade)` |

## Testes

```bash
# Todos os testes
npm test

# Com relatório de cobertura
npm test -- --coverage

# Apenas unitários
npm run test:unit
```

Configuração de cobertura (`jest.config.js`):

| Camada | Threshold |
|---|---|
| `domain/value-objects` | ≥ 90% |
| `application/use-cases` | ≥ 88% |
| `application/services` | ≥ 88% |
| Global | ≥ 60% branches, 72% lines |

> Implementações Prisma (`Prisma*.js`) e interfaces abstratas (`I*.js`) são excluídas da cobertura de unit tests — são validadas em testes de integração com banco real.

## Documentação da API

Swagger UI disponível em:

```
http://localhost:4000/api-docs
```

## Exemplos de Requisição (.http)

A pasta `requests/` contém arquivos prontos para a extensão **REST Client** do VS Code:

| Arquivo | Conteúdo |
|---|---|
| `01-auth.http` | Login e Registro |
| `02-clients.http` | CRUD PF e PJ |
| `03-vehicles.http` | CRUD Veículos |
| `04-services.http` | CRUD Serviços |
| `05-parts.http` | CRUD Peças |
| `06-orders.http` | Ordens, status, serviços, peças, track |
| `07-budgets.http` | Orçamentos |
| `08-metrics.http` | Métricas |

## Observações

- O header `Authorization: Bearer <token>` é obrigatório em todas as rotas exceto `/api/auth/*` e `/api/track/*`.
- Notificações de aprovação, reposição de estoque, e-mail e pagamento são **mockadas** (`console.log`).
- Um orçamento pode consolidar múltiplas ordens de serviço.
- O `externalId` de cada ordem é um UUID gerado automaticamente e compartilhado com o cliente para acompanhamento público.
