jest.mock('../../../src/repositories/order.repository', () => ({
  createOrder: jest.fn().mockResolvedValue({ id: 100 }),
  listOrders: jest.fn().mockResolvedValue([]),
  getOrder: jest.fn(),
  findOrder: jest.fn(),
  findOrderByExternalId: jest.fn(),
  updateOrder: jest.fn(),
  addServiceToOrder: jest.fn().mockResolvedValue({ id: 1 }),
  addPartToOrder: jest.fn().mockResolvedValue({ id: 2 }),
  findOrdersByIds: jest.fn(),
  calculateOrderBudget: jest.fn().mockResolvedValue(125)
}));

jest.mock('../../../src/repositories/part.repository', () => ({
  getPart: jest.fn(),
  updatePart: jest.fn()
}));

jest.mock('../../../src/repositories/budget.repository', () => ({
  createBudget: jest.fn(),
  getBudget: jest.fn(),
  listBudgets: jest.fn().mockResolvedValue([]),
  updateBudget: jest.fn(),
  deleteBudget: jest.fn().mockResolvedValue({ deleted: true })
}));

const orderRepository = require('../../../src/repositories/order.repository');
const partRepository = require('../../../src/repositories/part.repository');
const budgetRepository = require('../../../src/repositories/budget.repository');
const orderService = require('../../../src/services/order.service');
const budgetService = require('../../../src/services/budget.service');
const { ValidationError } = require('../../../src/utils/validation');

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    orderRepository.calculateOrderBudget.mockResolvedValue(125);
  });

  describe('updateOrderStatus', () => {
    it('retorna null quando ordem não existe', async () => {
      orderRepository.findOrder.mockResolvedValueOnce(null);
      await expect(orderService.updateOrderStatus(1, 'EM_DIAGNOSTICO')).resolves.toBeNull();
    });

    it('lança ValidationError para status fora do enum', async () => {
      await expect(orderService.updateOrderStatus(1, 'INVALIDO')).rejects.toBeInstanceOf(ValidationError);
    });

    it('lança ValidationError para transição fora de sequência', async () => {
      orderRepository.findOrder.mockResolvedValue({ id: 1, status: 'RECEBIDA', description: 'OS', startAt: null });
      await expect(orderService.updateOrderStatus(1, 'EM_EXECUCAO')).rejects.toBeInstanceOf(ValidationError);
    });

    it('transição RECEBIDA → EM_DIAGNOSTICO retorna ordem atualizada', async () => {
      orderRepository.findOrder.mockResolvedValue({ id: 1, status: 'RECEBIDA', description: 'OS', startAt: null });
      orderRepository.updateOrder.mockResolvedValue({ id: 1, status: 'EM_DIAGNOSTICO' });
      const result = await orderService.updateOrderStatus(1, 'EM_DIAGNOSTICO');
      expect(result).toEqual({ id: 1, status: 'EM_DIAGNOSTICO' });
    });

    it('transição EM_DIAGNOSTICO → AGUARDANDO_APROVACAO retorna mensagem de aguardo', async () => {
      orderRepository.findOrder.mockResolvedValue({ id: 1, status: 'EM_DIAGNOSTICO', description: 'OS', startAt: null });
      orderRepository.updateOrder.mockResolvedValue({ id: 1, status: 'AGUARDANDO_APROVACAO' });
      const result = await orderService.updateOrderStatus(1, 'AGUARDANDO_APROVACAO');
      expect(result.message).toContain('Aguardando');
      expect(result.order.status).toBe('AGUARDANDO_APROVACAO');
    });

    it('transição AGUARDANDO_APROVACAO → EM_EXECUCAO (via admin) define startAt', async () => {
      orderRepository.findOrder.mockResolvedValue({ id: 1, status: 'AGUARDANDO_APROVACAO', description: 'OS', startAt: null });
      orderRepository.updateOrder.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO' });
      const result = await orderService.updateOrderStatus(1, 'EM_EXECUCAO');
      expect(orderRepository.updateOrder).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'EM_EXECUCAO', startAt: expect.any(Date) }));
      expect(result).toEqual({ id: 1, status: 'EM_EXECUCAO' });
    });

    it('transição EM_EXECUCAO → FINALIZADA retorna mensagem e define endAt', async () => {
      orderRepository.findOrder.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO', description: 'OS', startAt: new Date() });
      orderRepository.updateOrder.mockResolvedValue({ id: 1, status: 'FINALIZADA' });
      const result = await orderService.updateOrderStatus(1, 'FINALIZADA');
      expect(result.message).toContain('Finalizado');
      expect(orderRepository.updateOrder).toHaveBeenCalledWith(1, expect.objectContaining({ endAt: expect.any(Date) }));
    });

    it('transição FINALIZADA → ENTREGUE retorna mensagem de entrega', async () => {
      orderRepository.findOrder.mockResolvedValue({ id: 1, status: 'FINALIZADA', description: 'OS', startAt: new Date(), endAt: new Date() });
      orderRepository.updateOrder.mockResolvedValue({ id: 1, status: 'ENTREGUE' });
      const result = await orderService.updateOrderStatus(1, 'ENTREGUE');
      expect(result.message).toContain('entregue');
    });

    it('não redefine endAt se já existir na transição ENTREGUE', async () => {
      const existingEnd = new Date('2024-01-01');
      orderRepository.findOrder.mockResolvedValue({ id: 1, status: 'FINALIZADA', description: 'OS', startAt: new Date(), endAt: existingEnd });
      orderRepository.updateOrder.mockResolvedValue({ id: 1, status: 'ENTREGUE' });
      await orderService.updateOrderStatus(1, 'ENTREGUE');
      expect(orderRepository.updateOrder).toHaveBeenCalledWith(1, expect.not.objectContaining({ endAt: expect.anything() }));
    });
  });

  describe('addServiceToOrder', () => {
    it('retorna null quando ordem não existe', async () => {
      orderRepository.findOrder.mockResolvedValueOnce(null);
      await expect(orderService.addServiceToOrder(1, 1)).resolves.toBeNull();
    });

    it('adiciona serviço e calcula orçamento automaticamente', async () => {
      orderRepository.findOrder.mockResolvedValue({ id: 1, status: 'RECEBIDA' });
      orderRepository.updateOrder.mockResolvedValue({ id: 1, budgetValue: 125 });

      const result = await orderService.addServiceToOrder(1, 2);

      expect(orderRepository.addServiceToOrder).toHaveBeenCalledWith(1, 2);
      expect(orderRepository.calculateOrderBudget).toHaveBeenCalledWith(1);
      expect(orderRepository.updateOrder).toHaveBeenCalledWith(1, { budgetValue: 125 });
      expect(result).toEqual({ id: 1, budgetValue: 125 });
    });

    it('lança ValidationError se serviceId não for informado', async () => {
      orderRepository.findOrder.mockResolvedValue({ id: 1 });
      await expect(orderService.addServiceToOrder(1, undefined)).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('addPartToOrder', () => {
    it('retorna null quando ordem não existe', async () => {
      orderRepository.findOrder.mockResolvedValueOnce(null);
      await expect(orderService.addPartToOrder(1, 2, 3, 1)).resolves.toBeNull();
    });

    it('retorna PART_NOT_FOUND quando peça não existe', async () => {
      orderRepository.findOrder.mockResolvedValue({ id: 1 });
      partRepository.getPart.mockResolvedValueOnce(null);
      await expect(orderService.addPartToOrder(1, 2, 99, 1)).resolves.toEqual({ error: 'PART_NOT_FOUND' });
    });

    it('adiciona peça com estoque suficiente e recalcula orçamento', async () => {
      orderRepository.findOrder.mockResolvedValue({ id: 1 });
      partRepository.getPart.mockResolvedValueOnce({ id: 3, name: 'Filtro', quantity: 10 });
      partRepository.updatePart.mockResolvedValueOnce({ id: 3, quantity: 8 });

      const result = await orderService.addPartToOrder(1, 2, 3, 2);

      expect(partRepository.updatePart).toHaveBeenCalledTimes(1);
      expect(orderRepository.calculateOrderBudget).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('orderPart');
      expect(result).toHaveProperty('part');
    });

    it('executa reposição automática quando estoque insuficiente', async () => {
      orderRepository.findOrder.mockResolvedValue({ id: 1 });
      partRepository.getPart.mockResolvedValueOnce({ id: 3, name: 'Filtro', quantity: 0 });
      partRepository.updatePart
        .mockResolvedValueOnce({ id: 3, quantity: 3 })
        .mockResolvedValueOnce({ id: 3, quantity: 2 });

      const result = await orderService.addPartToOrder(1, 2, 3, 1);

      expect(partRepository.updatePart).toHaveBeenCalledTimes(2);
      expect(orderRepository.calculateOrderBudget).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('orderPart');
    });
  });

  describe('approveOrder', () => {
    it('retorna null quando externalId não existe', async () => {
      orderRepository.findOrderByExternalId.mockResolvedValueOnce(null);
      await expect(orderService.approveOrder('uuid-inexistente')).resolves.toBeNull();
    });

    it('lança ValidationError quando ordem não está aguardando aprovação', async () => {
      orderRepository.findOrderByExternalId.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO', startAt: new Date() });
      await expect(orderService.approveOrder('uuid-1')).rejects.toBeInstanceOf(ValidationError);
    });

    it('aprova a ordem e define startAt quando ausente', async () => {
      orderRepository.findOrderByExternalId.mockResolvedValue({ id: 1, status: 'AGUARDANDO_APROVACAO', startAt: null });
      orderRepository.updateOrder.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO' });

      const result = await orderService.approveOrder('uuid-1');

      expect(orderRepository.updateOrder).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'EM_EXECUCAO', startAt: expect.any(Date) }));
      expect(result).toEqual({ id: 1, status: 'EM_EXECUCAO' });
    });

    it('aprova a ordem sem redefinir startAt quando já existe', async () => {
      const existingStart = new Date('2024-01-01');
      orderRepository.findOrderByExternalId.mockResolvedValue({ id: 1, status: 'AGUARDANDO_APROVACAO', startAt: existingStart });
      orderRepository.updateOrder.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO' });

      await orderService.approveOrder('uuid-1');

      expect(orderRepository.updateOrder).toHaveBeenCalledWith(1, { status: 'EM_EXECUCAO' });
    });
  });

  describe('getOrderProgress / getOrderProgressByExternalId', () => {
    it('getOrderProgress retorna null quando ordem não encontrada', async () => {
      orderRepository.getOrder.mockResolvedValueOnce(null);
      await expect(orderService.getOrderProgress(1)).resolves.toBeNull();
    });

    it('getOrderProgress retorna progresso da ordem', async () => {
      orderRepository.getOrder.mockResolvedValueOnce({ status: 'EM_EXECUCAO', description: 'Troca de óleo', mechanicName: 'Roberto' });
      await expect(orderService.getOrderProgress(1)).resolves.toEqual({
        status: 'EM_EXECUCAO',
        mechanicDescription: 'Troca de óleo',
        mechanicName: 'Roberto'
      });
    });

    it('getOrderProgressByExternalId retorna null quando não encontrado', async () => {
      orderRepository.findOrderByExternalId.mockResolvedValueOnce(null);
      await expect(orderService.getOrderProgressByExternalId('uuid')).resolves.toBeNull();
    });

    it('getOrderProgressByExternalId retorna progresso via externalId', async () => {
      orderRepository.findOrderByExternalId.mockResolvedValueOnce({ status: 'AGUARDANDO_APROVACAO', description: 'Alinhamento', mechanicName: 'Ana' });
      await expect(orderService.getOrderProgressByExternalId('uuid-1')).resolves.toEqual({
        status: 'AGUARDANDO_APROVACAO',
        mechanicDescription: 'Alinhamento',
        mechanicName: 'Ana'
      });
    });
  });

  describe('createOrder / listOrders / getOrder', () => {
    it('cria ordem com dados válidos', async () => {
      await expect(orderService.createOrder({ description: 'Revisão', vehicleId: 1, clientPFId: 1 })).resolves.toEqual({ id: 100 });
    });

    it('lista ordens', async () => {
      await expect(orderService.listOrders()).resolves.toEqual([]);
    });

    it('busca ordem por id', async () => {
      orderRepository.getOrder.mockResolvedValueOnce({ id: 1 });
      await expect(orderService.getOrder(1)).resolves.toEqual({ id: 1 });
    });
  });
});

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
