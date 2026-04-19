const { validateString, validateNumber, validateDate, validateOneOf, validateEnum } = require('../utils/validation');

const ORDER_STATUSES = [
  'RECEBIDA',
  'EM_DIAGNOSTICO',
  'AGUARDANDO_APROVACAO',
  'EM_EXECUCAO',
  'FINALIZADA',
  'ENTREGUE'
];

function buildOrderData(body) {
  validateString(body.description, 'description');
  validateNumber(body.vehicleId, 'vehicleId', { required: true, integer: true });
  validateOneOf(body, ['clientPFId', 'clientPJId']);

  return {
    description: validateString(body.description, 'description'),
    mechanicName: body.mechanicName !== undefined ? validateString(body.mechanicName, 'mechanicName', { required: false }) : undefined,
    vehicleId: validateNumber(body.vehicleId, 'vehicleId', { required: true, integer: true }),
    clientPFId: body.clientPFId !== undefined ? validateNumber(body.clientPFId, 'clientPFId', { required: false, integer: true }) : undefined,
    clientPJId: body.clientPJId !== undefined ? validateNumber(body.clientPJId, 'clientPJId', { required: false, integer: true }) : undefined,
    startAt: validateDate(body.startAt, 'startAt'),
    endAt: validateDate(body.endAt, 'endAt')
  };
}

function buildOrderStatusUpdate(status, order) {
  validateEnum(status, 'status', ORDER_STATUSES);

  const data = { status };

  if (status === 'AGUARDANDO_APROVACAO') {
    data.status = 'EM_EXECUCAO';
    data.startAt = order.startAt || new Date();
  }

  if (status === 'FINALIZADA') {
    data.endAt = new Date();
  }

  if (status === 'EM_EXECUCAO' && !order.startAt) {
    data.startAt = new Date();
  }

  if (status === 'ENTREGUE') {
    data.endAt = data.endAt || new Date();
  }

  return data;
}

function validateOrderStatus(status) {
  return ORDER_STATUSES.includes(status);
}

function buildOrderProgress(order) {
  return {
    status: order.status,
    mechanicDescription: order.description,
    mechanicName: order.mechanicName
  };
}

function validateServiceToOrder(body) {
  return {
    serviceId: validateNumber(body.serviceId, 'serviceId', { required: true, integer: true }),
    budgetValue: body.budgetValue !== undefined ? validateNumber(body.budgetValue, 'budgetValue', { required: false, min: 0 }) : undefined
  };
}

function validatePartToOrder(body) {
  return {
    partId: validateNumber(body.partId, 'partId', { required: true, integer: true }),
    quantity: validateNumber(body.quantity !== undefined ? body.quantity : 1, 'quantity', { required: true, integer: true, min: 1 })
  };
}

module.exports = {
  ORDER_STATUSES,
  buildOrderData,
  buildOrderStatusUpdate,
  validateOrderStatus,
  buildOrderProgress,
  validateServiceToOrder,
  validatePartToOrder
};
