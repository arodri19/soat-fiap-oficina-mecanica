# Apresentação — Sistema de Oficina Mecânica
## FIAP SOAT | Fase 02 | André Rodrigues Queiroz
### Tempo estimado: 10 minutos

---

## [0:00 – 1:00] INTRODUÇÃO — O QUE FOI CONSTRUÍDO

**Contexto:**
Uma oficina mecânica precisava de um sistema para gerenciar ordens de serviço, clientes, veículos, peças e serviços — tudo via API REST.

**O que entregamos:**
- API REST completa com Node.js + Express
- Banco de dados relacional PostgreSQL via Prisma ORM
- Deploy em nuvem AWS com Kubernetes (EKS)
- Pipeline CI/CD 100% automatizado via GitHub Actions
- Documentação interativa com Swagger UI

---

## [1:00 – 2:30] ARQUITETURA DE SOFTWARE — CLEAN ARCHITECTURE

**Por que Clean Architecture?**
Separação clara de responsabilidades, testabilidade e independência de framework/banco.

```
Presentation  →  src/controllers / src/routes
Application   →  src/application/use-cases / dtos
Domain        →  src/domain/entities / value-objects
Infrastructure→  src/infrastructure/repositories
```

**Destaques de design:**
- **Value Object `Document`**: valida CPF e CNPJ com dígito verificador real
- **Value Object `OrderStatus`**: máquina de estados que controla as transições válidas
- **Value Object `Plate`**: valida placa no formato Antigo (ABC-1234) e Mercosul (ABC1D23)
- **Repository Pattern**: `IOrderRepository`, `IClientRepository` — banco é detalhe de implementação
- **Container de DI**: `Container.js` centraliza a montagem das dependências

---

## [2:30 – 4:00] FUNCIONALIDADES — ENDPOINTS E REGRAS DE NEGÓCIO

### ⭐ Endpoints Obrigatórios — Fase 02

> Estes cinco endpoints são os requisitos principais da Fase 02 do Tech Challenge FIAP SOAT.

| # | Método | Rota | Descrição |
|---|---|---|---|
| **1** | `POST` | `/api/orders` | **Abertura de OS** — cria nova ordem com status `RECEBIDA` |
| **2** | `GET` | `/api/orders` | **Listagem de OS** — todas as ordens, filtrável por status |
| **3** | `PATCH` | `/api/orders/:id/status` | **Atualização de status** — avança respeitando a máquina de estados |
| **4** | `GET` | `/api/track/:externalId` | **Consulta de status** — pública, sem JWT, cliente usa UUID da OS |
| **5** | `POST` | `/api/track/:externalId/approve` | **Aprovação de orçamento** — cliente aprova → `EM_EXECUCAO` ou reprova → `CANCELADA` |

**Máquina de estados das Ordens:**
```
RECEBIDA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → EM_EXECUCAO → FINALIZADA
                                     ↓
                               CANCELADA (cliente reprova o orçamento via /track)
```

### Demais endpoints disponíveis

| Recurso | Rota base | Destaque |
|---|---|---|
| Usuários | `/api/auth` | Roles: ATTENDANT / MECHANIC + JWT |
| Clientes PF | `/api/clients/pf` | CPF validado com dígito verificador |
| Clientes PJ | `/api/clients/pj` | CNPJ validado com dígito verificador |
| Veículos | `/api/vehicles` | Placa Antiga e Mercosul |
| Serviços | `/api/services` | SLA em minutos + preço |
| Peças | `/api/parts` | Controle de estoque |
| Orçamentos | `/api/budgets` | Cálculo automático ao adicionar serviço/peça |
| Métricas | `/api/metrics` | Tempo médio, receita, OS por status |

---

## [4:00 – 5:30] INFRAESTRUTURA AWS — TERRAFORM

**Infraestrutura declarada como código com Terraform (IaC):**

```
AWS
├── VPC               — rede isolada, 2 AZs, subnets públicas e privadas
├── NAT Gateway       — pods EKS acessam internet sem exposição
├── EKS               — cluster Kubernetes gerenciado
│   └── Node Group    — t3.micro (custo mínimo para demonstração)
└── RDS PostgreSQL    — banco gerenciado em subnet privada (16.9)

Docker Hub (fora da AWS)
└── arodri19/oficina-mecanica-app — registry público de imagens Docker
```

