# ADR 0006: AWS API Gateway substitui o Kong como API Gateway

## Status
Aceito. Supera o [ADR 0004](0004-kong-como-api-gateway.md).

## Contexto
O ADR 0004 escolheu Kong (self-hosted no EKS, com Konga como UI) como API Gateway. Na
prática, rodando o projeto de ponta a ponta, isso trouxe custo operacional significativo:

- EKS não vem com o addon **EBS CSI driver** nem o **IMDS hop-limit** configurado para
  pods (ambos pré-requisitos para qualquer `PersistentVolumeClaim` funcionar) — sem os
  dois, o Postgres dedicado do Kong e o volume do Konga ficam presos em `Pending`
  indefinidamente.
- A `StorageClass` padrão do EKS (`gp2`) não vem marcada como `default` — mesmo com o
  addon instalado, PVCs sem `storageClassName` explícito continuam sem bindar.
- **Konga está sem manutenção ativa** — a tag pinada (`0.14.9`) tem um bug conhecido e
  não resolvido (inconsistência no ORM interno do Sails.js) que a deixa em
  `CrashLoopBackOff` permanente, mesmo com toda a configuração correta.
- A imagem do Postgres do Kong (chart Bitnami) parou de ser publicada no Docker Hub
  público na tag pinada pelo chart, exigindo apontar manualmente para
  `bitnamilegacy/postgresql`.
- Kong+Konga+Postgres dedicado competem por capacidade de pod com a própria aplicação e
  com o monitoramento do New Relic — em node único (`t3.small`), o cluster estourava o
  limite de pods por node antes mesmo do app principal subir.
- Só as rotas apontando para a Lambda (`/auth/cpf`, `/me`) chegaram a ser
  provisionadas via Terraform; as rotas para a aplicação principal continuavam
  dependendo de configuração manual via Konga/Admin API, sem versionamento.

Nenhum desses problemas é do domínio do problema (autenticação, roteamento) — são todos
overhead operacional de manter um gateway self-hosted rodando bem.

## Decisão
Substituir o Kong pelo **AWS API Gateway** (HTTP API), com um **Lambda Authorizer**
customizado para validar o JWT nas rotas protegidas, provisionado no repositório
`soat-fiap-oficina-mecanica-serverless` (deixa de existir em `infra-kube`).

Não usamos o **authorizer JWT nativo** da API Gateway: ele exige tokens assinados com
RS256 e um endpoint JWKS público para validar a assinatura. Os tokens deste projeto são
HS256 (segredo compartilhado) — mudar para RS256 exigiria alterar o middleware
`authenticate` do backend principal e gerenciar um par de chaves. Um Lambda Authorizer
replica exatamente a mesma validação (`jwt.verify` com o mesmo segredo, mesmo claim
`iss`) sem mudar mais nada no projeto.

## Justificativa
1. **Zero infraestrutura para manter**: sem cluster, sem Postgres dedicado, sem imagem
   para atualizar, sem PVC para bindar. O AWS API Gateway é um serviço gerenciado.
2. **Sem VPC Link necessário**: as únicas rotas hoje provisionadas via Terraform
   apontam para Lambdas (não para a aplicação dentro da VPC), então a integração é
   direta (`AWS_PROXY`) — não há custo/complexidade de VPC Link neste momento. Se no
   futuro uma rota precisar apontar para o `oficina-app` dentro do EKS, aí sim
   valeria reavaliar (VPC Link tem custo fixo por hora).
3. **Custo**: cobrança por requisição (sem custo fixo de compute/LoadBalancer) — mais
   barato que o Kong para o volume de tráfego esperado neste projeto (dev/teste), e
   comparável ou melhor mesmo em produção com tráfego moderado.
4. **Compatível com o JWT já emitido**: o Lambda Authorizer mantém o mesmo segredo/
   formato de token que o backend principal já valida — nenhuma mudança em
   `soat-fiap-oficina-mecanica`.
5. **Ainda é código**: rotas, integrações e o autorizador continuam 100% Terraform
   (`api-gateway.tf`, `authorizer.tf`), ao contrário das rotas do Kong (que dependiam de
   configuração manual via Konga/Admin API).

## Consequências
- **Positivas:**
  - Repositório `infra-kube` fica bem mais simples: sem Kong/Konga, sem EBS CSI driver,
    sem hop-limit de IMDS, sem `StorageClass` default — o cluster nem precisa mais de
    volumes persistentes.
  - Pipeline de CI/CD do `infra-kube` perde vários passos de contorno de bugs de
    infraestrutura que existiam só por causa do Kong/Konga.
  - Rotas versionadas 100% em Terraform, incluindo a autorização.
- **Negativas:**
  - Perde-se a extensibilidade via plugins do Kong (rate limiting, transformações,
    etc.) — se o projeto precisar disso no futuro, teria que ser implementado como
    lógica própria (ex: no Lambda Authorizer ou em middlewares da aplicação).
  - Se uma rota futura precisar apontar para dentro da VPC (ex: o `oficina-app`), será
    necessário um VPC Link — custo fixo adicional que hoje não existe.
