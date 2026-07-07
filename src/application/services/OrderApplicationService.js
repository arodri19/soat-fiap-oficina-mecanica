const {
  CreateOrderUseCase,
  ListOrdersUseCase,
  GetOrderUseCase,
  UpdateOrderStatusUseCase,
  AddServiceToOrderUseCase,
  AddPartToOrderUseCase,
  ApproveOrderUseCase,
  GetOrderProgressUseCase,
  GetOrderProgressByExternalIdUseCase
} = require('../use-cases/OrderUseCases');

class OrderApplicationService {
  constructor(orderRepository, partRepository) {
    this.orderRepository = orderRepository;
    this.partRepository = partRepository;
  }

  async createOrder(data) {
    return new CreateOrderUseCase(this.orderRepository).execute(data);
  }

  async listOrders() {
    return new ListOrdersUseCase(this.orderRepository).execute();
  }

  async getOrder(id) {
    return new GetOrderUseCase(this.orderRepository).execute(id);
  }

  async updateOrderStatus(id, status) {
    return new UpdateOrderStatusUseCase(this.orderRepository).execute(id, status);
  }

  async addServiceToOrder(id, serviceId) {
    return new AddServiceToOrderUseCase(this.orderRepository).execute(id, serviceId);
  }

  async addPartToOrder(id, orderServiceServiceId, partId, quantity) {
    return new AddPartToOrderUseCase(this.orderRepository, this.partRepository)
      .execute({ orderId: id, orderServiceServiceId, partId, quantity });
  }

  async approveOrder(externalId) {
    return new ApproveOrderUseCase(this.orderRepository).execute(externalId);
  }

  async getOrderProgress(id) {
    return new GetOrderProgressUseCase(this.orderRepository).execute(id);
  }

  async getOrderProgressByExternalId(externalId) {
    return new GetOrderProgressByExternalIdUseCase(this.orderRepository).execute(externalId);
  }
}

module.exports = OrderApplicationService;
