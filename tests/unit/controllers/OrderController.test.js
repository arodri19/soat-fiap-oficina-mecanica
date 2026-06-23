// Mock auth middleware before loading the app so all protected routes pass
jest.mock('../../../src/middlewares/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, role: 'ATTENDANT' };
    next();
  },
  authorize: () => (req, res, next) => next()
}));

jest.mock('../../../src/services/order.service', () => ({
  createOrder: jest.fn(),
  listOrders: jest.fn(),
  getOrder: jest.fn(),
  updateOrderStatus: jest.fn(),
  addServiceToOrder: jest.fn(),
  addPartToOrder: jest.fn(),
  getOrderProgress: jest.fn(),
  approveOrder: jest.fn(),
  getOrderProgressByExternalId: jest.fn()
}));

const request = require('supertest');
const app = require('../../../src/app');
const orderService = require('../../../src/services/order.service');
const { ValidationError } = require('../../../src/utils/validation');

const SAMPLE_ORDER = {
  id: 1,
  status: 'RECEBIDA',
  description: 'Troca de óleo',
  vehicleId: 1,
  clientPFId: 1
};

beforeEach(() => jest.clearAllMocks());

describe('POST /api/orders', () => {
  it('cria ordem e retorna 201', async () => {
    orderService.createOrder.mockResolvedValue(SAMPLE_ORDER);
    const res = await request(app)
      .post('/api/orders')
      .send({ description: 'Troca de óleo', vehicleId: 1, clientPFId: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(SAMPLE_ORDER);
  });

  it('retorna 400 quando descrição ausente', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ vehicleId: 1, clientPFId: 1 });
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando cliente não informado', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ description: 'x', vehicleId: 1 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/orders', () => {
  it('lista ordens e retorna 200', async () => {
    orderService.listOrders.mockResolvedValue([SAMPLE_ORDER]);
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('GET /api/orders/:id', () => {
  it('retorna ordem existente com 200', async () => {
    orderService.getOrder.mockResolvedValue(SAMPLE_ORDER);
    const res = await request(app).get('/api/orders/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('retorna 404 quando ordem não existe', async () => {
    orderService.getOrder.mockResolvedValue(null);
    const res = await request(app).get('/api/orders/999');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/orders/:id/status', () => {
  it('atualiza status e retorna 200', async () => {
    orderService.updateOrderStatus.mockResolvedValue({ order: { ...SAMPLE_ORDER, status: 'EM_DIAGNOSTICO' }, message: undefined });
    const res = await request(app)
      .patch('/api/orders/1/status')
      .send({ status: 'EM_DIAGNOSTICO' });
    expect(res.status).toBe(200);
  });

  it('retorna 400 quando status ausente', async () => {
    const res = await request(app).patch('/api/orders/1/status').send({});
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando ordem não encontrada', async () => {
    orderService.updateOrderStatus.mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/orders/99/status')
      .send({ status: 'EM_DIAGNOSTICO' });
    expect(res.status).toBe(404);
  });

  it('retorna 400 quando transição é inválida', async () => {
    orderService.updateOrderStatus.mockRejectedValue(new ValidationError('Transição inválida: RECEBIDA → EM_EXECUCAO.'));
    const res = await request(app)
      .patch('/api/orders/1/status')
      .send({ status: 'EM_EXECUCAO' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Transição inválida');
  });
});

describe('POST /api/orders/:id/service', () => {
  it('adiciona serviço e retorna 200', async () => {
    orderService.addServiceToOrder.mockResolvedValue({ ...SAMPLE_ORDER, budgetValue: 120 });
    const res = await request(app)
      .post('/api/orders/1/service')
      .send({ serviceId: 2 });
    expect(res.status).toBe(200);
    expect(res.body.budgetValue).toBe(120);
  });

  it('retorna 400 quando serviceId ausente', async () => {
    const res = await request(app).post('/api/orders/1/service').send({});
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando ordem não encontrada', async () => {
    orderService.addServiceToOrder.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/orders/99/service')
      .send({ serviceId: 1 });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/orders/:id/part', () => {
  it('adiciona peça e retorna 200', async () => {
    orderService.addPartToOrder.mockResolvedValue({ orderPart: { id: 1 }, part: { id: 2, quantity: 4 } });
    const res = await request(app)
      .post('/api/orders/1/part')
      .send({ orderServiceServiceId: 1, partId: 2, quantity: 1 });
    expect(res.status).toBe(200);
  });

  it('retorna 400 quando orderServiceServiceId ausente', async () => {
    const res = await request(app)
      .post('/api/orders/1/part')
      .send({ partId: 2 });
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando partId ausente', async () => {
    const res = await request(app)
      .post('/api/orders/1/part')
      .send({ orderServiceServiceId: 1 });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando peça não encontrada', async () => {
    orderService.addPartToOrder.mockResolvedValue({ error: 'PART_NOT_FOUND' });
    const res = await request(app)
      .post('/api/orders/1/part')
      .send({ orderServiceServiceId: 1, partId: 99 });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/orders/:id/progress', () => {
  it('retorna progresso com 200', async () => {
    orderService.getOrderProgress.mockResolvedValue({ status: 'EM_EXECUCAO', mechanicDescription: 'Troca', mechanicName: 'Roberto' });
    const res = await request(app).get('/api/orders/1/progress');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('EM_EXECUCAO');
  });

  it('retorna 404 quando ordem não encontrada', async () => {
    orderService.getOrderProgress.mockResolvedValue(null);
    const res = await request(app).get('/api/orders/99/progress');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/track/:externalId (público)', () => {
  it('retorna progresso sem token', async () => {
    orderService.getOrderProgressByExternalId.mockResolvedValue({ status: 'AGUARDANDO_APROVACAO', mechanicDescription: 'Revisão', mechanicName: 'Ana' });
    const res = await request(app).get('/api/track/uuid-123');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('AGUARDANDO_APROVACAO');
  });

  it('retorna 404 para externalId inexistente', async () => {
    orderService.getOrderProgressByExternalId.mockResolvedValue(null);
    const res = await request(app).get('/api/track/uuid-inexistente');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/track/:externalId/approve (público)', () => {
  it('aprova ordem com 200', async () => {
    orderService.approveOrder.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO' });
    const res = await request(app).post('/api/track/uuid-123/approve');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('aprovada');
  });

  it('retorna 404 para externalId inexistente', async () => {
    orderService.approveOrder.mockResolvedValue(null);
    const res = await request(app).post('/api/track/uuid-invalido/approve');
    expect(res.status).toBe(404);
  });

  it('retorna 400 quando ordem não está aguardando aprovação', async () => {
    orderService.approveOrder.mockRejectedValue(new ValidationError('Ordem não está aguardando aprovação.'));
    const res = await request(app).post('/api/track/uuid-123/approve');
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('aguardando');
  });
});
