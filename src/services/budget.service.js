const budgetRepository = require('../repositories/budget.repository');
const orderRepository = require('../repositories/order.repository');
const { ValidationError } = require('../utils/validation');

async function createBudget(orderIds) {
  const ids = orderIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);
  if (!ids.length) {
    throw new ValidationError('orderIds deve conter IDs válidos.');
  }

  const orders = await orderRepository.findOrdersByIds(ids);
  const foundIds = orders.map((order) => order.id);
  const missingIds = ids.filter((id) => !foundIds.includes(id));

  const totalBudget = orders.reduce((sum, order) => sum + (order.budgetValue || 0), 0);

  const budget = await budgetRepository.createBudget(totalBudget, foundIds);

  return {
    id: budget.id,
    totalBudget: budget.totalBudget,
    orders: budget.orders,
    missingOrderIds: missingIds,
    createdAt: budget.createdAt
  };
}

async function getBudget(id) {
  const budget = await budgetRepository.getBudget(id);
  if (!budget) {
    throw new ValidationError('Orçamento não encontrado.');
  }
  return budget;
}

async function listBudgets() {
  return budgetRepository.listBudgets();
}

async function updateBudget(id, totalBudget) {
  const budget = await budgetRepository.updateBudget(id, { totalBudget });
  if (!budget) {
    throw new ValidationError('Orçamento não encontrado.');
  }
  return budget;
}

async function deleteBudget(id) {
  const budget = await budgetRepository.getBudget(id);
  if (!budget) {
    throw new ValidationError('Orçamento não encontrado.');
  }
  return budgetRepository.deleteBudget(id);
}

module.exports = {
  createBudget,
  getBudget,
  listBudgets,
  updateBudget,
  deleteBudget
};