const { Prisma } = require('@prisma/client');
const prisma = require('../../prisma');
const IOrderRepository = require('../interfaces/IOrderRepository');

const EXCLUDED_STATUSES = ['FINALIZADA', 'ENTREGUE'];
const STATUS_PRIORITY = `CASE status
  WHEN 'EM_EXECUCAO'          THEN 1
  WHEN 'AGUARDANDO_APROVACAO' THEN 2
  WHEN 'EM_DIAGNOSTICO'       THEN 3
  WHEN 'RECEBIDA'             THEN 4
  ELSE 5 END`;

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
    const skip = (page - 1) * limit;

    // status is a PostgreSQL enum — cast to text to allow parameterized comparison
    const statusFilter = status
      ? Prisma.sql`AND status::text = ${status}`
      : Prisma.empty;

    // Step 1: get ordered IDs via raw SQL (CASE WHEN not supported in Prisma orderBy)
    const rows = await prisma.$queryRaw`
      SELECT id FROM "OrderService"
      WHERE status NOT IN ('FINALIZADA', 'ENTREGUE')
      ${statusFilter}
      ORDER BY
        ${Prisma.raw(STATUS_PRIORITY)} ASC,
        id ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const ids = rows.map(r => Number(r.id));

    // Step 2: load full objects with relations
    const unsorted = await prisma.orderService.findMany({
      where: { id: { in: ids } },
      include: ORDER_WITH_RELATIONS,
    });

    // Step 3: restore SQL order (findMany doesn't preserve IN order)
    const byId = new Map(unsorted.map(o => [o.id, o]));
    const data = ids.map(id => byId.get(id));

    const total = await prisma.orderService.count({
      where: {
        status: { notIn: EXCLUDED_STATUSES },
        ...(status ? { status } : {}),
      },
    });

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
