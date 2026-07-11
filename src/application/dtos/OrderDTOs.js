const { validateString, validateNumber, validateDate, validateOneOf, validateEnum } = require('../../utils/validation');
const OrderStatus = require('../../domain/value-objects/OrderStatus');

class CreateOrderRequestDTO {
  constructor({ description, vehicleId, clientPFId, clientPJId, mechanicName, startAt, endAt, services }) {
    this.description = validateString(description, 'description', { required: true });
    this.vehicleId = validateNumber(vehicleId, 'vehicleId', { required: true, integer: true });
    validateOneOf({ clientPFId, clientPJId }, ['clientPFId', 'clientPJId']);
    if (clientPFId !== undefined) {
      this.clientPFId = validateNumber(clientPFId, 'clientPFId', { required: false, integer: true });
    }
    if (clientPJId !== undefined) {
      this.clientPJId = validateNumber(clientPJId, 'clientPJId', { required: false, integer: true });
    }
    if (mechanicName !== undefined) {
      this.mechanicName = validateString(mechanicName, 'mechanicName', { required: false });
    }
    this.startAt = validateDate(startAt, 'startAt');
    this.endAt = validateDate(endAt, 'endAt');

    if (services !== undefined) {
      if (!Array.isArray(services)) throw new Error('services deve ser um array');
      this.services = services.map((s, i) => {
        const serviceId = validateNumber(s.serviceId, `services[${i}].serviceId`, { required: true, integer: true });
        const parts = Array.isArray(s.parts)
          ? s.parts.map((p, j) => ({
              partId:   validateNumber(p.partId,   `services[${i}].parts[${j}].partId`,   { required: true,  integer: true }),
              quantity: validateNumber(p.quantity, `services[${i}].parts[${j}].quantity`, { required: false, integer: true, min: 1 }) ?? 1,
            }))
          : [];
        return { serviceId, parts };
      });
    } else {
      this.services = [];
    }
  }
}

class UpdateOrderStatusRequestDTO {
  constructor({ status }) {
    validateEnum(status, 'status', OrderStatus.STATUSES);
    this.status = status;
  }
}

class AddServiceRequestDTO {
  constructor({ serviceId }) {
    this.serviceId = validateNumber(serviceId, 'serviceId', { required: true, integer: true });
  }
}

class AddPartRequestDTO {
  constructor({ orderServiceServiceId, partId, quantity = 1 }) {
    this.orderServiceServiceId = validateNumber(orderServiceServiceId, 'orderServiceServiceId', { required: true, integer: true });
    this.partId = validateNumber(partId, 'partId', { required: true, integer: true });
    this.quantity = validateNumber(quantity, 'quantity', { required: true, integer: true, min: 1 });
  }
}

class OrderProgressResponseDTO {
  static fromOrder(order) {
    return {
      status: order.status?.toString ? order.status.toString() : order.status,
      mechanicDescription: order.description,
      mechanicName: order.mechanicName ?? null
    };
  }
}

module.exports = {
  CreateOrderRequestDTO,
  UpdateOrderStatusRequestDTO,
  AddServiceRequestDTO,
  AddPartRequestDTO,
  OrderProgressResponseDTO
};
