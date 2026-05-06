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

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  findOrder,
  findOrdersByIds,
  updateOrder,
  addServiceToOrder,
  addPartToOrder
};
