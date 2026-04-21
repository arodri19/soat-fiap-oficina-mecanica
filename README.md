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

Com o banco ativo, rode:

```bash
npx prisma generate
npx prisma migrate dev --name init
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

## Documentação da API

A documentação interativa da API está disponível em:

```
http://localhost:4000/api-docs
```

Acesse esta URL no navegador para explorar todos os endpoints com Swagger UI.

## Observações

- A autenticação JWT deve ser enviada no header `Authorization: Bearer <token>`.
- As notificações para aprovação, reposição de peça, envio de email e pagamento são mockadas no backend.
- Um orçamento pode conter múltiplas ordens de serviço associadas.
