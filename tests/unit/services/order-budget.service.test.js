jest.mock('../../../src/repositories/order.repository', () => ({
  createOrder: jest.fn().mockResolvedValue({ id: 100 }),
  listOrders: jest.fn().mockResolvedValue([]),
  getOrder: jest.fn(),
  findOrder: jest.fn(),
  updateOrder: jest.fn(),
  addServiceToOrder: jest.fn().mockResolvedValue({ id: 1 }),
  addPartToOrder: jest.fn().mockResolvedValue({ id: 2 }),
  findOrdersByIds: jest.fn()
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

describe('OrderService e BudgetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('valida cenários principais de updateOrderStatus', async () => {
    orderRepository.findOrder.mockResolvedValueOnce(null);
    await expect(orderService.updateOrderStatus(1, 'EM_EXECUCAO')).resolves.toBeNull();

    orderRepository.findOrder.mockResolvedValue({ id: 1, description: 'OS', startAt: null });
    orderRepository.updateOrder.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO' });
    const approval = await orderService.updateOrderStatus(1, 'AGUARDANDO_APROVACAO');
    expect(approval.message).toContain('Aprovação mock');

    orderRepository.findOrder.mockResolvedValue({ id: 1, description: 'OS', startAt: new Date() });
    orderRepository.updateOrder.mockResolvedValue({ id: 1, status: 'FINALIZADA' });
    const finished = await orderService.updateOrderStatus(1, 'FINALIZADA');
    expect(finished.message).toContain('Finalizado');

    orderRepository.findOrder.mockResolvedValue({ id: 1, description: 'OS', startAt: new Date() });
    orderRepository.updateOrder.mockResolvedValue({ id: 1, status: 'ENTREGUE' });
    const delivered = await orderService.updateOrderStatus(1, 'ENTREGUE');
    expect(delivered.message).toContain('ordem entregue');

    orderRepository.findOrder.mockResolvedValue({ id: 1, description: 'OS', startAt: null });
    orderRepository.updateOrder.mockResolvedValue({ id: 1, status: 'EM_EXECUCAO' });
    await expect(orderService.updateOrderStatus(1, 'EM_EXECUCAO')).resolves.toEqual({ id: 1, status: 'EM_EXECUCAO' });

    await expect(orderService.updateOrderStatus(1, 'INVALIDO')).rejects.toBeInstanceOf(ValidationError);
  });

  it('executa fluxo de addServiceToOrder e retorna null quando ordem não existe', async () => {
    orderRepository.findOrder.mockResolvedValueOnce(null);
    await expect(orderService.addServiceToOrder(1, 1, 100)).resolves.toBeNull();

    orderRepository.findOrder.mockResolvedValueOnce({ id: 1, budgetValue: 50 });
    orderRepository.updateOrder.mockResolvedValueOnce({ id: 1, budgetValue: 120 });
    await expect(orderService.addServiceToOrder(1, 1, 120)).resolves.toEqual({ id: 1, budgetValue: 120 });
  });

  it('executa fluxo de addPartToOrder com e sem reposição', async () => {
    orderRepository.findOrder.mockResolvedValueOnce(null);
    await expect(orderService.addPartToOrder(1, 2, 1)).resolves.toBeNull();

    orderRepository.findOrder.mockResolvedValue({ id: 1 });

    partRepository.getPart.mockResolvedValueOnce(null);
    await expect(orderService.addPartToOrder(1, 99, 1)).resolves.toEqual({ error: 'PART_NOT_FOUND' });

    partRepository.getPart.mockResolvedValueOnce({ id: 2, name: 'Peca', quantity: 0 });
    partRepository.updatePart.mockResolvedValueOnce({ id: 2, quantity: 3 });
    partRepository.updatePart.mockResolvedValueOnce({ id: 2, quantity: 2 });
    const withRestock = await orderService.addPartToOrder(1, 2, 1);
    expect(withRestock).toHaveProperty('orderPart');
    expect(withRestock).toHaveProperty('part');

    partRepository.getPart.mockResolvedValueOnce({ id: 2, name: 'Peca', quantity: 5 });
    partRepository.updatePart.mockResolvedValueOnce({ id: 2, quantity: 3 });
    const withoutRestock = await orderService.addPartToOrder(1, 2, 2);
    expect(withoutRestock).toHaveProperty('orderPart');
  });

  it('retorna progresso e operações básicas de ordem', async () => {
    orderRepository.getOrder.mockResolvedValueOnce(null);
    await expect(orderService.getOrderProgress(1)).resolves.toBeNull();

    orderRepository.getOrder.mockResolvedValueOnce({ status: 'EM_EXECUCAO', description: 'Desc', mechanicName: 'Mec' });
    await expect(orderService.getOrderProgress(1)).resolves.toEqual({
      status: 'EM_EXECUCAO',
      mechanicDescription: 'Desc',
      mechanicName: 'Mec'
    });

    await expect(orderService.createOrder({ description: 'x', vehicleId: 1, clientPFId: 1 })).resolves.toEqual({ id: 100 });
    await expect(orderService.listOrders()).resolves.toEqual([]);
    orderRepository.getOrder.mockResolvedValueOnce({ id: 1 });
    await expect(orderService.getOrder(1)).resolves.toEqual({ id: 1 });
  });

  it('executa fluxo completo de orçamento', async () => {
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

    await expect(budgetService.createBudget(['x'])).rejects.toBeInstanceOf(ValidationError);

    budgetRepository.getBudget.mockResolvedValueOnce({ id: 10 });
    await expect(budgetService.getBudget(10)).resolves.toEqual({ id: 10 });

    budgetRepository.getBudget.mockResolvedValueOnce(null);
    await expect(budgetService.getBudget(99)).rejects.toBeInstanceOf(ValidationError);

    await expect(budgetService.listBudgets()).resolves.toEqual([]);

    budgetRepository.updateBudget.mockResolvedValueOnce({ id: 10, totalBudget: 200 });
    await expect(budgetService.updateBudget(10, 200)).resolves.toEqual({ id: 10, totalBudget: 200 });
    budgetRepository.updateBudget.mockResolvedValueOnce(null);
    await expect(budgetService.updateBudget(99, 1)).rejects.toBeInstanceOf(ValidationError);

    budgetRepository.getBudget.mockResolvedValueOnce({ id: 10 });
    await expect(budgetService.deleteBudget(10)).resolves.toEqual({ deleted: true });
    budgetRepository.getBudget.mockResolvedValueOnce(null);
    await expect(budgetService.deleteBudget(11)).rejects.toBeInstanceOf(ValidationError);
  });
});
