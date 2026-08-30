# Diagramas de Sequência

## 1. Autenticação do cliente via CPF e consulta protegida

```mermaid
sequenceDiagram
    actor Cliente
    participant GW as API Gateway
    participant Lambda as Lambda auth-cpf
    participant RDS as RDS PostgreSQL
    participant App as oficina-app

    Cliente ->> GW: POST /auth/cpf { cpf }
    GW ->> Lambda: proxy (AWS_PROXY)
    Lambda ->> Lambda: valida dígito verificador do CPF
    alt CPF inválido
        Lambda -->> GW: 400 CPF inválido
        GW -->> Cliente: 400
    else CPF válido
        Lambda ->> RDS: SELECT id, name, cpf FROM ClientPF WHERE cpf = $1
        alt cliente não encontrado
            RDS -->> Lambda: nenhuma linha
            Lambda -->> GW: 404 Cliente não encontrado
            GW -->> Cliente: 404
        else cliente encontrado
            RDS -->> Lambda: { id, name, cpf }
            Lambda ->> Lambda: jwt.sign({ sub, cpf, name, role: CLIENT })
            Lambda -->> GW: 200 { token, expiresIn, client }
            GW -->> Cliente: 200 { token, ... }
        end
    end

    Note over Cliente,App: chamadas seguintes usam o token como Bearer.<br/>App e API Gateway validam o MESMO token de forma<br/>independente (mesmo JWT_SECRET) — não há proxy entre eles.

    Cliente ->> App: GET /api/track/:externalId<br/>Authorization: Bearer <token>
    App ->> App: authenticate (valida JWT, mesmo JWT_SECRET)
    App ->> App: authorize(["CLIENT"]) — checa role no payload
    App -->> Cliente: 200 progresso da OS
```

## 2. Abertura de Ordem de Serviço

```mermaid
sequenceDiagram
    actor Atendente
    participant App as oficina-app
    participant RDS as RDS PostgreSQL
    participant NR as New Relic

    Atendente ->> App: POST /api/orders<br/>Authorization: Bearer <token staff><br/>{ cliente, veículo, serviços, peças }
    App ->> App: authenticate (JWT de funcionário)
    App ->> App: CreateOrderUseCase.execute(dto)
    App ->> RDS: INSERT OrderService (status = RECEBIDA)
    loop para cada serviço solicitado
        App ->> RDS: INSERT OrderServiceService
        loop para cada peça do serviço
            App ->> RDS: verifica estoque da Part
            alt estoque insuficiente
                App ->> RDS: UPDATE Part.quantity (mock de reposição)
            end
            App ->> RDS: UPDATE Part.quantity (baixa do estoque)
            App ->> RDS: INSERT OrderServiceServicePart
        end
    end
    App ->> RDS: calcula e grava budgetValue<br/>(Σ serviço.price + Σ peça.price × quantidade)
    App ->> NR: recordCustomEvent("OrderCreated", { orderId, externalId, servicesCount, budgetValue })
    App -->> Atendente: 201 { id, externalId, status: RECEBIDA, budgetValue, ... }
```

Ver também: [diagrama de componentes](diagrama-componentes.md) e [modelo de dados](../database/modelo-er.md).
