jest.mock('../../../src/middlewares/auth', () => ({
  authenticate: (req, res, next) => {
    // sub replica o claim real do JWT (payload de AuthUseCases/handler.js da Lambda de
    // login) — as rotas de track dependem dele pra restringir a OS ao dono (ver
    // tests/unit/application/OrderUseCases.security.test.js para a checagem em si).
    req.user = { id: 1, sub: 1, role: 'ATTENDANT' };
    next();
  },
  authorize: () => (req, res, next) => next()
}));

jest.mock('../../../src/infrastructure/container/Container', () => {
  const mockOrderSvc = {
    createOrder: jest.fn(),
    listOrders: jest.fn(),
    getOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
    addServiceToOrder: jest.fn(),
    addPartToOrder: jest.fn(),
    getOrderProgress: jest.fn(),
    approveOrder: jest.fn(),
    getOrderProgressByExternalId: jest.fn()
  };
  return {
    getOrderApplicationService: () => mockOrderSvc,
    getClientApplicationService: () => ({
      createClientPF: jest.fn(), listClientsPF: jest.fn(), getClientPF: jest.fn(),
      updateClientPF: jest.fn(), deleteClientPF: jest.fn(),
      createClientPJ: jest.fn(), listClientsPJ: jest.fn(), getClientPJ: jest.fn(),
      updateClientPJ: jest.fn(), deleteClientPJ: jest.fn()
    }),
    getAuthApplicationService: () => ({ login: jest.fn(), register: jest.fn() })
  };
});

const request = require('supertest');
const app = require('../../../src/app');
const container = require('../../../src/infrastructure/container/Container');
const { ValidationError } = require('../../../src/utils/validation');

let svc;
beforeEach(() => {
  svc = container.getOrderApplicationService();
  jest.clearAllMocks();
});

const SAMPLE_ORDER = { id: 1, status: 'RECEBIDA', description: 'Troca de óleo', vehicleId: 1, clientPFId: 1 };

