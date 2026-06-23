const { validateString, validateNumber, validateDate, validateOneOf, validateEnum, ValidationError } = require('../utils/validation');

const ORDER_STATUSES = [
  'RECEBIDA',
  'EM_DIAGNOSTICO',
  'AGUARDANDO_APROVACAO',
  'EM_EXECUCAO',
  'FINALIZADA',
  'ENTREGUE'
];

const VALID_TRANSITIONS = {
  RECEBIDA: ['EM_DIAGNOSTICO'],
  EM_DIAGNOSTICO: ['AGUARDANDO_APROVACAO'],
  AGUARDANDO_APROVACAO: ['EM_EXECUCAO'],
  EM_EXECUCAO: ['FINALIZADA'],
  FINALIZADA: ['ENTREGUE'],
  ENTREGUE: []
};

function buildOrderData(body) {
  validateString(body.description, 'description');
  validateNumber(body.vehicleId, 'vehicleId', { required: true, integer: true });
  validateOneOf(body, ['clientPFId', 'clientPJId']);

  return {
    description: validateString(body.description, 'description'),
    mechanicName: body.mechanicName === undefined ? undefined : validateString(body.mechanicName, 'mechanicName', { required: false }),
    vehicleId: validateNumber(body.vehicleId, 'vehicleId', { required: true, integer: true }),
    clientPFId: body.clientPFId === undefined ? undefined : validateNumber(body.clientPFId, 'clientPFId', { required: false, integer: true }),
    clientPJId: body.clientPJId === undefined ? undefined : validateNumber(body.clientPJId, 'clientPJId', { required: false, integer: true }),
    startAt: validateDate(body.startAt, 'startAt'),
    endAt: validateDate(body.endAt, 'endAt')
  };
}

function buildOrderStatusUpdate(status, order) {
  validateEnum(status, 'status', ORDER_STATUSES);

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    throw new ValidationError(`Transição inválida: ${order.status} → ${status}. Permitido: ${allowed.join(', ') || 'nenhuma'}.`);
  }

  const data = { status };

  if (status === 'EM_EXECUCAO' && !order.startAt) {
    data.startAt = new Date();
  }

  if (status === 'FINALIZADA') {
    data.endAt = new Date();
  }

  if (status === 'ENTREGUE' && !order.endAt) {
    data.endAt = new Date();
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
    serviceId: validateNumber(body.serviceId, 'serviceId', { required: true, integer: true })
  };
}

function validatePartToOrder(body) {
  return {
    partId: validateNumber(body.partId, 'partId', { required: true, integer: true }),
    quantity: validateNumber(body.quantity === undefined ? 1 : body.quantity, 'quantity', { required: true, integer: true, min: 1 })
  };
}

module.exports = {
  ORDER_STATUSES,
  VALID_TRANSITIONS,
  buildOrderData,
  buildOrderStatusUpdate,
  validateOrderStatus,
  buildOrderProgress,
  validateServiceToOrder,
  validatePartToOrder
};
