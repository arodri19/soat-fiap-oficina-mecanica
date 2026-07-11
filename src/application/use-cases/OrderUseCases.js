const Order = require('../../domain/entities/Order');
const { ValidationError } = require('../../utils/validation');
const {
  CreateOrderRequestDTO,
  UpdateOrderStatusRequestDTO,
  AddServiceRequestDTO,
  AddPartRequestDTO,
  OrderProgressResponseDTO
} = require('../dtos/OrderDTOs');

const STATUS_MESSAGES = {
  AGUARDANDO_APROVACAO: 'Aguardando aprovação do cliente. Use o link de acompanhamento para aprovar.',
  FINALIZADA: 'Finalizado e email mock enviado ao cliente.',
  ENTREGUE: 'Pagamento mock registrado e ordem entregue.'
};

class CreateOrderUseCase {
  constructor(orderRepository, partRepository) {
    this.orderRepository = orderRepository;
    this.partRepository  = partRepository;
  }

  async execute(data) {
    const dto   = new CreateOrderRequestDTO(data);
    const order = Order.create(dto);
    const created = await this.orderRepository.createOrder(order.toPlainObject());

    for (const svc of dto.services) {
      let osService;
      try {
        osService = await this.orderRepository.addServiceToOrder(created.id, svc.serviceId);
      } catch {
        throw new ValidationError(`Serviço ${svc.serviceId} não encontrado`);
      }

      for (const { partId, quantity } of svc.parts) {
        const part = await this.partRepository.findPartById(partId);
        if (!part) throw new ValidationError(`Peça ${partId} não encontrada`);

        let stock = part.quantity;
        if (stock < quantity) {
          const restock = Math.max(quantity, 1) + 1;
          console.log(`[MOCK] Reposição da peça ${part.name} solicitada ao fornecedor.`);
          stock = part.quantity + restock;
          await this.partRepository.updatePartQuantity(part.id, stock);
        }
        await this.partRepository.updatePartQuantity(part.id, stock - quantity);
        await this.orderRepository.addPartToOrder(osService.id, partId, quantity);
      }
    }

    if (dto.services.length > 0) {
      const budgetValue = await this.orderRepository.calculateOrderBudget(created.id);
      await this.orderRepository.updateOrder(created.id, { budgetValue });
    }

    const full = await this.orderRepository.getOrder(created.id);
    return {
      id:         full.id,
      externalId: full.externalId,
      status:     full.status,
      budgetValue: full.budgetValue,
      services:   full.services,
      vehicle:    full.vehicle,
      clientPF:   full.clientPF,
      clientPJ:   full.clientPJ,
    };
  }
}

class ListOrdersUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute({ status, page, limit } = {}) {
    return this.orderRepository.listOrders({ status, page, limit });
  }
}

class GetOrderUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(id) {
    return this.orderRepository.getOrder(id);
  }
}

class UpdateOrderStatusUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(id, status) {
    new UpdateOrderStatusRequestDTO({ status });

    const raw = await this.orderRepository.findOrderById(id);
    if (!raw) return null;

    const order = Order.fromPrisma(raw);
    order.transitionTo(status);

    const updateData = { status: order.status.toString() };
    if (order.startAt && !raw.startAt) updateData.startAt = order.startAt;
    if (order.endAt && !raw.endAt) updateData.endAt = order.endAt;

    const updated = await this.orderRepository.updateOrder(id, updateData);

    const message = STATUS_MESSAGES[status];
    return message ? { order: updated, message } : updated;
  }
}

class AddServiceToOrderUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(orderId, serviceId) {
    const dto = new AddServiceRequestDTO({ serviceId });
    const exists = await this.orderRepository.findOrderById(orderId);
    if (!exists) return null;

    await this.orderRepository.addServiceToOrder(orderId, dto.serviceId);
    const budgetValue = await this.orderRepository.calculateOrderBudget(orderId);
    return this.orderRepository.updateOrder(orderId, { budgetValue });
  }
}

class AddPartToOrderUseCase {
  constructor(orderRepository, partRepository) {
    this.orderRepository = orderRepository;
    this.partRepository = partRepository;
  }

  async execute({ orderId, orderServiceServiceId, partId, quantity }) {
    const dto = new AddPartRequestDTO({ orderServiceServiceId, partId, quantity });
    const exists = await this.orderRepository.findOrderById(orderId);
    if (!exists) return null;

    const part = await this.partRepository.findPartById(dto.partId);
    if (!part) return { error: 'PART_NOT_FOUND' };

    let currentPart = part;
    if (!part.quantity || part.quantity < dto.quantity) {
      const restock = Math.max(dto.quantity, 1) + 1;
      console.log(`[MOCK] Pedido de reposição da peça ${part.name} enviado ao fornecedor.`);
      currentPart = await this.partRepository.updatePartQuantity(part.id, part.quantity + restock);
    }

    const updatedPart = await this.partRepository.updatePartQuantity(
      part.id,
      currentPart.quantity - dto.quantity
    );
    const orderPart = await this.orderRepository.addPartToOrder(
      dto.orderServiceServiceId,
      part.id,
      dto.quantity
    );

    const budgetValue = await this.orderRepository.calculateOrderBudget(orderId);
    await this.orderRepository.updateOrder(orderId, { budgetValue });

    return { orderPart, part: updatedPart };
  }
}

class ApproveOrderUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(externalId) {
    const raw = await this.orderRepository.findOrderByExternalId(externalId);
    if (!raw) return null;

    const order = Order.fromPrisma(raw);
    if (!order.status.isAwaitingApproval()) {
      throw new ValidationError(`Ordem não está aguardando aprovação. Status atual: ${order.status}.`);
    }

    order.approve();
    console.log(`[MOCK] Ordem ${raw.id} aprovada pelo cliente. Iniciando execução.`);

    const updateData = { status: order.status.toString() };
    if (!raw.startAt && order.startAt) updateData.startAt = order.startAt;
    return this.orderRepository.updateOrder(raw.id, updateData);
  }
}

class GetOrderProgressUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(id) {
    const order = await this.orderRepository.findOrderById(id);
    if (!order) return null;
    return OrderProgressResponseDTO.fromOrder(order);
  }
}

class GetOrderProgressByExternalIdUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(externalId) {
    const order = await this.orderRepository.findOrderByExternalId(externalId);
    if (!order) return null;
    return OrderProgressResponseDTO.fromOrder(order);
  }
}

module.exports = {
  CreateOrderUseCase,
  ListOrdersUseCase,
  GetOrderUseCase,
  UpdateOrderStatusUseCase,
  AddServiceToOrderUseCase,
  AddPartToOrderUseCase,
  ApproveOrderUseCase,
  GetOrderProgressUseCase,
  GetOrderProgressByExternalIdUseCase
};