**Boas práticas aplicadas:**
- State remoto em S3 com lock via DynamoDB (sem conflito em equipe)
- Módulos reutilizáveis: `modules/vpc`, `modules/eks`, `modules/rds`
- Secrets nunca no código — injetados via GitHub Secrets no CI/CD
- Sem recursos hardcoded — tudo parametrizado via `variables.tf`

---

## [5:30 – 7:30] PIPELINE CI/CD — GITHUB ACTIONS

**Dois workflows complementares:**

### CI — `ci.yml` (push na main)
```
1. npm ci
2. Jest com cobertura de testes
3. Docker build (multi-stage, Alpine)
4. Push para Docker Hub (público) com tag SHA + latest
```

### CD — `cd.yml` (dispara após CI com sucesso)
```
1. Guard        — bloqueia se CI falhou
2. Bootstrap    — cria S3 + DynamoDB (idempotente, sem pré-requisitos manuais)
3. Terraform    — plan + apply apenas se há mudanças (VPC, EKS, RDS)
4. Deploy EKS   — kubectl apply, aguarda rollout (300s timeout)
5. Seed         — executa prisma/seed.js dentro do pod após deploy
```

**Sem passos manuais** — qualquer push na `main` provisiona toda a infra e faz o deploy automaticamente.

**Dockerfile multi-stage:**
```dockerfile
Stage 1 (builder): node:20-alpine + npx prisma generate
Stage 2 (production): deps de produção + cliente Prisma gerado + código
```

---

## [7:30 – 8:30] KUBERNETES — MANIFESTS

**O que roda no EKS:**

| Manifest | Função |
|---|---|
| `namespace.yaml` | Isolamento: `oficina-mecanica` |
| `app-deployment.yaml` | 1 réplica + initContainer (migrate) |
| `app-service.yaml` | LoadBalancer AWS — expõe a API |
| `app-hpa.yaml` | Escala de 1 a 4 pods por CPU/memória |
| `postgres-statefulset.yaml` | PostgreSQL in-cluster (fallback local) |
| `configmap.yaml` | Variáveis não-secretas |
| `secret.yaml` | DATABASE_URL, JWT_SECRET (via kubectl) |

**initContainer de migração:**
Antes de qualquer pod da aplicação iniciar, `prisma migrate deploy` é executado — garante que o banco está sempre atualizado sem migração manual.

---

## [8:30 – 9:30] DEMONSTRAÇÃO — SWAGGER UI

**Acessar a documentação interativa:**
```
http://<LOAD_BALANCER>/api-docs
```

**Fluxo de demonstração sugerido (2 min):**

1. `POST /api/auth/login` — autenticar como `admin@oficina.com` / `Admin123!`
2. `GET /api/clients/pf` — listar clientes PF já populados pelo seed
3. `GET /api/clients/pj` — listar clientes PJ (Transportes ABC, Frota XYZ)
4. `GET /api/orders` — ver as 6 ordens em status diferentes
5. `GET /api/track/:externalId` — rastreamento público (sem token)
6. `GET /api/metrics` — tempo médio e receita das OSs finalizadas

**Dados de seed carregados automaticamente no deploy:**
- 2 usuários, 5 serviços, 5 peças
- 3 clientes PF + 2 clientes PJ
- 6 veículos (placas antigas + Mercosul)
- 6 ordens nos 5 status diferentes

---

## [9:30 – 10:00] CONCLUSÃO

**O que foi entregado:**

✅ API REST com Clean Architecture e regras de negócio reais
✅ Validações de CPF, CNPJ e placa com algoritmos corretos
✅ Máquina de estados para Ordens de Serviço
✅ Rastreamento público para o cliente final
✅ Infraestrutura cloud completa na AWS com Terraform
✅ Pipeline CI/CD 100% automatizado — zero intervenção manual
✅ Testes unitários com cobertura
✅ Documentação interativa Swagger UI

**Stack:**
`Node.js` · `Express` · `Prisma` · `PostgreSQL` · `Docker` · `Docker Hub` · `Kubernetes (EKS)` · `Terraform` · `GitHub Actions` · `AWS (EKS, RDS, VPC)`

---

*Repositório: github.com/arodri19/soat-fiap-oficina-mecanica*
