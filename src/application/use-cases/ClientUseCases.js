const { ClientPF, ClientPJ } = require('../../domain/entities/Client');
const {
  ClientPFResponseDTO,
  ClientPJResponseDTO
} = require('../dtos/ClientDTOs');

class CreateClientPFUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute(request) {
    const cpf = request.cpf;

    // Check if CPF already exists
    const existingClient = await this.clientRepository.findClientPFByCPF(cpf);
    if (existingClient) {
      throw new Error('CPF já cadastrado');
    }

    const client = ClientPF.create(
      request.name,
      cpf,
      request.email,
      request.address,
      request.number,
      request.state,
      request.cep
    );

    const savedClient = await this.clientRepository.createClientPF(client);
    return new ClientPFResponseDTO(savedClient);
  }
}

class GetClientPFUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute(id) {
    const client = await this.clientRepository.findClientPFById(id);
    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    return new ClientPFResponseDTO(client);
  }
}

class ListClientsPFUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute() {
    const clients = await this.clientRepository.listClientsPF();
    return clients.map(client => new ClientPFResponseDTO(client));
  }
}

class UpdateClientPFUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute(id, request) {
    const existingClient = await this.clientRepository.findClientPFById(id);
    if (!existingClient) {
      throw new Error('Cliente não encontrado');
    }

    const updatedClient = ClientPF.create(
      request.name || existingClient.name,
      existingClient.cpf,
      request.email || existingClient.email,
      request.address || existingClient.address,
      request.number || existingClient.number,
      request.state || existingClient.state,
      request.cep || existingClient.cep
    );

    const savedClient = await this.clientRepository.updateClientPF(id, updatedClient);
    return new ClientPFResponseDTO(savedClient);
  }
}

class DeleteClientPFUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute(id) {
    const existingClient = await this.clientRepository.findClientPFById(id);
    if (!existingClient) {
      throw new Error('Cliente não encontrado');
    }

    await this.clientRepository.deleteClientPF(id);
  }
}

class CreateClientPJUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute(request) {
    const cnpj = request.cnpj;

    // Check if CNPJ already exists
    const existingClient = await this.clientRepository.findClientPJByCNPJ(cnpj);
    if (existingClient) {
      throw new Error('CNPJ já cadastrado');
    }

    const client = ClientPJ.create(
      request.name,
      request.fantasyName,
      request.companyName,
      cnpj,
      request.email,
      request.address,
      request.number,
      request.state,
      request.cep,
      request.legalResponsible
    );

    const savedClient = await this.clientRepository.createClientPJ(client);
    return ClientPJResponseDTO.create(savedClient);
  }
}

class GetClientPJUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute(id) {
    const client = await this.clientRepository.findClientPJById(id);
    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    return ClientPJResponseDTO.create(client);
  }
}

class ListClientsPJUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute() {
    const clients = await this.clientRepository.listClientsPJ();
    return clients.map(client => ClientPJResponseDTO.create(client));
  }
}

class UpdateClientPJUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute(id, request) {
    const existingClient = await this.clientRepository.findClientPJById(id);
    if (!existingClient) {
      throw new Error('Cliente não encontrado');
    }

    const updatedClient = ClientPJ.create(
      request.name || existingClient.name,
      request.fantasyName || existingClient.fantasyName,
      request.companyName || existingClient.companyName,
      existingClient.cnpj,
      request.email || existingClient.email,
      request.address || existingClient.address,
      request.number || existingClient.number,
      request.state || existingClient.state,
      request.cep || existingClient.cep,
      request.legalResponsible || existingClient.legalResponsible
    );

    const savedClient = await this.clientRepository.updateClientPJ(id, updatedClient);
    return ClientPJResponseDTO.create(savedClient);
  }
}

class DeleteClientPJUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute(id) {
    const existingClient = await this.clientRepository.findClientPJById(id);
    if (!existingClient) {
      throw new Error('Cliente não encontrado');
    }

    await this.clientRepository.deleteClientPJ(id);
  }
}

module.exports = {
  CreateClientPFUseCase,
  GetClientPFUseCase,
  ListClientsPFUseCase,
  UpdateClientPFUseCase,
  DeleteClientPFUseCase,
  CreateClientPJUseCase,
  GetClientPJUseCase,
  ListClientsPJUseCase,
  UpdateClientPJUseCase,
  DeleteClientPJUseCase
};