# Oficina Mecânica — Backend

Backend em **Node.js / Express** com **PostgreSQL** e **Prisma ORM**, construído com **Clean Architecture** e práticas de **Clean Code**.

## Sobre o Projeto e Objetivos da Fase 02

Sistema de gestão para oficinas mecânicas: controla clientes, veículos, ordens de serviço, orçamentos, peças e estoque, do recebimento do veículo até a entrega ao cliente. É o Tech Challenge do curso **SOAT FIAP**.

A **Fase 01** entregou a API funcional — Clean Architecture, regras de domínio, testes automatizados e containerização com Docker Compose. A **Fase 02** evolui o projeto para rodar em produção na nuvem, adicionando:

- **Infraestrutura como Código (Terraform):** provisiona VPC, cluster Kubernetes gerenciado (EKS) e banco gerenciado (RDS PostgreSQL) na AWS
- **Deploy em Kubernetes:** manifestos declarativos para a aplicação (Deployment, Service, HPA) e, para uso local sem RDS, um StatefulSet de PostgreSQL
- **Autoscaling horizontal (HPA)** baseado em utilização de CPU e memória
- **Pipeline de CI/CD (GitHub Actions):** testes → build e push de imagem no Docker Hub (repositório público) → provisionamento de infraestrutura → deploy no cluster

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
| Infraestrutura | Docker Compose (dev), Terraform, AWS (EKS, RDS, VPC), Kubernetes, Docker Hub |
| CI/CD | GitHub Actions |
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

### Infraestrutura Provisionada

Desde a Fase 3, o ambiente AWS é definido como código em **dois repositórios Terraform
separados** deste (organização exigida pela Fase 3 — repositórios segregados por
responsabilidade):