describe('POST /api/orders', () => {
  it('cria ordem e retorna 201', async () => {
    svc.createOrder.mockResolvedValue(SAMPLE_ORDER);
    const res = await request(app).post('/api/orders').send({ description: 'Troca de óleo', vehicleId: 1, clientPFId: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(SAMPLE_ORDER);
  });

  it('retorna 400 quando descrição ausente', async () => {
    const res = await request(app).post('/api/orders').send({ vehicleId: 1, clientPFId: 1 });
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando cliente não informado', async () => {
    const res = await request(app).post('/api/orders').send({ description: 'x', vehicleId: 1 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/orders', () => {
  it('lista ordens e retorna 200', async () => {
    svc.listOrders.mockResolvedValue([SAMPLE_ORDER]);
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('GET /api/orders/:id', () => {
  it('retorna ordem existente com 200', async () => {
    svc.getOrder.mockResolvedValue(SAMPLE_ORDER);
    const res = await request(app).get('/api/orders/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('retorna 404 quando ordem não existe', async () => {
    svc.getOrder.mockResolvedValue(null);
    const res = await request(app).get('/api/orders/999');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/orders/:id/status', () => {
  it('atualiza status e retorna 200', async () => {
    svc.updateOrderStatus.mockResolvedValue({ order: { ...SAMPLE_ORDER, status: 'EM_DIAGNOSTICO' } });
    const res = await request(app).patch('/api/orders/1/status').send({ status: 'EM_DIAGNOSTICO' });
    expect(res.status).toBe(200);
  });

  it('retorna 400 quando status ausente', async () => {
    const res = await request(app).patch('/api/orders/1/status').send({});
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando ordem não encontrada', async () => {
    svc.updateOrderStatus.mockResolvedValue(null);
    const res = await request(app).patch('/api/orders/99/status').send({ status: 'EM_DIAGNOSTICO' });
    expect(res.status).toBe(404);
  });

  it('retorna 400 quando transição é inválida', async () => {
    svc.updateOrderStatus.mockRejectedValue(new ValidationError('Transição inválida: RECEBIDA → EM_EXECUCAO.'));
    const res = await request(app).patch('/api/orders/1/status').send({ status: 'EM_EXECUCAO' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Transição inválida');
  });
});

describe('POST /api/orders/:id/service', () => {
  it('adiciona serviço e retorna 200', async () => {
    svc.addServiceToOrder.mockResolvedValue({ ...SAMPLE_ORDER, budgetValue: 120 });
    const res = await request(app).post('/api/orders/1/service').send({ serviceId: 2 });
    expect(res.status).toBe(200);
    expect(res.body.budgetValue).toBe(120);
  });

  it('retorna 400 quando serviceId ausente', async () => {
    const res = await request(app).post('/api/orders/1/service').send({});
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando ordem não encontrada', async () => {
    svc.addServiceToOrder.mockResolvedValue(null);
    const res = await request(app).post('/api/orders/99/service').send({ serviceId: 1 });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/orders/:id/part', () => {
  it('adiciona peça e retorna 200', async () => {
    svc.addPartToOrder.mockResolvedValue({ orderPart: { id: 1 }, part: { id: 2, quantity: 4 } });
    const res = await request(app).post('/api/orders/1/part').send({ orderServiceServiceId: 1, partId: 2, quantity: 1 });
    expect(res.status).toBe(200);
  });

  it('retorna 400 quando orderServiceServiceId ausente', async () => {
    const res = await request(app).post('/api/orders/1/part').send({ partId: 2 });
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando partId ausente', async () => {
    const res = await request(app).post('/api/orders/1/part').send({ orderServiceServiceId: 1 });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando peça não encontrada', async () => {
    svc.addPartToOrder.mockResolvedValue({ error: 'PART_NOT_FOUND' });
    const res = await request(app).post('/api/orders/1/part').send({ orderServiceServiceId: 1, partId: 99 });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/orders/:id/progress', () => {
  it('retorna progresso com 200', async () => {
    svc.getOrderProgress.mockResolvedValue({ status: 'EM_EXECUCAO', mechanicDescription: 'Troca', mechanicName: 'Roberto' });
    const res = await request(app).get('/api/orders/1/progress');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('EM_EXECUCAO');
  });

  it('retorna 404 quando ordem não encontrada', async () => {
    svc.getOrderProgress.mockResolvedValue(null);
    const res = await request(app).get('/api/orders/99/progress');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/track/:externalId (protegido por JWT de cliente)', () => {
  it('retorna progresso sem token', async () => {
    svc.getOrderProgressByExternalId.mockResolvedValue({ status: 'AGUARDANDO_APROVACAO', mechanicDescription: 'Revisão', mechanicName: 'Ana' });
    const res = await request(app).get('/api/track/uuid-123');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('AGUARDANDO_APROVACAO');
    // req.user.sub precisa ser repassado — é o que restringe a OS ao dono (fix de IDOR).
    expect(svc.getOrderProgressByExternalId).toHaveBeenCalledWith('uuid-123', 1);
  });

  it('retorna 404 para externalId inexistente', async () => {
    svc.getOrderProgressByExternalId.mockResolvedValue(null);
    const res = await request(app).get('/api/track/uuid-inexistente');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/track/:externalId/approve (protegido por JWT de cliente)', () => {
  it('aprova ordem com 200', async () => {
    svc.approveOrder.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO' });
    const res = await request(app).post('/api/track/uuid-123/approve');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('aprovada');
    // req.user.sub precisa ser repassado — é o que restringe a OS ao dono (fix de IDOR).
    expect(svc.approveOrder).toHaveBeenCalledWith('uuid-123', 1);
  });

  it('retorna 404 para externalId inexistente', async () => {
    svc.approveOrder.mockResolvedValue(null);
    const res = await request(app).post('/api/track/uuid-invalido/approve');
    expect(res.status).toBe(404);
  });

  it('retorna 400 quando ordem não está aguardando aprovação', async () => {
    svc.approveOrder.mockRejectedValue(new ValidationError('Ordem não está aguardando aprovação.'));
    const res = await request(app).post('/api/track/uuid-123/approve');
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('aguardando');
  });
});
