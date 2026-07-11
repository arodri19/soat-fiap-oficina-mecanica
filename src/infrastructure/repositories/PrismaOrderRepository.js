const prisma = require('../../prisma');
const IOrderRepository = require('../interfaces/IOrderRepository');

const ORDER_WITH_RELATIONS = {
  vehicle: true,
  clientPF: true,
  clientPJ: true,
  services: { include: { service: true, parts: { include: { part: true } } } }
};

class PrismaOrderRepository extends IOrderRepository {
  async createOrder(data) {
    return prisma.orderService.create({ data });
  }

  async getOrder(id) {
    return prisma.orderService.findUnique({ where: { id }, include: ORDER_WITH_RELATIONS });
  }

  async findOrderById(id) {
    return prisma.orderService.findUnique({
      where: { id },
      include: { clientPF: true, clientPJ: true }
    });
  }

  async findOrderByExternalId(externalId) {
    return prisma.orderService.findUnique({
      where: { externalId },
      include: { clientPF: true, clientPJ: true }
    });
  }

  async listOrders({ status, page = 1, limit = 20 } = {}) {
    const where = status ? { status } : {};
    const skip  = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.orderService.findMany({
        where,
        include: ORDER_WITH_RELATIONS,
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      prisma.orderService.count({ where }),
    ]);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async updateOrder(id, data) {
    return prisma.orderService.update({ where: { id }, data });
  }

  async addServiceToOrder(orderId, serviceId) {
    return prisma.orderServiceService.create({ data: { orderServiceId: orderId, serviceId } });
  }

  async addPartToOrder(orderServiceServiceId, partId, quantity) {
    return prisma.orderServiceServicePart.create({
      data: { orderServiceServiceId, partId, quantity }
    });
  }

  async findOrdersByIds(ids) {
    return prisma.orderService.findMany({
      where: { id: { in: ids } },
      include: ORDER_WITH_RELATIONS
    });
  }

  async calculateOrderBudget(id) {
    const order = await prisma.orderService.findUnique({
      where: { id },
      include: {
        services: { include: { service: true, parts: { include: { part: true } } } }
      }
    });
    if (!order) return 0;

    return order.services.reduce((total, os) => {
      const partsTotal = os.parts.reduce((sum, osp) => sum + (osp.part.price || 0) * osp.quantity, 0);
      return total + (os.service.price || 0) + partsTotal;
    }, 0);
  }
}

module.exports = PrismaOrderRepository;
