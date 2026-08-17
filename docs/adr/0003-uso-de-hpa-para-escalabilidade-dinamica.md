# ADR 0003: Uso de Horizontal Pod Autoscaler (HPA) para escalabilidade dinâmica

## Status
Aceito

## Contexto
A Fase 2 já exigia que a aplicação suportasse "grandes volumes de ordens de serviço em horários de pico, com escalabilidade dinâmica". A Fase 3 reforça a necessidade de um cluster Kubernetes "com escalabilidade" e de monitorar consumo de CPU/memória. A aplicação roda como um `Deployment` stateless (sem estado em memória entre requisições — todo estado fica no PostgreSQL via Prisma), o que a torna candidata natural a escalonamento horizontal.

## Decisão
Usar o **Horizontal Pod Autoscaler** nativo do Kubernetes (`k8s/app-hpa.yaml`) para escalar o número de réplicas do `Deployment` `oficina-app` conforme o consumo de CPU, em vez de escalonamento manual ou de uma solução externa (KEDA, Cluster Autoscaler de aplicação, etc.).

## Justificativa
1. **Aplicação stateless**: como não há sessão nem cache em memória por pod, múltiplas réplicas atrás do `Service` funcionam de forma transparente — não há necessidade de sticky sessions.
2. **Sinal de escala simples e suficiente**: a carga de trabalho é dominada por requisições HTTP CRUD e algumas consultas ao Postgres — consumo de CPU é um proxy razoável de carga, sem precisar de métricas customizadas (filas, latência) para o volume esperado do desafio.
3. **Nativo do Kubernetes**: não introduz um novo componente para operar (like KEDA) — usa o `metrics-server` (já provisionado em `k8s/metrics-server.yaml`) e a API padrão `autoscaling/v2`.
4. **Combina com o Cluster Autoscaler de nós**: o `node_desired_size`/`node_max_size` do módulo EKS (repositório `infra-kube`) permite que, se o HPA pedir mais pods do que os nós atuais comportam, o Kubernetes ainda tenha onde agendá-los.

## Consequências
- **Positivas:**
  - Escalonamento automático e reativo a picos de acesso, sem intervenção manual.
  - Configuração simples e auditável em um único manifesto YAML.
- **Negativas:**
  - CPU não captura gargalos de I/O (ex.: uma query lenta no Postgres que não consome CPU, mas segura conexões) — pode não escalar em cenários onde o gargalo é o banco, não a aplicação.
  - `RollingUpdate` com `maxSurge: 0` (ver `k8s/app-deployment.yaml`) limita a velocidade de rollout quando combinado com scale-up simultâneo — trade-off aceito para não exceder o `node_max_size` durante deploys.