- [`soat-fiap-oficina-mecanica-infra-kube`](https://github.com/arodri19/soat-fiap-oficina-mecanica-infra-kube) — VPC, cluster EKS e a API Gateway (Kong + Konga)
- [`soat-fiap-oficina-mecanica-infra-data`](https://github.com/arodri19/soat-fiap-oficina-mecanica-infra-data) — RDS PostgreSQL 16 gerenciado

Este repositório **não provisiona infraestrutura** — só contém a aplicação e os manifestos
Kubernetes (`k8s/`) aplicados no cluster já existente. A imagem Docker da aplicação fica no
Docker Hub (público), fora do escopo da AWS:

```
                          AWS
┌──────────────────────────────────────────────────────────────────────────┐
│  VPC (10.0.0.0/16) — 2 AZs                                                │
│                                                                            │
│  ┌─────────────────────────┐        ┌─────────────────────────┐          │
│  │ Subnet pública (AZ-a)     │        │ Subnet pública (AZ-b)     │          │
│  │  Internet GW · NAT GW     │        │  Internet GW · NAT GW     │          │
│  └────────────┬─────────────┘        └────────────┬─────────────┘          │
│               │  Service type=LoadBalancer (ELB)   │                       │
│  ┌────────────▼─────────────┐        ┌────────────▼─────────────┐          │
│  │ Subnet privada (AZ-a)     │        │ Subnet privada (AZ-b)     │          │
│  │                           │        │                           │          │
│  │  EKS Node Group (EC2)     │        │  EKS Node Group (EC2)     │          │
│  │   └─ Pods: oficina-app ◄──┼────────┼── docker pull (Docker Hub)│          │
│  │                           │        │                           │          │
│  │  RDS PostgreSQL 16 ◄──────┼────────┼── acessível só pelos      │          │
│  │  (subnet privada)         │        │   Security Groups do EKS  │          │
│  └───────────────────────────┘        └───────────────────────────┘          │
│                                                                            │
│  EKS Control Plane (gerenciado pela AWS, fora das subnets do cliente)     │
└──────────────────────────────────────────────────────────────────────────┘

Estado do Terraform: S3 (versionado + criptografado) + lock via DynamoDB
Imagem da aplicação: Docker Hub — arodri19/oficina-mecanica-app (público)
```

| Recurso | Repositório / Módulo | Detalhes |
|---|---|---|
| VPC, subnets, IGW, NAT GW | `infra-kube` → `modules/vpc` | 2 subnets públicas + 2 privadas, uma em cada AZ |
| Cluster EKS + Node Group | `infra-kube` → `modules/eks` | IAM roles, Security Groups, node group em subnets privadas |
| API Gateway (Kong + Konga) | `infra-kube` → `kong.tf` / `konga.tf` | Kong com Postgres dedicado; Konga como UI, acessível via port-forward |
| RDS PostgreSQL 16 | `infra-data` → `modules/rds` | Subnet privada (lida via `terraform_remote_state` do `infra-kube`), acesso restrito aos SGs do EKS |
| Repositório Docker Hub | [`docker.io/arodri19/oficina-mecanica-app`](https://hub.docker.com/r/arodri19/oficina-mecanica-app) | Público — pull sem autenticação, tags `<sha7>` e `latest` |

### Fluxo de Deploy (CI/CD)

O pipeline roda em dois workflows do GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml) e [`.github/workflows/cd.yml`](.github/workflows/cd.yml), espelhados em [`ci-cd/`](ci-cd/) para referência):

```
workflow_dispatch manual — CI (branch main)
        │
        ▼
┌──────────────────────────────────────────────┐
│ CI — ci.yml                                     │
│  1. npm ci + jest --coverage                    │
│  2. docker build (multi-stage)                  │
│  3. docker push → Docker Hub (tag <sha7> e latest) │
└──────────────────────────────────────────────────┘

workflow_dispatch manual — CD (independente do CI)
        │
        ▼
┌────────────────────────────────────────────────┐
│ CD — cd.yml                                       │
│  1. guard      → confirma disparo manual           │
│  2. deploy-k8s → aws eks update-kubeconfig          │
│                  (cluster já provisionado pelo      │
│                   repositório infra-kube)           │
│                  kubectl apply (namespace,          │
│                  configmap, secret c/ RDS,          │
│                  metrics-server, deployment,        │
│                  service, hpa)                      │
│                  kubectl rollout status              │
│                  kubectl exec … prisma seed          │
└────────────────────────────────────────────────────┘
```

- Os dois workflows são **100% manuais** (`workflow_dispatch`) — não há trigger automático em push nem encadeamento entre CI e CD.
- No CD, informe `image_tag` (SHA curto publicado pelo CI, ou `latest`) e `environment` (`dev`/`staging`/`prod`) ao disparar.
- Este repositório **não provisiona infraestrutura**: `EKS_CLUSTER_NAME` e `RDS_ENDPOINT` são GitHub Variables preenchidas a partir dos outputs dos repositórios `infra-kube` e `infra-data` — o cluster e o banco já precisam existir antes de rodar este CD.
- Credenciais e parâmetros do pipeline (Secrets/Variables do GitHub) estão documentados em [`ci-cd/secrets.example.env`](ci-cd/secrets.example.env).

## Documentação da Arquitetura

| Documento | Conteúdo |
|---|---|
| [Diagrama de Componentes](docs/architecture/diagrama-componentes.md) | Visão de nuvem, APIs, banco e monitoramento, cruzando os 4 repositórios |
| [Diagramas de Sequência](docs/architecture/diagrama-sequencia.md) | Autenticação via CPF e abertura de Ordem de Serviço |
| [Modelo de Dados (ER)](docs/database/modelo-er.md) | Diagrama ER e explicação de cada relacionamento |
| [RFC 0001](docs/rfc/0001-escolha-da-nuvem.md) | Escolha do provedor de nuvem (AWS) |
| [RFC 0002](docs/rfc/0002-escolha-do-banco-de-dados.md) | Escolha do banco de dados (PostgreSQL) |
| [RFC 0003](docs/rfc/0003-estrategia-de-autenticacao.md) | Estratégia de autenticação (JWT interno + CPF via Lambda) |
| [ADR 0001](docs/adr/0001-uso-de-postgresql-como-banco-de-dados.md) | Uso do PostgreSQL |
| [ADR 0002](docs/adr/0002-separacao-em-repositorios-por-responsabilidade.md) | Separação em 4 repositórios |
| [ADR 0003](docs/adr/0003-uso-de-hpa-para-escalabilidade-dinamica.md) | Uso de HPA para escalabilidade dinâmica |
| [ADR 0004](docs/adr/0004-kong-como-api-gateway.md) | Kong como API Gateway (+ Konga como UI) |
| [ADR 0005](docs/adr/0005-terraform-remote-state-entre-repositorios.md) | `terraform_remote_state` entre os repositórios de infraestrutura |

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

### Deploy em Kubernetes

Os manifestos ficam em [`k8s/`](k8s/). Há dois cenários de uso:

#### A) Cluster local (minikube/kind) — com PostgreSQL em StatefulSet

Sem depender do RDS nem de credenciais AWS — os manifestos já apontam para a imagem pública `arodri19/oficina-mecanica-app:latest` no Docker Hub, então o `kubectl apply` puxa a imagem diretamente, sem build local.

```bash
minikube start

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml            # valores de exemplo — trocar em produção
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml
kubectl apply -f k8s/metrics-server.yaml    # necessário para o HPA
kubectl apply -f k8s/app-deployment.yaml    # puxa arodri19/oficina-mecanica-app:latest do Docker Hub
kubectl apply -f k8s/app-service.yaml
kubectl apply -f k8s/app-hpa.yaml
```

> Para testar uma imagem construída localmente em vez da publicada no Docker Hub: `docker build -t oficina-app:local --target production .`, depois `minikube image load oficina-app:local` e ajuste `image:` em `k8s/app-deployment.yaml`.

Acompanhar o rollout e o autoscaling:

```bash
kubectl get pods -n oficina-mecanica -w
kubectl get hpa -n oficina-mecanica
```

Acessar a aplicação (o Service é `type: LoadBalancer`; em minikube, obtenha a URL local com):

```bash
minikube service oficina-app-service -n oficina-mecanica --url
# ex.: http://192.168.59.100:31197 — teste com curl $URL/api-docs/ ou os arquivos requests/*.http
```

#### B) Produção (EKS) — via pipeline de CD

Em produção, o cluster e o RDS já existem (provisionados pelo Terraform — veja a seção abaixo) e o deploy é feito pelo job `deploy-k8s` do [`cd.yml`](.github/workflows/cd.yml), que:

1. Configura o `kubectl` com `aws eks update-kubeconfig`
2. Aplica `namespace`, `configmap` e recria o `secret` com o endpoint real do RDS e as credenciais dos GitHub Secrets
3. Instala o `metrics-server` (pré-requisito do HPA)
4. Aplica `app-deployment`, `app-service` e `app-hpa`, aguarda o rollout e roda o seed

O disparo é sempre manual: aba **Actions → CD → Run workflow**, informando `image_tag` (SHA curto ou `latest`) e `environment`.

### Provisionamento de Infraestrutura

Este repositório **não provisiona infraestrutura** (ver [Infraestrutura Provisionada](#infraestrutura-provisionada)). Para subir o cluster e o banco antes de fazer deploy aqui:

```bash
# 1. VPC + EKS + API Gateway (Kong/Konga) + monitoramento K8s
cd ../soat-fiap-oficina-mecanica-infra-kube && terraform apply

# 2. RDS PostgreSQL (lê rede/security groups do apply acima via terraform_remote_state)
cd ../soat-fiap-oficina-mecanica-infra-data && terraform apply
```

Depois, configure `kubectl` e aplique os manifestos deste repositório (sem o StatefulSet de Postgres, já que o banco agora é o RDS):

```bash
$(terraform -chdir=../soat-fiap-oficina-mecanica-infra-kube output -raw kubeconfig_command)

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
eval $(terraform -chdir=../soat-fiap-oficina-mecanica-infra-data output -raw db_secret_patch_command)   # aponta o Secret para o RDS real
kubectl apply -f k8s/metrics-server.yaml
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-service.yaml
kubectl apply -f k8s/app-hpa.yaml
```

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

## Observabilidade

Integração com **New Relic** (APM + infraestrutura), adicionada na Fase 3:

- **APM**: agente `newrelic` (`newrelic.js`), carregado como primeiro `require` em `src/index.js`. Cobre latência das APIs, throughput, apdex e erros automaticamente. Fica desligado se `NEW_RELIC_LICENSE_KEY` não estiver definida (não trava a aplicação nem os testes — `agent_enabled` é `false` em `NODE_ENV=test`).
- **Logs estruturados (JSON) com correlação**: `src/middlewares/requestLogger.js` (pino + pino-http) — cada linha de log carrega um `x-request-id` (correlaciona todas as linhas da mesma requisição, devolvido também no header de resposta) e os metadados de trace da New Relic (`trace.id`/`span.id`), habilitando "logs in context" sem precisar do forwarder oficial deles.
- **Healthcheck**: `GET /health` (fora de `/api`, sem autenticação) — usado pelas `readinessProbe`/`livenessProbe` do Kubernetes (ver `k8s/app-deployment.yaml`).
- **Eventos customizados** (`src/infrastructure/monitoring/newrelicEvents.js`), emitidos pelos use cases de ordem de serviço:
  - `OrderCreated` — alimenta o painel de volume diário de OS.
  - `OrderStatusChanged` (com `secondsInPreviousStatus`) — alimenta o painel de tempo médio de execução por status.
- **Monitoramento de Kubernetes, alertas e dashboard**: providos pelo repositório [`soat-fiap-oficina-mecanica-infra-kube`](https://github.com/arodri19/soat-fiap-oficina-mecanica-infra-kube) (`newrelic-k8s.tf`, `newrelic-alerts.tf`, `newrelic-dashboard.tf`) — CPU/memória do cluster, alerta por e-mail em falhas nas rotas `/orders`, e dashboard com volume de OS, tempo médio por status, erros e latência.

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
- Notificações de aprovação, reposição de estoque e pagamento são **mockadas** (`console.log`).
- Toda transição de status da OS (`PATCH /api/orders/:id/status` e a aprovação em `/api/track/:externalId/approve`) dispara um **mock de e-mail** ao cliente (`src/infrastructure/notifications/emailNotificationService.js`), logado no console — substituível por um provedor real (Nodemailer, SendGrid etc.) sem alterar os casos de uso.
- Um orçamento pode consolidar múltiplas ordens de serviço.
- O `externalId` de cada ordem é um UUID gerado automaticamente e compartilhado com o cliente para acompanhamento público.
