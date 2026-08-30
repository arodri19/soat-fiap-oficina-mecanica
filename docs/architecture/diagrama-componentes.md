# Diagrama de Componentes

Visão geral do sistema após a Fase 3: nuvem (AWS), APIs, banco de dados e monitoramento,
cruzando os quatro repositórios.

```mermaid
flowchart TB
    client["Cliente / Front-end<br/>(browser, app)"]

    subgraph AWS["AWS"]
        subgraph VPC["VPC (repositório infra-kube)"]
            subgraph EKS["Cluster EKS"]
                app["oficina-app<br/>(Deployment + HPA)<br/>repositório soat-fiap-oficina-mecanica"]
                nrk8s["New Relic<br/>nri-bundle<br/>(CPU/memória do cluster)"]
            end
            rds[("RDS PostgreSQL 16<br/>repositório infra-data")]
        end
        subgraph GWStack["repositório serverless"]
            apigw["API Gateway<br/>(HTTP API)"]
            authorizer["Lambda Authorizer<br/>(valida JWT)"]
            lambda["Lambda auth-cpf"]
        end
    end

    newrelic["New Relic<br/>APM + Dashboard + Alertas"]

    client -- "HTTPS<br/>(rotas /api/*)" --> app
    client -- "POST /auth/cpf<br/>GET /me (demo)" --> apigw
    apigw -- "AWS_PROXY" --> lambda
    apigw -- "REQUEST authorizer<br/>(rota /me)" --> authorizer

    app -- "Prisma / SQL" --> rds
    lambda -- "pg (SQL, VPC privada)" --> rds

    app -- "agente APM<br/>(eventos custom, logs, erros)" --> newrelic
    nrk8s -- "métricas do cluster" --> newrelic

    style client fill:#eef,stroke:#88a
    style rds fill:#fde,stroke:#a68
    style lambda fill:#efe,stroke:#8a8
    style authorizer fill:#efe,stroke:#8a8
    style newrelic fill:#ffe,stroke:#aa8
```

Tokens JWT são emitidos pela `lambda` (login) e validados de duas formas independentes com o
**mesmo segredo** (`JWT_SECRET`): pelo `authorizer` nas rotas da API Gateway, e pelo middleware
`authenticate` do `app` nas rotas `/api/*` — nenhum dos dois depende do outro.

## Componentes por repositório

| Repositório | Componentes no diagrama |
|---|---|
| `soat-fiap-oficina-mecanica` | `app` (Deployment/Service/HPA), integração com `newrelic` (APM) |
| `soat-fiap-oficina-mecanica-serverless` | `apigw`, `authorizer`, `lambda` (acesso privado ao `rds`) |
| `soat-fiap-oficina-mecanica-infra-kube` | `VPC`, `EKS`, `nrk8s` (monitoramento de cluster), alertas e dashboard da New Relic |
| `soat-fiap-oficina-mecanica-infra-data` | `rds` |

Ver também: [diagrama de sequência](diagrama-sequencia.md) e [modelo de dados](../database/modelo-er.md).
