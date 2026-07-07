// Module-level mocks needed by budget.service (imports these directly)
jest.mock('../../../src/repositories/order.repository', () => ({
  findOrdersByIds: jest.fn()
}));

jest.mock('../../../src/repositories/budget.repository', () => ({
  createBudget: jest.fn(),
  getBudget: jest.fn(),
  listBudgets: jest.fn().mockResolvedValue([]),
  updateBudget: jest.fn(),
  deleteBudget: jest.fn().mockResolvedValue({ deleted: true })
}));

const OrderApplicationService = require('../../../src/application/services/OrderApplicationService');
const budgetService = require('../../../src/services/budget.service');
const orderRepository = require('../../../src/repositories/order.repository');
const budgetRepository = require('../../../src/repositories/budget.repository');
const { ValidationError } = require('../../../src/utils/validation');

// ─── OrderApplicationService ────────────────────────────────────────────────

let mockOrderRepo, mockPartRepo, service;

beforeEach(() => {
  mockOrderRepo = {
    createOrder: jest.fn().mockResolvedValue({ id: 100 }),
    listOrders: jest.fn().mockResolvedValue([]),
    getOrder: jest.fn(),
    findOrderById: jest.fn(),
    findOrderByExternalId: jest.fn(),
    updateOrder: jest.fn(),
    addServiceToOrder: jest.fn().mockResolvedValue({ id: 1 }),
    addPartToOrder: jest.fn().mockResolvedValue({ id: 2 }),
    calculateOrderBudget: jest.fn().mockResolvedValue(125),
    findOrdersByIds: jest.fn()
  };
  mockPartRepo = {
    findPartById: jest.fn(),
    updatePartQuantity: jest.fn()
  };
  service = new OrderApplicationService(mockOrderRepo, mockPartRepo);
});

describe('OrderApplicationService — updateOrderStatus', () => {
  it('retorna null quando ordem não existe', async () => {
    mockOrderRepo.findOrderById.mockResolvedValueOnce(null);
    await expect(service.updateOrderStatus(1, 'EM_DIAGNOSTICO')).resolves.toBeNull();
  });

  it('lança ValidationError para status fora do enum', async () => {
    await expect(service.updateOrderStatus(1, 'INVALIDO')).rejects.toBeInstanceOf(ValidationError);
  });

  it('lança ValidationError para transição fora de sequência', async () => {
    mockOrderRepo.findOrderById.mockResolvedValue({ id: 1, status: 'RECEBIDA', startAt: null, endAt: null });
    await expect(service.updateOrderStatus(1, 'EM_EXECUCAO')).rejects.toBeInstanceOf(ValidationError);
  });

  it('transição RECEBIDA → EM_DIAGNOSTICO retorna ordem atualizada', async () => {
    mockOrderRepo.findOrderById.mockResolvedValue({ id: 1, status: 'RECEBIDA', startAt: null, endAt: null });
    mockOrderRepo.updateOrder.mockResolvedValue({ id: 1, status: 'EM_DIAGNOSTICO' });
    const result = await service.updateOrderStatus(1, 'EM_DIAGNOSTICO');
    expect(result).toEqual({ id: 1, status: 'EM_DIAGNOSTICO' });
  });

  it('transição EM_DIAGNOSTICO → AGUARDANDO_APROVACAO retorna mensagem de aguardo', async () => {
    mockOrderRepo.findOrderById.mockResolvedValue({ id: 1, status: 'EM_DIAGNOSTICO', startAt: null, endAt: null });
    mockOrderRepo.updateOrder.mockResolvedValue({ id: 1, status: 'AGUARDANDO_APROVACAO' });
    const result = await service.updateOrderStatus(1, 'AGUARDANDO_APROVACAO');
    expect(result.message).toContain('Aguardando');
    expect(result.order.status).toBe('AGUARDANDO_APROVACAO');
  });

  it('transição AGUARDANDO_APROVACAO → EM_EXECUCAO define startAt', async () => {
    mockOrderRepo.findOrderById.mockResolvedValue({ id: 1, status: 'AGUARDANDO_APROVACAO', startAt: null, endAt: null });
    mockOrderRepo.updateOrder.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO' });
    await service.updateOrderStatus(1, 'EM_EXECUCAO');
    expect(mockOrderRepo.updateOrder).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'EM_EXECUCAO', startAt: expect.any(Date) })
    );
  });

  it('transição EM_EXECUCAO → FINALIZADA retorna mensagem e define endAt', async () => {
    mockOrderRepo.findOrderById.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO', startAt: new Date(), endAt: null });
    mockOrderRepo.updateOrder.mockResolvedValue({ id: 1, status: 'FINALIZADA' });
    const result = await service.updateOrderStatus(1, 'FINALIZADA');
    expect(result.message).toContain('Finalizado');
    expect(mockOrderRepo.updateOrder).toHaveBeenCalledWith(1, expect.objectContaining({ endAt: expect.any(Date) }));
  });

  it('transição FINALIZADA → ENTREGUE retorna mensagem de entrega', async () => {
    mockOrderRepo.findOrderById.mockResolvedValue({ id: 1, status: 'FINALIZADA', startAt: new Date(), endAt: new Date() });
    mockOrderRepo.updateOrder.mockResolvedValue({ id: 1, status: 'ENTREGUE' });
    const result = await service.updateOrderStatus(1, 'ENTREGUE');
    expect(result.message).toContain('entregue');
  });

  it('não redefine endAt se já existir na transição ENTREGUE', async () => {
    const existingEnd = new Date('2024-01-01');
    mockOrderRepo.findOrderById.mockResolvedValue({ id: 1, status: 'FINALIZADA', startAt: new Date(), endAt: existingEnd });
    mockOrderRepo.updateOrder.mockResolvedValue({ id: 1, status: 'ENTREGUE' });
    await service.updateOrderStatus(1, 'ENTREGUE');
    expect(mockOrderRepo.updateOrder).toHaveBeenCalledWith(1, expect.not.objectContaining({ endAt: expect.anything() }));
  });
});

