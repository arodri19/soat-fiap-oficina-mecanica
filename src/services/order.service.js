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

const ORDER_APPROVAL_MESSAGE = 'Aprovação mock enviada, status alterado para EM_EXECUCAO.';
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

  if (status === 'AGUARDANDO_APROVACAO') {
    mockNotify(`Ordem ${order.id} aguardando aprovação: ${order.description}`);
  }

  if (status === 'FINALIZADA') {
    mockNotify(`Ordem ${order.id} finalizada. Enviando email para o cliente.`);
  }

  const data = buildOrderStatusUpdate(status, order);
  const updated = await orderRepository.updateOrder(id, data);

  if (status === 'AGUARDANDO_APROVACAO') {
    return { order: updated, message: ORDER_APPROVAL_MESSAGE };
  }
  if (status === 'FINALIZADA') {
    return { order: updated, message: ORDER_FINISHED_MESSAGE };
  }
  if (status === 'ENTREGUE') {
    return { order: updated, message: ORDER_DELIVERED_MESSAGE };
  }

  return updated;
}

async function addServiceToOrder(id, serviceId, budgetValue) {
  const order = await orderRepository.findOrder(id);
  if (!order) return null;

  const validated = validateServiceToOrder({ serviceId, budgetValue });

  await orderRepository.addServiceToOrder(id, validated.serviceId);
  return orderRepository.updateOrder(id, {
    budgetValue: validated.budgetValue !== undefined ? validated.budgetValue : order.budgetValue
  });
}

async function addPartToOrder(id, partId, quantity) {
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
  const orderPart = await orderRepository.addPartToOrder(id, part.id, validated.quantity);

  return { orderPart, part: updatedPart };
}

async function getOrderProgress(id) {
  const order = await orderRepository.getOrder(id);
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
  getOrderProgress
};
