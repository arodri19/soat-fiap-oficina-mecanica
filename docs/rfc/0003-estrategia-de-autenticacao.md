# RFC 0003: Estratégia de autenticação

## Resumo
Define como a aplicação autentica dois públicos distintos — **funcionários** (atendentes/mecânicos, via login e senha) e **clientes** (via CPF, sem senha) — e como os tokens resultantes protegem as rotas sensíveis da API.

## Problema
Até a Fase 2, só existia autenticação de funcionários (email/senha → JWT), e as rotas de rastreamento/aprovação de orçamento pelo cliente (`/api/track/*`) eram públicas, sem nenhuma verificação de identidade — qualquer pessoa com o `externalId` (UUID) da OS conseguia consultar e aprovar orçamentos. A Fase 3 exige proteger rotas sensíveis com autenticação via CPF e uma function serverless dedicada a esse fluxo.

## Alternativas consideradas

### 1. Reaproveitar o login de funcionários (email/senha) também para clientes
- **Prós**: reaproveita a infraestrutura de autenticação já existente.
- **Contras**: clientes não têm (nem deveriam precisar criar) conta com senha só para acompanhar uma OS — atrito desnecessário para um fluxo de uso ocasional. Não atende ao requisito explícito de autenticação "via CPF".

### 2. Sessão/cookie no `externalId`
- **Prós**: simples de implementar.
- **Contras**: não é autenticação de fato (continua sendo "quem tem o link, acessa"), não usa CPF, e não gera um token portável entre chamadas de API (ex.: app mobile).

### 3. JWT emitido por uma function serverless dedicada, a partir do CPF (escolhida)
- **Prós**: sem senha para o cliente gerenciar; a Lambda apenas confirma que o CPF corresponde a um cliente cadastrado (`ClientPF`) e emite um token de curta duração. Reaproveita o **mesmo formato de JWT e o mesmo segredo** (`JWT_SECRET`) já usados pelo login de funcionários — o backend principal valida os dois tipos de token com o middleware `authenticate` já existente, diferenciando-os só pelo claim `role` (`ATTENDANT`/`MECHANIC` vs. `CLIENT`), via o middleware `authorize([...])`. Atende exatamente ao requisito da Fase 3 (function serverless que valida CPF, consulta o cliente e devolve JWT).
- **Contras**: qualquer pessoa que saiba um CPF válido cadastrado consegue gerar um token para aquele cliente — não há segundo fator. Aceitável para o escopo do desafio (equivalente em risco ao modelo anterior, onde bastava saber o `externalId`), mas seria o primeiro ponto a evoluir (ex.: OTP por e-mail/SMS) em um cenário de produção real.

## Recomendação
Opção 3: JWT emitido pela function serverless (`soat-fiap-oficina-mecanica-serverless`), validado pelo backend principal com a infraestrutura de autorização por `role` já existente.

## Decisão
Adotado.
- `POST /auth/cpf` (via API Gateway → Lambda, [ADR 0006](../adr/0006-aws-api-gateway-como-api-gateway.md)) → valida o CPF, consulta `ClientPF`, devolve `{ token, expiresIn, client }` com `role: "CLIENT"`.
- `GET /api/track/:externalId` e `POST /api/track/:externalId/approve` passam a exigir `Authorization: Bearer <token>` com `role: CLIENT` (`src/routes/track.routes.js`, `src/routes/index.js`).
- Nenhuma lógica nova de verificação de JWT foi criada no backend principal — o middleware `authenticate`/`authorize` já usado pelas rotas de funcionários cobre os dois casos.
