# ADR 0004: Kong como API Gateway, com Konga como UI de administração

## Status
Aceito

## Contexto
A Fase 3 exige um API Gateway para "controle e roteamento", citando como exemplos AWS API Gateway, Kong e Traefik. O sistema passou a ter dois back-ends distintos por trás de uma única superfície de API: a aplicação principal (Kubernetes/EKS) e a function serverless de autenticação via CPF (AWS Lambda). É necessário um ponto único de entrada capaz de rotear para ambos.

## Decisão
Usar **Kong** como API Gateway, rodando dentro do próprio cluster Kubernetes (Helm chart oficial `kong/kong`, repositório `soat-fiap-oficina-mecanica-infra-kube`), com **Konga** como interface de administração.

## Justificativa
1. **Roda no mesmo cluster que a aplicação**: evita depender de mais um serviço gerenciado específico de nuvem (como o AWS API Gateway), mantendo a escolha de nuvem mais portável — o Kong roda igualmente em qualquer Kubernetes (EKS, GKE, AKS ou local), alinhado com a decisão de infraestrutura como código já adotada.
2. **Suporta os dois tipos de backend do sistema**: proxy HTTP genérico para a aplicação (Service Kubernetes) e para a Lambda (Function URL), sem precisar de dois gateways diferentes.
3. **Extensível via plugins**: autenticação, rate limiting e observabilidade podem ser adicionados depois como plugins Kong, sem reescrever a camada de roteamento.
4. **Konga como UI**: simplifica a configuração de `Services`/`Routes` sem exigir chamadas manuais à Admin API do Kong para o dia a dia operacional — mesmo com o projeto do Konga sem manutenção ativa, ele ainda cumpre bem esse papel de UI simples de administração (documentado no ADR como trade-off aceito).

## Consequências
- **Positivas:**
  - Um único ponto de entrada e roteamento para todos os backends (Kubernetes e Lambda).
  - Infraestrutura do gateway como código (Terraform + Helm), consistente com o resto do projeto.
  - Admin API do Kong mantida `ClusterIP`-only (nunca exposta publicamente) — reduz superfície de ataque.
- **Negativas:**
  - Kong precisa de um Postgres dedicado para seu datastore, adicionando um componente stateful a mais no cluster (distinto do RDS da aplicação).
  - Konga está sem manutenção ativa upstream — é usado conscientemente como uma UI "suficiente", não como uma escolha de longo prazo; `Services`/`Routes` também podem ser geridos via Admin API diretamente se o Konga se tornar um problema.
  - Rotas (`Services`/`Routes` do Kong) não são gerenciadas via Terraform neste projeto — são configuradas via Konga/Admin API após o `apply`, o que significa que não há versionamento automático dessa configuração específica.
