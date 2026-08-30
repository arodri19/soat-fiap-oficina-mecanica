const {
  ApproveOrderUseCase,
  GetOrderProgressByExternalIdUseCase
} = require('../../../src/application/use-cases/OrderUseCases');

// Cobre o fix de IDOR/BOLA em src/routes/track.routes.js: um cliente autenticado só
// pode ver/aprovar a própria OS, mesmo sabendo o externalId de outra (UUID vazado,
// compartilhado, etc.). Ver ADR/achado de segurança na conversa que originou o fix.
describe('Segurança — dono da OS em /api/track/:externalId', () => {
  const ORDER_OF_CLIENT_1 = {
    id: 10,
    externalId: 'ext-de-outro-cliente',
    status: 'AGUARDANDO_APROVACAO',
    description: 'Revisão completa',
    clientPFId: 1,
    clientPJId: null,
    vehicleId: 5
  };

  let mockOrderRepository;

  beforeEach(() => {
    mockOrderRepository = {
      findOrderByExternalId: jest.fn(),
      updateOrder: jest.fn()
    };
  });

  describe('GetOrderProgressByExternalIdUseCase', () => {
    it('retorna null quando a OS pertence a outro cliente (não vaza dados)', async () => {
      mockOrderRepository.findOrderByExternalId.mockResolvedValue(ORDER_OF_CLIENT_1);

      const useCase = new GetOrderProgressByExternalIdUseCase(mockOrderRepository);
      const result = await useCase.execute('ext-de-outro-cliente', /* requesterId */ 999);

      expect(result).toBeNull();
    });

    it('retorna o progresso quando o requesterId bate com o clientPFId da OS', async () => {
      mockOrderRepository.findOrderByExternalId.mockResolvedValue(ORDER_OF_CLIENT_1);

      const useCase = new GetOrderProgressByExternalIdUseCase(mockOrderRepository);
      const result = await useCase.execute('ext-de-outro-cliente', /* requesterId */ 1);

      expect(result).not.toBeNull();
      expect(result.status).toBe('AGUARDANDO_APROVACAO');
    });
  });

  describe('ApproveOrderUseCase', () => {
    it('retorna null e NÃO altera o status quando a OS pertence a outro cliente', async () => {
      mockOrderRepository.findOrderByExternalId.mockResolvedValue(ORDER_OF_CLIENT_1);

      const useCase = new ApproveOrderUseCase(mockOrderRepository);
      const result = await useCase.execute('ext-de-outro-cliente', /* requesterId */ 999);

      expect(result).toBeNull();
      expect(mockOrderRepository.updateOrder).not.toHaveBeenCalled();
    });

    it('aprova normalmente quando o requesterId bate com o clientPFId da OS', async () => {
      mockOrderRepository.findOrderByExternalId.mockResolvedValue(ORDER_OF_CLIENT_1);
      mockOrderRepository.updateOrder.mockResolvedValue({ ...ORDER_OF_CLIENT_1, status: 'EM_EXECUCAO' });

      const useCase = new ApproveOrderUseCase(mockOrderRepository);
      const result = await useCase.execute('ext-de-outro-cliente', /* requesterId */ 1);

      expect(result).not.toBeNull();
      expect(mockOrderRepository.updateOrder).toHaveBeenCalledWith(10, expect.objectContaining({ status: 'EM_EXECUCAO' }));
    });
  });
});
