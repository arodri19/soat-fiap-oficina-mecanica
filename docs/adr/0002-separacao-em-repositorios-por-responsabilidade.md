# ADR 0002: Separação do sistema em quatro repositórios por responsabilidade

## Status
Aceito

## Contexto
Até a Fase 2, todo o código-fonte, os manifestos Kubernetes e o Terraform (VPC, EKS e RDS) viviam em um único repositório (`soat-fiap-oficina-mecanica`). A Fase 3 exige repositórios independentes por responsabilidade, cada um com seu próprio pipeline de CI/CD e deploy automático, e reforça a necessidade de isolar o *blast radius* de mudanças: um erro no Terraform da infraestrutura de dados não deveria travar o deploy da aplicação, e vice-versa.

## Decisão
Dividir o sistema em quatro repositórios:

1. **`soat-fiap-oficina-mecanica`** — aplicação principal (Node.js/Express), executando em Kubernetes. Contém só código de aplicação e manifestos K8s (`k8s/`), sem Terraform.
2. **`soat-fiap-oficina-mecanica-serverless`** — Function Serverless (AWS Lambda) de autenticação de clientes via CPF, com seu próprio Terraform.
3. **`soat-fiap-oficina-mecanica-infra-kube`** — Terraform da rede (VPC) e do cluster Kubernetes (EKS), da API Gateway (Kong + Konga) e do monitoramento de cluster (New Relic).
4. **`soat-fiap-oficina-mecanica-infra-data`** — Terraform do banco de dados gerenciado (RDS PostgreSQL).

A comunicação entre os Terraforms de infraestrutura acontece via `terraform_remote_state` (cada repositório lê os outputs de que precisa do state dos outros, publicado no mesmo bucket S3) — ver [ADR 0005](0005-terraform-remote-state-entre-repositorios.md).

## Justificativa
1. **Isolamento de mudanças e de blast radius**: um `apply` no RDS não pode derrubar o cluster EKS, e um deploy da aplicação não deveria conseguir alterar infraestrutura.
2. **Times/ritmos diferentes**: código de aplicação muda a cada feature; infraestrutura de rede/cluster muda raramente. Repositórios separados evitam que revisões de infraestrutura fiquem "escondidas" no meio de PRs de funcionalidade.
3. **CI/CD dedicado**: cada repositório tem um pipeline com passos e segredos específicos ao seu domínio (build+testes+imagem Docker vs. `terraform plan/apply`), em vez de um pipeline monolítico com jobs condicionais.
4. **Requisito explícito da Fase 3**: a especificação pede exatamente essa divisão em 4 repositórios.

## Consequências
- **Positivas:**
  - Permissões de CI/CD podem ser escopadas por repositório (o repositório da aplicação não precisa de credenciais com poder de criar/destruir VPC ou RDS).
  - Histórico de commits mais legível — mudanças de infraestrutura não se misturam com mudanças de negócio.
  - Cada Terraform tem seu próprio state, reduzindo o risco de um `apply` acidental afetar recursos não relacionados.
- **Negativas:**
  - Coordenação entre repositórios exige ordem de `apply` (`infra-kube` antes de `infra-data`/`serverless`, que dependem dele via remote state).
  - Mudanças que cruzam repositórios (ex.: um novo output necessário em `infra-kube` para o `serverless` consumir) exigem PRs coordenados em mais de um lugar.
  - Mais repositórios para manter (README, CI/CD, dependências) do que um monólito único.
