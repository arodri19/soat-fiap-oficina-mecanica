class IOrderRepository {
  async createOrder(data) { throw new Error('Method not implemented'); }
  async getOrder(id) { throw new Error('Method not implemented'); }
  async findOrderById(id) { throw new Error('Method not implemented'); }
  async findOrderByExternalId(externalId) { throw new Error('Method not implemented'); }
  async listOrders() { throw new Error('Method not implemented'); }
  async updateOrder(id, data) { throw new Error('Method not implemented'); }
  async addServiceToOrder(orderId, serviceId) { throw new Error('Method not implemented'); }
  async addPartToOrder(orderServiceServiceId, partId, quantity) { throw new Error('Method not implemented'); }
  async findOrdersByIds(ids) { throw new Error('Method not implemented'); }
  async calculateOrderBudget(id) { throw new Error('Method not implemented'); }
}

module.exports = IOrderRepository;
