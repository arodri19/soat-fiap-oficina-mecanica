const request = require('supertest');
const mockAuthService = {
  login: jest.fn(),
  register: jest.fn()
};

jest.mock('../../src/infrastructure/container/Container', () => ({
  getAuthApplicationService: () => mockAuthService
}));

const prisma = require('../../src/prisma');
const app = require('../../src/app');

describe('API de integração', () => {
  let createdUserEmail = null;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Apaga o registro criado durante o teste
    if (createdUserEmail) {
      try {
        await prisma.user.deleteMany({
          where: { email: createdUserEmail }
        });
      } catch (error) {
        console.error('Erro ao limpar banco de dados de teste:', error);
      }
    }
    await prisma.$disconnect();
  });

  it('deve registrar um usuário', async () => {
    const uniqueEmail = `integration-test-${Date.now()}-${Math.floor(Math.random() * 10000)}@test.com`;
    createdUserEmail = uniqueEmail; // Salva para o afterAll apagar

    mockAuthService.register.mockResolvedValue({
      id: 1,
      name: 'Novo Usuário',
      email: uniqueEmail,
      role: 'MECHANIC'
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Novo Usuário', email: uniqueEmail, password: 'Senha123!', role: 'MECHANIC' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(uniqueEmail);
  });

  it('deve logar um usuário existente', async () => {
    mockAuthService.login.mockResolvedValue({
      token: 'token-fake',
      user: { email: 'admin@oficina.com' }
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@oficina.com', password: 'Admin123!' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('admin@oficina.com');
  });

  it.skip('deve alterar o status da ordem para aguardando aprovação e em execução', async () => {
    // This test requires existing orders in the database
    // Skipping for now as it tests the old system
  });

  it.skip('deve gerar um orçamento para múltiplas ordens de serviço', async () => {
    // This test requires existing orders and tests the old system
    // Skipping for now
  });
});