describe('OrderApplicationService — addServiceToOrder', () => {
  it('retorna null quando ordem não existe', async () => {
    mockOrderRepo.findOrderById.mockResolvedValueOnce(null);
    await expect(service.addServiceToOrder(1, 1)).resolves.toBeNull();
  });

  it('adiciona serviço e calcula orçamento automaticamente', async () => {
    mockOrderRepo.findOrderById.mockResolvedValue({ id: 1, status: 'RECEBIDA' });
    mockOrderRepo.updateOrder.mockResolvedValue({ id: 1, budgetValue: 125 });
    const result = await service.addServiceToOrder(1, 2);
    expect(mockOrderRepo.addServiceToOrder).toHaveBeenCalledWith(1, 2);
    expect(mockOrderRepo.calculateOrderBudget).toHaveBeenCalledWith(1);
    expect(mockOrderRepo.updateOrder).toHaveBeenCalledWith(1, { budgetValue: 125 });
    expect(result).toEqual({ id: 1, budgetValue: 125 });
  });

  it('lança ValidationError se serviceId não for informado', async () => {
    mockOrderRepo.findOrderById.mockResolvedValue({ id: 1 });
    await expect(service.addServiceToOrder(1, undefined)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('OrderApplicationService — addPartToOrder', () => {
  it('retorna null quando ordem não existe', async () => {
    mockOrderRepo.findOrderById.mockResolvedValueOnce(null);
    await expect(service.addPartToOrder(1, 2, 3, 1)).resolves.toBeNull();
  });

  it('retorna PART_NOT_FOUND quando peça não existe', async () => {
    mockOrderRepo.findOrderById.mockResolvedValue({ id: 1 });
    mockPartRepo.findPartById.mockResolvedValueOnce(null);
    await expect(service.addPartToOrder(1, 2, 99, 1)).resolves.toEqual({ error: 'PART_NOT_FOUND' });
  });

  it('adiciona peça com estoque suficiente e recalcula orçamento', async () => {
    mockOrderRepo.findOrderById.mockResolvedValue({ id: 1 });
    mockPartRepo.findPartById.mockResolvedValueOnce({ id: 3, name: 'Filtro', quantity: 10 });
    mockPartRepo.updatePartQuantity.mockResolvedValueOnce({ id: 3, quantity: 8 });
    const result = await service.addPartToOrder(1, 2, 3, 2);
    expect(mockPartRepo.updatePartQuantity).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.calculateOrderBudget).toHaveBeenCalledWith(1);
    expect(result).toHaveProperty('orderPart');
    expect(result).toHaveProperty('part');
  });

  it('executa reposição automática quando estoque insuficiente', async () => {
    mockOrderRepo.findOrderById.mockResolvedValue({ id: 1 });
    mockPartRepo.findPartById.mockResolvedValueOnce({ id: 3, name: 'Filtro', quantity: 0 });
    mockPartRepo.updatePartQuantity
      .mockResolvedValueOnce({ id: 3, quantity: 3 })
      .mockResolvedValueOnce({ id: 3, quantity: 2 });
    const result = await service.addPartToOrder(1, 2, 3, 1);
    expect(mockPartRepo.updatePartQuantity).toHaveBeenCalledTimes(2);
    expect(mockOrderRepo.calculateOrderBudget).toHaveBeenCalledWith(1);
    expect(result).toHaveProperty('orderPart');
  });
});

describe('OrderApplicationService — approveOrder', () => {
  it('retorna null quando externalId não existe', async () => {
    mockOrderRepo.findOrderByExternalId.mockResolvedValueOnce(null);
    await expect(service.approveOrder('uuid-inexistente')).resolves.toBeNull();
  });

  it('lança ValidationError quando ordem não está aguardando aprovação', async () => {
    mockOrderRepo.findOrderByExternalId.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO', startAt: new Date() });
    await expect(service.approveOrder('uuid-1')).rejects.toBeInstanceOf(ValidationError);
  });

  it('aprova a ordem e define startAt quando ausente', async () => {
    mockOrderRepo.findOrderByExternalId.mockResolvedValue({ id: 1, status: 'AGUARDANDO_APROVACAO', startAt: null });
    mockOrderRepo.updateOrder.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO' });
    const result = await service.approveOrder('uuid-1');
    expect(mockOrderRepo.updateOrder).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'EM_EXECUCAO', startAt: expect.any(Date) })
    );
    expect(result).toEqual({ id: 1, status: 'EM_EXECUCAO' });
  });

  it('aprova a ordem sem redefinir startAt quando já existe', async () => {
    const existingStart = new Date('2024-01-01');
    mockOrderRepo.findOrderByExternalId.mockResolvedValue({ id: 1, status: 'AGUARDANDO_APROVACAO', startAt: existingStart });
    mockOrderRepo.updateOrder.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO' });
    await service.approveOrder('uuid-1');
    expect(mockOrderRepo.updateOrder).toHaveBeenCalledWith(1, { status: 'EM_EXECUCAO' });
  });
});

describe('OrderApplicationService — getOrderProgress / getOrderProgressByExternalId', () => {
  it('getOrderProgress retorna null quando ordem não encontrada', async () => {
    mockOrderRepo.findOrderById.mockResolvedValueOnce(null);
    await expect(service.getOrderProgress(1)).resolves.toBeNull();
  });

  it('getOrderProgress retorna progresso da ordem', async () => {
    mockOrderRepo.findOrderById.mockResolvedValueOnce({ status: 'EM_EXECUCAO', description: 'Troca de óleo', mechanicName: 'Roberto' });
    await expect(service.getOrderProgress(1)).resolves.toEqual({
      status: 'EM_EXECUCAO',
      mechanicDescription: 'Troca de óleo',
      mechanicName: 'Roberto'
    });
  });

  it('getOrderProgressByExternalId retorna null quando não encontrado', async () => {
    mockOrderRepo.findOrderByExternalId.mockResolvedValueOnce(null);
    await expect(service.getOrderProgressByExternalId('uuid')).resolves.toBeNull();
  });

  it('getOrderProgressByExternalId retorna progresso via externalId', async () => {
    mockOrderRepo.findOrderByExternalId.mockResolvedValueOnce({ status: 'AGUARDANDO_APROVACAO', description: 'Alinhamento', mechanicName: 'Ana' });
    await expect(service.getOrderProgressByExternalId('uuid-1')).resolves.toEqual({
      status: 'AGUARDANDO_APROVACAO',
      mechanicDescription: 'Alinhamento',
      mechanicName: 'Ana'
    });
  });
});

describe('OrderApplicationService — createOrder / listOrders / getOrder', () => {
  it('cria ordem com dados válidos', async () => {
    await expect(service.createOrder({ description: 'Revisão', vehicleId: 1, clientPFId: 1 })).resolves.toEqual({ id: 100 });
  });

  it('lista ordens', async () => {
    await expect(service.listOrders()).resolves.toEqual([]);
  });

  it('busca ordem por id', async () => {
    mockOrderRepo.getOrder.mockResolvedValueOnce({ id: 1 });
    await expect(service.getOrder(1)).resolves.toEqual({ id: 1 });
  });
});

// ─── BudgetService ───────────────────────────────────────────────────────────

describe('BudgetService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cria orçamento somando budgetValue das ordens e identifica IDs faltantes', async () => {
    orderRepository.findOrdersByIds.mockResolvedValue([{ id: 1, budgetValue: 100 }, { id: 2, budgetValue: 50 }]);
    budgetRepository.createBudget.mockResolvedValue({
      id: 10,
      totalBudget: 150,
      orders: [{ id: 1 }, { id: 2 }],
      createdAt: new Date()
    });
    const budget = await budgetService.createBudget([1, 2, 3]);
    expect(budget.totalBudget).toBe(150);
    expect(budget.missingOrderIds).toEqual([3]);
  });

  it('lança ValidationError quando nenhum ID válido informado', async () => {
    await expect(budgetService.createBudget(['x'])).rejects.toBeInstanceOf(ValidationError);
  });

  it('busca orçamento existente', async () => {
    budgetRepository.getBudget.mockResolvedValueOnce({ id: 10, totalBudget: 150 });
    await expect(budgetService.getBudget(10)).resolves.toEqual({ id: 10, totalBudget: 150 });
  });

  it('lança ValidationError ao buscar orçamento inexistente', async () => {
    budgetRepository.getBudget.mockResolvedValueOnce(null);
    await expect(budgetService.getBudget(99)).rejects.toBeInstanceOf(ValidationError);
  });

  it('lista orçamentos', async () => {
    await expect(budgetService.listBudgets()).resolves.toEqual([]);
  });

  it('atualiza orçamento existente', async () => {
    budgetRepository.updateBudget.mockResolvedValueOnce({ id: 10, totalBudget: 200 });
    await expect(budgetService.updateBudget(10, 200)).resolves.toEqual({ id: 10, totalBudget: 200 });
  });

  it('lança ValidationError ao atualizar orçamento inexistente', async () => {
    budgetRepository.updateBudget.mockResolvedValueOnce(null);
    await expect(budgetService.updateBudget(99, 1)).rejects.toBeInstanceOf(ValidationError);
  });

  it('remove orçamento existente', async () => {
    budgetRepository.getBudget.mockResolvedValueOnce({ id: 10 });
    await expect(budgetService.deleteBudget(10)).resolves.toEqual({ deleted: true });
  });

  it('lança ValidationError ao remover orçamento inexistente', async () => {
    budgetRepository.getBudget.mockResolvedValueOnce(null);
    await expect(budgetService.deleteBudget(11)).rejects.toBeInstanceOf(ValidationError);
  });
});
