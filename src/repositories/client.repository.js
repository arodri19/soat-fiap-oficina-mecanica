const prisma = require('../prisma');

async function createClientPF(data) {
  return prisma.clientPF.create({ data });
}

async function listClientsPF() {
  return prisma.clientPF.findMany({ include: { vehicles: true } });
}

async function getClientPF(id) {
  return prisma.clientPF.findUnique({ where: { id }, include: { vehicles: true } });
}

async function updateClientPF(id, data) {
  return prisma.clientPF.update({ where: { id }, data });
}

async function deleteClientPF(id) {
  return prisma.clientPF.delete({ where: { id } });
}

async function createClientPJ(data) {
  return prisma.clientPJ.create({ data });
}

async function listClientsPJ() {
  return prisma.clientPJ.findMany();
}

async function getClientPJ(id) {
  return prisma.clientPJ.findUnique({ where: { id } });
}

async function updateClientPJ(id, data) {
  return prisma.clientPJ.update({ where: { id }, data });
}

async function deleteClientPJ(id) {
  return prisma.clientPJ.delete({ where: { id } });
}

module.exports = {
  createClientPF,
  listClientsPF,
  getClientPF,
  updateClientPF,
  deleteClientPF,
  createClientPJ,
  listClientsPJ,
  getClientPJ,
  updateClientPJ,
  deleteClientPJ
};
