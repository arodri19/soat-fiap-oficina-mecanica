const prisma = require('../prisma');

async function createOrder(data) {
  return prisma.orderService.create({ data });
}

async function listOrders() {
  return prisma.orderService.findMany({
    include: {
      vehicle: true,
      clientPF: true,
      clientPJ: true,
      services: { include: { service: true, parts: { include: { part: true } } } }
    }
  });
}

async function getOrder(id) {
  return prisma.orderService.findUnique({
    where: { id },
    include: {
      vehicle: true,
      clientPF: true,
      clientPJ: true,
      services: { include: { service: true, parts: { include: { part: true } } } }
    }
  });
}

async function findOrder(id) {
  return prisma.orderService.findUnique({ where: { id }, include: { clientPF: true, clientPJ: true } });
}

async function updateOrder(id, data) {
  return prisma.orderService.update({ where: { id }, data });
}

async function addServiceToOrder(orderServiceId, serviceId) {
  return prisma.orderServiceService.create({ data: { orderServiceId, serviceId } });
}

async function addPartToOrder(orderServiceServiceId, partId, quantity) {
  return prisma.orderServiceServicePart.create({ data: { orderServiceServiceId, partId, quantity } });
}

async function findOrdersByIds(ids) {
  return prisma.orderService.findMany({
    where: { id: { in: ids } },
    include: {
      vehicle: true,
      clientPF: true,
      clientPJ: true,
      services: { include: { service: true, parts: { include: { part: true } } } }
    }
  });
}

async function findOrderByExternalId(externalId) {
  return prisma.orderService.findUnique({
    where: { externalId },
    include: { clientPF: true, clientPJ: true }
  });
}

async function calculateOrderBudget(id) {
  const order = await prisma.orderService.findUnique({
    where: { id },
    include: {
      services: {
        include: {
          service: true,
          parts: { include: { part: true } }
        }
      }
    }
  });
  if (!order) return 0;
  let total = 0;
  for (const os of order.services) {
    total += os.service.price || 0;
    for (const osp of os.parts) {
      total += (osp.part.price || 0) * osp.quantity;
    }
  }
  return total;
}

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  findOrder,
  findOrdersByIds,
  findOrderByExternalId,
  calculateOrderBudget,
  updateOrder,
  addServiceToOrder,
  addPartToOrder
};
