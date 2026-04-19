const prisma = require('../prisma');

async function createBudget(totalBudget, orderIds) {
  return prisma.budget.create({
    data: {
      totalBudget,
      orders: {
        connect: orderIds.map((id) => ({ id }))
      }
    },
    include: {
      orders: {
        include: {
          vehicle: true,
          clientPF: true,
          clientPJ: true,
          services: { include: { service: true } },
          parts: { include: { part: true } }
        }
      }
    }
  });
}

async function getBudget(id) {
  return prisma.budget.findUnique({
    where: { id },
    include: {
      orders: {
        include: {
          vehicle: true,
          clientPF: true,
          clientPJ: true,
          services: { include: { service: true } },
          parts: { include: { part: true } }
        }
      }
    }
  });
}

async function listBudgets() {
  return prisma.budget.findMany({
    include: {
      orders: {
        include: {
          vehicle: true,
          clientPF: true,
          clientPJ: true,
          services: { include: { service: true } },
          parts: { include: { part: true } }
        }
      }
    }
  });
}

async function updateBudget(id, data) {
  return prisma.budget.update({
    where: { id },
    data,
    include: {
      orders: {
        include: {
          vehicle: true,
          clientPF: true,
          clientPJ: true,
          services: { include: { service: true } },
          parts: { include: { part: true } }
        }
      }
    }
  });
}

async function deleteBudget(id) {
  return prisma.budget.delete({ where: { id } });
}

module.exports = {
  createBudget,
  getBudget,
  listBudgets,
  updateBudget,
  deleteBudget
};