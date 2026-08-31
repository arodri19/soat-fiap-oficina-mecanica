# ADR 0007: Pipelines de CD 100% manuais (`workflow_dispatch`), sem deploy automático

## Status
Aceito.

## Contexto
O enunciado da Fase 3 pede, na seção "Estrutura de Repositórios e CI/CD":

> Branch `main`/`master` protegida (sem commits diretos). Uso obrigatório de Pull
> Requests para merge. **Deploy automático das branches de homologação e produção.**

Nos quatro repositórios deste projeto (`soat-fiap-oficina-mecanica`, `infra-kube`,
`infra-data`, `serverless`), todo pipeline de **CD** (deploy/provisionamento) é disparado
exclusivamente via `workflow_dispatch` — nenhum push em `main`/`homologacao`, merge de PR
ou tag aciona deploy automaticamente. Os pipelines de **CI** (lint, testes) continuam
automáticos em cada push/PR — a decisão aqui é só sobre o CD.

Essa é uma divergência deliberada do enunciado, não um esquecimento. Motivo: o projeto
usa infraestrutura 100% sob demanda (EKS, RDS, NAT Gateway, API Gateway) — nenhum
desses recursos fica de pé fora das janelas de teste. Com deploy automático em cada
merge, qualquer PR aceito nas branches protegidas dispararia um `terraform apply` contra
uma infraestrutura que, na maior parte do tempo, **nem existe** (foi destruída
propositalmente para não gerar custo — ver o padrão de `terraform destroy` documentado
nos READMEs de `infra-kube` e `infra-data`). Isso quebraria o pipeline por padrão, e
corrigir isso "auto-provisionando tudo antes de deployar" tornaria cada merge trivial em
um evento caro e demorado (o cluster EKS sozinho leva minutos para subir, ver runbook de
custo no README de `infra-kube`).

## Decisão
Manter todo CD como `workflow_dispatch` manual, em todos os quatro repositórios, tanto
para o ambiente de `dev` quanto para o que seria homologação/produção. Quem decide
*quando* provisionar/deployar é uma pessoa, olhando o estado atual da infraestrutura —
não o merge de um PR.

## Justificativa
1. **Controle de custo é o requisito mais alto deste projeto neste momento** — infra
   sob demanda só faz sentido se ninguém automatiza o "ligar". Um merge não é o mesmo
   evento que "quero pagar pela infra agora".
2. **CI continua automático** — a parte do enunciado que garante qualidade de código a
   cada push (lint, testes, build) não foi relaxada; só o *deploy* é manual.
3. **PR + branch protegida continuam obrigatórios** — a parte de governança de código
   do requisito (`main` protegida, PR obrigatório) está implementada normalmente; a
   única peça alterada é o gatilho do deploy.
4. **`workflow_dispatch` já está pronto para virar automático** — se o projeto for
   promovido a um contexto com infraestrutura permanente (não mais sob demanda), basta
   adicionar um trigger `push`/`pull_request` nos workflows de CD existentes; nenhuma
   lógica de deploy precisa mudar.

## Consequências
- **Positivas:**
  - Nenhum PR aceito dispara gasto de infraestrutura sem uma decisão explícita.
  - Fica impossível "esquecer" infraestrutura de pé por causa de um merge — quem sobe,
    sabe que subiu, porque disparou manualmente.
- **Negativas:**
  - Diverge do texto literal do enunciado ("deploy automático das branches de
    homologação e produção") — por isso este ADR existe: para deixar a decisão e o
    motivo registrados, em vez de simplesmente não atender o item.
  - Deploys dependem de alguém lembrar de disparar o workflow — não há
    "PR mergeado = ambiente atualizado" garantido automaticamente.
