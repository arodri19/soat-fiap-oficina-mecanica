const ClientApplicationService = require('../../src/application/services/ClientApplicationService');
const { ClientPF, ClientPJ } = require('../../src/domain/entities/Client');
const { CPF, CNPJ } = require('../../src/domain/value-objects/Document');

describe('ClientApplicationService', () => {
  let mockRepository;
  let service;

  beforeEach(() => {
    mockRepository = {
      createClientPF: jest.fn(),
      findClientPFById: jest.fn(),
      findClientPFByCPF: jest.fn(),
      listClientsPF: jest.fn(),
      updateClientPF: jest.fn(),
      deleteClientPF: jest.fn(),
      createClientPJ: jest.fn(),
      findClientPJById: jest.fn(),
      findClientPJByCNPJ: jest.fn(),
      listClientsPJ: jest.fn(),
      updateClientPJ: jest.fn(),
      deleteClientPJ: jest.fn()
    };

    service = new ClientApplicationService(mockRepository);
  });

  describe('createClientPF', () => {
    it('should create client PF successfully', async () => {
      const client = ClientPF.create('João Silva', new CPF('12345678901'), 'joao@email.com', 'Rua A', '123', 'SP', '12345678');
      const savedClient = { ...client, id: 1 };

      mockRepository.findClientPFByCPF.mockResolvedValue(null);
      mockRepository.createClientPF.mockResolvedValue(savedClient);

      const result = await service.createClientPF('João Silva', '12345678901', 'joao@email.com', 'Rua A', '123', 'SP', '12345678');

      expect(mockRepository.createClientPF).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });
  });

  describe('getClientPF', () => {
    it('should get client PF successfully', async () => {
      const cpf = new CPF('12345678901');
      const client = ClientPF.create('João Silva', cpf, 'joao@email.com', 'Rua A', '123', 'SP', '12345678');
      client.id = 1;

      mockRepository.findClientPFById.mockResolvedValue(client);

      const result = await service.getClientPF(1);

      expect(mockRepository.findClientPFById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.name).toBe('João Silva');
      expect(result.cpf).toBe('123.456.789-01');
    });
  });

  describe('listClientsPF', () => {
    it('should list all clients PF', async () => {
      const cpf1 = new CPF('12345678901');
      const client1 = ClientPF.create('João Silva', cpf1, 'joao@email.com', 'Rua A', '123', 'SP', '12345678');
      client1.id = 1;
      const cpf2 = new CPF('98765432100');
      const client2 = ClientPF.create('Maria Santos', cpf2, 'maria@email.com', 'Rua B', '456', 'SP', '87654321');
      client2.id = 2;
      const clients = [client1, client2];

      mockRepository.listClientsPF.mockResolvedValue(clients);

      const result = await service.listClientsPF();

      expect(mockRepository.listClientsPF).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('João Silva');
      expect(result[0].cpf).toBe('123.456.789-01');
    });
  });

  describe('updateClientPF', () => {
    it('should update client PF successfully', async () => {
      const existingClient = ClientPF.create('João Silva', new CPF('12345678901'), 'joao@email.com', '11999999999', 'Rua A, 123');
      existingClient.id = 1;
      const updatedClient = { ...existingClient, name: 'João Silva Atualizado' };

      mockRepository.findClientPFById.mockResolvedValue(existingClient);
      mockRepository.updateClientPF.mockResolvedValue(updatedClient);

      const result = await service.updateClientPF(1, 'João Silva Atualizado', 'joao@email.com', '11999999999', 'Rua A, 123');

      expect(mockRepository.updateClientPF).toHaveBeenCalled();
      expect(result.name).toBe('João Silva Atualizado');
    });
  });

  describe('deleteClientPF', () => {
    it('should delete client PF successfully', async () => {
      const client = { id: 1, name: 'João Silva' };

      mockRepository.findClientPFById.mockResolvedValue(client);
      mockRepository.deleteClientPF.mockResolvedValue();

      await service.deleteClientPF(1);

      expect(mockRepository.deleteClientPF).toHaveBeenCalledWith(1);
    });
  });

  describe('createClientPJ', () => {
    it('should create client PJ successfully', async () => {
      const cnpj = new CNPJ('12345678000123');
      const client = ClientPJ.create('Empresa XYZ', 'Empresa XYZ Ltda', 'Empresa XYZ Ltda', cnpj, 'contato@empresa.com', 'Av. Paulista', '1000', 'SP', '01310100', 'João Silva');
      const savedClient = { ...client, id: 1 };

      mockRepository.findClientPJByCNPJ.mockResolvedValue(null);
      mockRepository.createClientPJ.mockResolvedValue(savedClient);

      const result = await service.createClientPJ({ name: 'Empresa XYZ', fantasyName: 'Empresa XYZ Ltda', companyName: 'Empresa XYZ Ltda', cnpj: '12345678000123', email: 'contato@empresa.com', address: 'Av. Paulista', number: '1000', state: 'SP', cep: '01310100', legalResponsible: 'João Silva' });

      expect(mockRepository.createClientPJ).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });
  });

  describe('getClientPJ', () => {
    it('should get client PJ successfully', async () => {
      const cnpj = new CNPJ('12345678000123');
      const client = ClientPJ.create('Empresa XYZ', 'Empresa XYZ Ltda', 'Empresa XYZ Ltda', cnpj, 'contato@empresa.com', 'Av. Paulista', '1000', 'SP', '01310100', 'João Silva');
      client.id = 1;

      mockRepository.findClientPJById.mockResolvedValue(client);

      const result = await service.getClientPJ(1);

      expect(mockRepository.findClientPJById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.companyName).toBe('Empresa XYZ Ltda');
      expect(result.cnpj).toBe('12.345.678/0001-23');
    });
  });

  describe('listClientsPJ', () => {
    it('should list all clients PJ', async () => {
      const cnpj1 = new CNPJ('12345678000123');
      const client1 = ClientPJ.create('Empresa XYZ', 'Empresa XYZ Ltda', 'Empresa XYZ Ltda', cnpj1, 'contato@empresa.com', 'Av. Paulista', '1000', 'SP', '01310100', 'João Silva');
      client1.id = 1;
      const cnpj2 = new CNPJ('98765432000100');
      const client2 = ClientPJ.create('Empresa ABC', 'Empresa ABC Ltda', 'Empresa ABC Ltda', cnpj2, 'contato@abc.com', 'Av. Brasil', '2000', 'SP', '01410200', 'Maria Silva');
      client2.id = 2;
      const clients = [client1, client2];

      mockRepository.listClientsPJ.mockResolvedValue(clients);

      const result = await service.listClientsPJ();

      expect(mockRepository.listClientsPJ).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].companyName).toBe('Empresa XYZ Ltda');
      expect(result[0].cnpj).toBe('12.345.678/0001-23');
    });
  });

  describe('updateClientPJ', () => {
    it('should update client PJ successfully', async () => {
      const cnpj = new CNPJ('12345678000123');
      const existingClient = ClientPJ.create('Empresa XYZ', 'Empresa XYZ Ltda', 'Empresa XYZ Ltda', cnpj, 'contato@empresa.com', 'Av. Paulista', '1000', 'SP', '01310100', 'João Silva');
      existingClient.id = 1;
      const updatedClient = { ...existingClient, companyName: 'Empresa XYZ Atualizada' };

      mockRepository.findClientPJById.mockResolvedValue(existingClient);
      mockRepository.updateClientPJ.mockResolvedValue(updatedClient);

      const result = await service.updateClientPJ(1, { name: 'Empresa XYZ Atualizada', email: 'contato@empresa.com', address: 'Av. Paulista, 1000', legalResponsible: 'João Silva' });

      expect(mockRepository.updateClientPJ).toHaveBeenCalled();
      expect(result.companyName).toBe('Empresa XYZ Atualizada');
    });
  });

  describe('deleteClientPJ', () => {
    it('should delete client PJ successfully', async () => {
      const client = { id: 1, companyName: 'Empresa XYZ' };

      mockRepository.findClientPJById.mockResolvedValue(client);
      mockRepository.deleteClientPJ.mockResolvedValue();

      await service.deleteClientPJ(1);

      expect(mockRepository.deleteClientPJ).toHaveBeenCalledWith(1);
    });
  });
});