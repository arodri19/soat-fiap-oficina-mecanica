# Diagrama de Componentes

Visão geral do sistema após a Fase 3: nuvem (AWS), APIs, banco de dados e monitoramento,
cruzando os quatro repositórios.

```mermaid
flowchart TB
    client["Cliente / Front-end<br/>(browser, app)"]

    subgraph AWS["AWS"]
        subgraph VPC["VPC (repositório infra-kube)"]
            subgraph EKS["Cluster EKS"]
                kong["Kong<br/>(API Gateway)"]
                konga["Konga<br/>(UI admin do Kong)"]
                app["oficina-app<br/>(Deployment + HPA)<br/>repositório soat-fiap-oficina-mecanica"]
                nrk8s["New Relic<br/>nri-bundle<br/>(CPU/memória do cluster)"]
            end
            rds[("RDS PostgreSQL 16<br/>repositório infra-data")]
        end
        lambda["Lambda auth-cpf<br/>(Function URL)<br/>repositório serverless"]
    end

    newrelic["New Relic<br/>APM + Dashboard + Alertas"]

    client -- "HTTPS" --> kong
    kong -- "proxy /api/*" --> app
    kong -- "proxy /auth/cpf" --> lambda
    konga -- "Admin API<br/>(ClusterIP interno)" --> kong

    app -- "Prisma / SQL" --> rds
    lambda -- "pg (SQL, VPC privada)" --> rds

    app -- "agente APM<br/>(eventos custom, logs, erros)" --> newrelic
    nrk8s -- "métricas do cluster" --> newrelic

    style client fill:#eef,stroke:#88a
    style rds fill:#fde,stroke:#a68
    style lambda fill:#efe,stroke:#8a8
    style newrelic fill:#ffe,stroke:#aa8
```

## Componentes por repositório

| Repositório | Componentes no diagrama |
|---|---|
| `soat-fiap-oficina-mecanica` | `app` (Deployment/Service/HPA), integração com `newrelic` (APM) |
| `soat-fiap-oficina-mecanica-serverless` | `lambda` (Function URL, acesso privado ao `rds`) |
| `soat-fiap-oficina-mecanica-infra-kube` | `VPC`, `EKS`, `kong`, `konga`, `nrk8s` (monitoramento de cluster), alertas e dashboard da New Relic |
| `soat-fiap-oficina-mecanica-infra-data` | `rds` |

Ver também: [diagrama de sequência](diagrama-sequencia.md) e [modelo de dados](../database/modelo-er.md).
