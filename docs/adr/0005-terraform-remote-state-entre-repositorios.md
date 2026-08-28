# ADR 0005: `terraform_remote_state` para integração entre os repositórios de infraestrutura

## Status
Aceito

## Contexto
Com a infraestrutura dividida em três Terraforms independentes ([ADR 0002](0002-separacao-em-repositorios-por-responsabilidade.md)) — `infra-kube` (VPC/EKS), `infra-data` (RDS) e `serverless` (Lambda) —, `infra-data` e `serverless` precisam de valores que só existem depois do `apply` de `infra-kube`: `vpc_id`, `private_subnet_ids`, e os security groups do EKS. É preciso decidir como esses valores atravessam a fronteira entre repositórios/states sem duplicar o provisionamento da rede em cada um.

## Decisão
Cada repositório consumidor lê os outputs do repositório provedor diretamente do backend S3 via `data "terraform_remote_state"`, todos compartilhando o mesmo bucket de state (`TF_STATE_BUCKET`), cada um com uma `key` própria (`oficina-mecanica/<repo>/terraform.tfstate`).

## Justificativa
1. **Sem duplicação de infraestrutura**: `infra-data` e `serverless` não recriam VPC/subnets — apenas referenciam os IDs já existentes, evitando um segundo conjunto de rede.
2. **Sem acoplamento de execução**: não é necessário orquestrar um `apply` único cruzando repositórios (como um monorepo com múltiplos módulos faria) — cada repositório roda seu próprio pipeline, na ordem certa (`infra-kube` primeiro).
3. **Simplicidade**: `terraform_remote_state` é nativo do Terraform, sem precisar de um serviço adicional (Consul, SSM Parameter Store, etc.) só para compartilhar esses poucos valores.
4. **Mesmo bucket já existente**: o backend S3 (bucket + tabela DynamoDB de lock) já era usado pelo repositório da aplicação antes da divisão — reaproveitá-lo com keys diferentes por repositório evita provisionar infraestrutura de state extra.

## Consequências
- **Positivas:**
  - Outputs sensíveis (ex.: `cluster_ca_certificate`) continuam controlados pelo Terraform, sem precisar expô-los manualmente em variáveis de ambiente ou secrets adicionais.
  - Qualquer mudança de rede em `infra-kube` (ex.: novo CIDR de subnet) se propaga automaticamente para os consumidores no próximo `plan`/`apply` deles.
- **Negativas:**
  - Ordem de `apply` importa: `infra-data` e `serverless` falham se `infra-kube` ainda não rodou (o remote state não existe).
  - Acesso de leitura ao bucket S3 do state precisa ser concedido às credenciais de CI/CD de todos os repositórios consumidores, ampliando um pouco a superfície de permissões do bucket em comparação com um state totalmente isolado por repositório.
  - Renomear ou remover um output em `infra-kube` é uma mudança que quebra contratos com os outros repositórios — não há verificação de tipo/contrato automática entre eles, exigindo disciplina/documentação (este ADR e os READMEs) para não quebrar silenciosamente.
