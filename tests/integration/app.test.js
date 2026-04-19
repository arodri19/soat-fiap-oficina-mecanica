const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config');

jest.mock('../../src/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  },
  orderService: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn()
  },
  budget: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

const prisma = require('../../src/prisma');
const app = require('../../src/app');

describe('API de integração', () => {
  let authToken;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('MinhaSenha123', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'teste@oficina.com',
      name: 'Atendente Teste',
      role: 'ATTENDANT',
      password: passwordHash
    });
    prisma.user.create.mockResolvedValue({
      id: 2,
      email: 'novo@oficina.com',
      name: 'Novo Usuário',
      role: 'MECHANIC'
    });
    prisma.orderService.findUnique.mockResolvedValue({
      id: 1,
      description: 'Troca de óleo',
      status: 'RECEBIDA',
      startAt: null,
      clientPF: null,
      clientPJ: null
    });
    prisma.orderService.update.mockResolvedValue({
      id: 1,
      description: 'Troca de óleo',
      status: 'EM_EXECUCAO',
      startAt: new Date().toISOString()
    });

    authToken = jwt.sign(
      { sub: 1, email: 'teste@oficina.com', role: 'ATTENDANT', name: 'Atendente Teste' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  it('deve registrar um usuário', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Novo Usuário', email: 'novo@oficina.com', password: 'Senha123!', role: 'MECHANIC' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('novo@oficina.com');
  });

  it('deve logar um usuário existente', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teste@oficina.com', password: 'MinhaSenha123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('teste@oficina.com');
  });

  it('deve alterar o status da ordem para aguardando aprovação e em execução', async () => {
    const response = await request(app)
      .patch('/api/orders/1/status')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'AGUARDANDO_APROVACAO' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('order');
    expect(response.body.order.status).toBe('EM_EXECUCAO');
    expect(response.body.message).toContain('EM_EXECUCAO');
  });

  it('deve gerar um orçamento para múltiplas ordens de serviço', async () => {
    prisma.orderService.findMany = jest.fn().mockResolvedValue([
      { id: 1, budgetValue: 250.0, description: 'Troca de óleo', status: 'RECEBIDA' },
      { id: 2, budgetValue: 300.0, description: 'Alinhamento', status: 'RECEBIDA' }
    ]);
    
    prisma.budget.create = jest.fn().mockResolvedValue({
      id: 1,
      totalBudget: 550.0,
      orders: [
        { id: 1, budgetValue: 250.0, description: 'Troca de óleo', status: 'RECEBIDA' },
        { id: 2, budgetValue: 300.0, description: 'Alinhamento', status: 'RECEBIDA' }
      ],
      createdAt: new Date().toISOString()
    });

    const response = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ orderIds: [1, 2] });

    expect(response.status).toBe(201);
    expect(response.body.totalBudget).toBe(550);
    expect(response.body.orders).toHaveLength(2);
    expect(response.body.missingOrderIds).toEqual([]);
  });
});
