const orderRepository = require('../repositories/order.repository');
const partRepository = require('../repositories/part.repository');
const {
  buildOrderData,
  buildOrderStatusUpdate,
  validateOrderStatus,
  buildOrderProgress,
  validateServiceToOrder,
  validatePartToOrder
} = require('../models/order.model');
const { ValidationError } = require('../utils/validation');

const ORDER_APPROVAL_PENDING_MESSAGE = 'Aguardando aprovação do cliente. Use o link de acompanhamento para aprovar.';
const ORDER_FINISHED_MESSAGE = 'Finalizado e email mock enviado ao cliente.';
const ORDER_DELIVERED_MESSAGE = 'Pagamento mock registrado e ordem entregue.';

function mockNotify(message) {
  console.log('[MOCK] Notificação enviada:', message);
}

async function createOrder(body) {
  return orderRepository.createOrder(buildOrderData(body));
}

async function listOrders() {
  return orderRepository.listOrders();
}

async function getOrder(id) {
  return orderRepository.getOrder(id);
}

async function updateOrderStatus(id, status) {
  if (!validateOrderStatus(status)) {
    throw new ValidationError('Status inválido.');
  }

  const order = await orderRepository.findOrder(id);
  if (!order) return null;

  const data = buildOrderStatusUpdate(status, order);
  const updated = await orderRepository.updateOrder(id, data);

  if (status === 'AGUARDANDO_APROVACAO') {
    mockNotify(`Ordem ${order.id} aguardando aprovação: ${order.description}`);
    return { order: updated, message: ORDER_APPROVAL_PENDING_MESSAGE };
  }
  if (status === 'FINALIZADA') {
    mockNotify(`Ordem ${order.id} finalizada. Enviando email para o cliente.`);
    return { order: updated, message: ORDER_FINISHED_MESSAGE };
  }
  if (status === 'ENTREGUE') {
    return { order: updated, message: ORDER_DELIVERED_MESSAGE };
  }

  return updated;
}

async function addServiceToOrder(id, serviceId) {
  const order = await orderRepository.findOrder(id);
  if (!order) return null;

  const validated = validateServiceToOrder({ serviceId });

  await orderRepository.addServiceToOrder(id, validated.serviceId);
  const budgetValue = await orderRepository.calculateOrderBudget(id);
  return orderRepository.updateOrder(id, { budgetValue });
}

async function addPartToOrder(id, orderServiceServiceId, partId, quantity) {
  const order = await orderRepository.findOrder(id);
  if (!order) return null;

  const validated = validatePartToOrder({ partId, quantity });
  const part = await partRepository.getPart(validated.partId);
  if (!part) return { error: 'PART_NOT_FOUND' };

  let currentPart = part;
  if (!part.quantity || part.quantity < validated.quantity) {
    const restock = Math.max(validated.quantity, 1) + 1;
    mockNotify(`Pedido mock de reposição da peça ${part.name} enviado ao fornecedor.`);
    currentPart = await partRepository.updatePart(part.id, { quantity: part.quantity + restock });
  }

  const updatedPart = await partRepository.updatePart(part.id, {
    quantity: currentPart.quantity - validated.quantity
  });
  const orderPart = await orderRepository.addPartToOrder(orderServiceServiceId, part.id, validated.quantity);

  const budgetValue = await orderRepository.calculateOrderBudget(id);
  await orderRepository.updateOrder(id, { budgetValue });

  return { orderPart, part: updatedPart };
}

async function approveOrder(externalId) {
  const order = await orderRepository.findOrderByExternalId(externalId);
  if (!order) return null;

  if (order.status !== 'AGUARDANDO_APROVACAO') {
    throw new ValidationError(`Ordem não está aguardando aprovação. Status atual: ${order.status}.`);
  }

  const data = { status: 'EM_EXECUCAO' };
  if (!order.startAt) data.startAt = new Date();
  const updated = await orderRepository.updateOrder(order.id, data);
  mockNotify(`Ordem ${order.id} aprovada pelo cliente. Iniciando execução.`);
  return updated;
}

async function getOrderProgress(id) {
  const order = await orderRepository.getOrder(id);
  if (!order) return null;
  return buildOrderProgress(order);
}

async function getOrderProgressByExternalId(externalId) {
  const order = await orderRepository.findOrderByExternalId(externalId);
  if (!order) return null;
  return buildOrderProgress(order);
}

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus,
  addServiceToOrder,
  addPartToOrder,
  approveOrder,
  getOrderProgress,
  getOrderProgressByExternalId
};
