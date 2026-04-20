const prisma = require('../../prisma');
const { ClientPF, ClientPJ } = require('../../domain/entities/Client');
const { CPF, CNPJ } = require('../../domain/value-objects/Document');
const IClientRepository = require('../interfaces/IClientRepository');

class PrismaClientRepository extends IClientRepository {
  async createClientPF(client) {
    const data = await prisma.clientPF.create({
      data: {
        name: client.name,
        cpf: client.cpf.toString(),
        email: client.email,
        address: client.address,
        number: client.number,
        state: client.state,
        cep: client.cep
      }
    });

    return new ClientPF(
      data.id,
      data.name,
      new CPF(data.cpf),
      data.email,
      data.address,
      data.number,
      data.state,
      data.cep,
      data.createdAt,
      data.updatedAt
    );
  }

  async findClientPFById(id) {
    const data = await prisma.clientPF.findUnique({
      where: { id },
      include: { vehicles: true }
    });

    if (!data) return null;

    return new ClientPF(
      data.id,
      data.name,
      new CPF(data.cpf),
      data.email,
      data.address,
      data.number,
      data.state,
      data.cep,
      data.createdAt,
      data.updatedAt
    );
  }

  async findClientPFByCPF(cpf) {
    const data = await prisma.clientPF.findUnique({
      where: { cpf: cpf.toString() }
    });

    if (!data) return null;

    return new ClientPF(
      data.id,
      data.name,
      new CPF(data.cpf),
      data.email,
      data.address,
      data.number,
      data.state,
      data.cep,
      data.createdAt,
      data.updatedAt
    );
  }

  async listClientsPF() {
    const data = await prisma.clientPF.findMany({
      include: { vehicles: true },
      orderBy: { createdAt: 'desc' }
    });

    return data.map(item => new ClientPF(
      item.id,
      item.name,
      new CPF(item.cpf),
      item.email,
      item.address,
      item.number,
      item.state,
      item.cep,
      item.createdAt,
      item.updatedAt
    ));
  }

  async updateClientPF(id, client) {
    const updateData = {};
    if (client.name) updateData.name = client.name;
    if (client.email) updateData.email = client.email;
    if (client.address) updateData.address = client.address;
    if (client.number) updateData.number = client.number;
    if (client.state) updateData.state = client.state;
    if (client.cep) updateData.cep = client.cep;

    const data = await prisma.clientPF.update({
      where: { id },
      data: updateData
    });

    return new ClientPF(
      data.id,
      data.name,
      new CPF(data.cpf),
      data.email,
      data.address,
      data.number,
      data.state,
      data.cep,
      data.createdAt,
      data.updatedAt
    );
  }

  async deleteClientPF(id) {
    await prisma.clientPF.delete({ where: { id } });
  }

  async createClientPJ(client) {
    const data = await prisma.clientPJ.create({
      data: {
        name: client.name,
        fantasyName: client.fantasyName,
        companyName: client.companyName,
        cnpj: client.cnpj.toString(),
        email: client.email,
        address: client.address,
        number: client.number,
        state: client.state,
        cep: client.cep,
        legalResponsible: client.legalResponsible
      }
    });

    return new ClientPJ(
      data.id,
      data.name,
      data.fantasyName,
      data.companyName,
      new CNPJ(data.cnpj),
      data.email,
      data.address,
      data.number,
      data.state,
      data.cep,
      data.legalResponsible,
      data.createdAt,
      data.updatedAt
    );
  }

  async findClientPJById(id) {
    const data = await prisma.clientPJ.findUnique({ where: { id } });

    if (!data) return null;

    return new ClientPJ(
      data.id,
      data.name,
      data.fantasyName,
      data.companyName,
      new CNPJ(data.cnpj),
      data.email,
      data.address,
      data.number,
      data.state,
      data.cep,
      data.legalResponsible,
      data.createdAt,
      data.updatedAt
    );
  }

  async findClientPJByCNPJ(cnpj) {
    const data = await prisma.clientPJ.findUnique({
      where: { cnpj: cnpj.toString() }
    });

    if (!data) return null;

    return new ClientPJ(
      data.id,
      data.name,
      data.fantasyName,
      data.companyName,
      new CNPJ(data.cnpj),
      data.email,
      data.address,
      data.number,
      data.state,
      data.cep,
      data.legalResponsible,
      data.createdAt,
      data.updatedAt
    );
  }

  async listClientsPJ() {
    const data = await prisma.clientPJ.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return data.map(item => new ClientPJ(
      item.id,
      item.name,
      item.fantasyName,
      item.companyName,
      new CNPJ(item.cnpj),
      item.email,
      item.address,
      item.number,
      item.state,
      item.cep,
      item.legalResponsible,
      item.createdAt,
      item.updatedAt
    ));
  }

  async updateClientPJ(id, client) {
    const updateData = {};
    if (client.name) updateData.name = client.name;
    if (client.fantasyName) updateData.fantasyName = client.fantasyName;
    if (client.companyName) updateData.companyName = client.companyName;
    if (client.email) updateData.email = client.email;
    if (client.address) updateData.address = client.address;
    if (client.number) updateData.number = client.number;
    if (client.state) updateData.state = client.state;
    if (client.cep) updateData.cep = client.cep;
    if (client.legalResponsible) updateData.legalResponsible = client.legalResponsible;

    const data = await prisma.clientPJ.update({
      where: { id },
      data: updateData
    });

    return new ClientPJ(
      data.id,
      data.name,
      data.fantasyName,
      data.companyName,
      new CNPJ(data.cnpj),
      data.email,
      data.address,
      data.number,
      data.state,
      data.cep,
      data.legalResponsible,
      data.createdAt,
      data.updatedAt
    );
  }

  async deleteClientPJ(id) {
    await prisma.clientPJ.delete({ where: { id } });
  }
}

module.exports = PrismaClientRepository;