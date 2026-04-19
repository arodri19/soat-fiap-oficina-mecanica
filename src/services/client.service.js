const clientRepository = require('../repositories/client.repository');
const {
  buildClientPFData,
  buildClientPFUpdateData,
  buildClientPJData,
  buildClientPJUpdateData
} = require('../models/client.model');

async function createClientPF(body) {
  return clientRepository.createClientPF(buildClientPFData(body));
}

async function listClientsPF() {
  return clientRepository.listClientsPF();
}

async function getClientPF(id) {
  return clientRepository.getClientPF(id);
}

async function updateClientPF(id, body) {
  return clientRepository.updateClientPF(id, buildClientPFUpdateData(body));
}

async function deleteClientPF(id) {
  return clientRepository.deleteClientPF(id);
}

async function createClientPJ(body) {
  return clientRepository.createClientPJ(buildClientPJData(body));
}

async function listClientsPJ() {
  return clientRepository.listClientsPJ();
}

async function getClientPJ(id) {
  return clientRepository.getClientPJ(id);
}

async function updateClientPJ(id, body) {
  return clientRepository.updateClientPJ(id, buildClientPJUpdateData(body));
}

async function deleteClientPJ(id) {
  return clientRepository.deleteClientPJ(id);
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
