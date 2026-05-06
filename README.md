# Oficina Mecânica - Backend

Backend em Node.js/Express com PostgreSQL e Prisma para uma oficina mecânica.

## Funcionalidades

- Autenticação com JWT e bcrypt para atendentes e mecânicos
- CRUD de clientes Pessoa Física e Jurídica
- CRUD de veículos associados a clientes Pessoa Física
- CRUD de serviços com SLA
- CRUD de peças com estoque e mock de reposição
- Ordens de serviço com status, orçamento, associação de serviços e peças
- Rota de progresso de ordem para cliente
- Métrica de tempo médio de execução de ordens
- Testes unitários e de integração com Jest

## Tecnologias

- Node.js
- Express
- PostgreSQL
- Prisma
- JWT
- bcrypt
- Docker Compose
- Jest

## Arquitetura e Decisões Técnicas

### Banco de Dados: PostgreSQL

Com base no **ADR 0001**, o **PostgreSQL** foi escolhido como banco de dados principal do sistema. A justificativa fundamenta-se nos seguintes pontos:
- **Modelo Relacional e Integridade de Dados:** O domínio exige uma estrutura fortemente relacionada (Cliente -> Veículo -> Ordem de Serviço -> Orçamento). O PostgreSQL assegura essa integridade através de chaves estrangeiras e restrições.
- **Confiabilidade e Transações (ACID):** Operações críticas no sistema, como a sincronização de orçamentos e ordens de serviço, exigem atomicidade (operações seguras all-or-nothing).
- **Sinergia com Prisma ORM:** O PostgreSQL possui integração otimizada com o Prisma, facilitando o versionamento do banco de dados via migrations e queries seguras e tipadas.
- **Maturidade e Desempenho:** É uma solução Open Source madura que provê performance e recursos de consultas avançadas para as métricas da oficina.

Para mais detalhes, consulte o [ADR 0001: Uso do PostgreSQL](docs/adr/0001-uso-de-postgresql-como-banco-de-dados.md).

## Como usar

### 1. Instalar dependências

```bash
npm install
```

### 2. Copiar variáveis de ambiente

```bash
cp .env.example .env
```

### 3. Rodar com Docker Compose

```bash
docker compose up --build
```

O backend estará disponível em `http://localhost:4001`.

### 4. Gerar Prisma Client e rodar migrações

O sistema utiliza o Prisma ORM para gerenciar o esquema e as migrações (versionamento) do banco de dados, o que garante previsibilidade nas mudanças de estrutura.

Com o banco de dados ativo, execute os comandos abaixo para gerar o cliente de tipagem e aplicar a estrutura no banco:

```bash
# Gera os tipos do Prisma Client
npx prisma generate

# Aplica as migrações ao banco de dados no ambiente de desenvolvimento
npx prisma migrate dev

# (Opcional) Para aplicar migrações sem prompts interativos em ambientes de CI/CD ou Produção:
# npx prisma migrate deploy
```

### 5. Criar usuário padrão (Seed)

```bash
npm run prisma:seed
```

Isso criará um usuário administrativo com as seguintes credenciais:

- **Email**: admin@oficina.com
- **Senha**: Admin123!
- **Role**: ATTENDANT

### 6. Rotas principais

- `POST /api/auth/register` - cadastro de usuário
- `POST /api/auth/login` - login com email e senha
- `GET /api/clients/pf` - listar clientes PF
- `POST /api/clients/pf` - criar cliente PF
- `GET /api/clients/pj` - listar clientes PJ
- `POST /api/clients/pj` - criar cliente PJ
- `GET /api/vehicles` - listar veículos
- `POST /api/vehicles` - criar veículo vinculado a cliente PF
- `GET /api/services` - listar serviços
- `POST /api/services` - criar serviço
- `GET /api/parts` - listar peças
- `POST /api/parts` - criar peça
- `GET /api/orders` - listar ordens
- `POST /api/orders` - criar ordem de serviço
- `PATCH /api/orders/:id/status` - atualizar status da ordem
- `POST /api/orders/:id/service` - associar serviço à ordem
- `POST /api/orders/:id/part` - associar peça à ordem
- `GET /api/orders/:id/progress` - acompanhar progresso da ordem
- `GET /api/metrics/average-execution-time` - média de tempo de execução
- `POST /api/budgets` - criar orçamento a partir de múltiplas ordens
- `GET /api/budgets` - listar todos os orçamentos
- `GET /api/budgets/:id` - obter orçamento específico
- `PUT /api/budgets/:id` - atualizar orçamento
- `DELETE /api/budgets/:id` - deletar orçamento

### 7. Testes

```bash
npm test
```

Testes unitários:

```bash
npm run test:unit
```

Testes de integração:

```bash
npm run test:integration
```

## Documentação e Exemplos da API

### Swagger UI
A documentação interativa da API está disponível em:

```
http://localhost:4000/api-docs
```

Acesse esta URL no navegador para explorar todos os endpoints com Swagger UI.

### Exemplos de Requisições (.http)
Para facilitar os testes rápidos e manuais diretamente pelo seu editor de código (como o VS Code), todos os exemplos de payloads e chamadas para os endpoints estão prontos e disponíveis na pasta `requests/` na raiz do projeto.

A pasta conta com arquivos separados por entidade:
- `01-auth.http` (Login e Registro)
- `02-clients.http` (PF e PJ)
- `03-vehicles.http`
- `04-services.http`
- `05-parts.http`
- `06-orders.http`
- `07-budgets.http`
- `08-metrics.http`

**Como testar:**
Basta instalar a extensão **REST Client** no VS Code e clicar em `Send Request` logo acima das rotas nos arquivos. Lembre-se de primeiro realizar o login em `01-auth.http` e copiar o JWT retornado para a variável `@token` nos demais arquivos. Você também pode importá-los em ferramentas como Insomnia ou Postman.

## Observações

- A autenticação JWT deve ser enviada no header `Authorization: Bearer <token>`.
- As notificações para aprovação, reposição de peça, envio de email e pagamento são mockadas no backend.
- Um orçamento pode conter múltiplas ordens de serviço associadas.
