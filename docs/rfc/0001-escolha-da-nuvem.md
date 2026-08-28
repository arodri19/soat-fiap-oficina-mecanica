# RFC 0001: Escolha do provedor de nuvem

## Resumo
Define qual provedor de nuvem hospeda o cluster Kubernetes, o banco de dados gerenciado e a function serverless do sistema.

## Problema
A partir da Fase 2, o sistema precisa de infraestrutura real (cluster Kubernetes escalável, banco de dados gerenciado) provisionada como código. A Fase 3 adiciona uma function serverless. A escolha do provedor afeta diretamente os serviços gerenciados disponíveis (EKS/RDS/Lambda vs. GKE/Cloud SQL/Cloud Functions vs. AKS/Azure Database/Functions) e o formato do Terraform em todos os quatro repositórios.

## Alternativas consideradas

### 1. AWS (Amazon Web Services)
- **Prós**: serviços gerenciados maduros para os três pilares necessários — EKS (Kubernetes), RDS (Postgres gerenciado) e Lambda (serverless com runtime Node.js nativo e Function URLs simples de expor via HTTP). Provider Terraform (`hashicorp/aws`) extremamente completo e documentado. Camada gratuita e créditos educacionais comumente disponíveis para o contexto do desafio.
- **Contras**: curva de aprendizado de IAM (roles/policies) para cada componente (EKS, Lambda, RDS).

### 2. GCP (Google Cloud Platform)
- **Prós**: GKE tem uma experiência de gerenciamento de cluster um pouco mais simples que EKS (menos componentes manuais de IAM/CNI). Cloud Functions é direto para o caso de uso serverless.
- **Contras**: Cloud SQL exige mais configuração de rede privada (VPC peering) para acesso privado equivalente ao RDS-em-subnet-privada. Menos exemplos/comunidade no contexto do curso comparado a AWS.

### 3. Azure
- **Prós**: AKS e Azure Functions cobrem os mesmos papéis; Azure Functions tem excelente suporte a Node.js.
- **Contras**: Azure Database for PostgreSQL flexível exige decisões adicionais de tier que fogem do escopo do desafio. Menor familiaridade da equipe com o provider Terraform da Azure.

## Recomendação
**AWS**, pelos três serviços gerenciados diretamente equivalentes às três pernas de infraestrutura exigidas (EKS + RDS + Lambda), maturidade do provider Terraform, e por já ser a nuvem usada desde a Fase 2 (manter continuidade evita retrabalho de infraestrutura já provisionada e validada).

## Decisão
Adotado — ver a infraestrutura provisionada nos repositórios `soat-fiap-oficina-mecanica-infra-kube` (VPC/EKS), `soat-fiap-oficina-mecanica-infra-data` (RDS) e `soat-fiap-oficina-mecanica-serverless` (Lambda).
