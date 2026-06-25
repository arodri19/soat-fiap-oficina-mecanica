const OrderStatus = require('../../../src/domain/value-objects/OrderStatus');
const Order = require('../../../src/domain/entities/Order');
const { OrderProgressResponseDTO, AddServiceRequestDTO, AddPartRequestDTO } = require('../../../src/application/dtos/OrderDTOs');
const { ValidationError } = require('../../../src/utils/validation');

// ─── OrderStatus ─────────────────────────────────────────────────────────────

describe('OrderStatus — STATUSES e VALID_TRANSITIONS', () => {
  it('expõe os 6 status na ordem correta', () => {
    expect(OrderStatus.STATUSES).toEqual([
      'RECEBIDA', 'EM_DIAGNOSTICO', 'AGUARDANDO_APROVACAO',
      'EM_EXECUCAO', 'FINALIZADA', 'ENTREGUE'
    ]);
  });

  it('VALID_TRANSITIONS define sequência linear', () => {
    expect(OrderStatus.VALID_TRANSITIONS.RECEBIDA).toEqual(['EM_DIAGNOSTICO']);
    expect(OrderStatus.VALID_TRANSITIONS.EM_DIAGNOSTICO).toEqual(['AGUARDANDO_APROVACAO']);
    expect(OrderStatus.VALID_TRANSITIONS.AGUARDANDO_APROVACAO).toEqual(['EM_EXECUCAO']);
    expect(OrderStatus.VALID_TRANSITIONS.EM_EXECUCAO).toEqual(['FINALIZADA']);
    expect(OrderStatus.VALID_TRANSITIONS.FINALIZADA).toEqual(['ENTREGUE']);
    expect(OrderStatus.VALID_TRANSITIONS.ENTREGUE).toEqual([]);
  });
});

describe('OrderStatus — constructor e create', () => {
  it('cria status válido', () => {
    const s = new OrderStatus('RECEBIDA');
    expect(s.value).toBe('RECEBIDA');
    expect(s.toString()).toBe('RECEBIDA');
  });

  it('lança ValidationError para status inválido', () => {
    expect(() => new OrderStatus('INVALIDO')).toThrow(ValidationError);
    expect(() => OrderStatus.create('')).toThrow(ValidationError);
  });

  it('isAwaitingApproval retorna true apenas para AGUARDANDO_APROVACAO', () => {
    expect(new OrderStatus('AGUARDANDO_APROVACAO').isAwaitingApproval()).toBe(true);
    expect(new OrderStatus('RECEBIDA').isAwaitingApproval()).toBe(false);
  });

  it('equals compara com string e com outra instância', () => {
    const s = new OrderStatus('EM_EXECUCAO');
    expect(s.equals('EM_EXECUCAO')).toBe(true);
    expect(s.equals(new OrderStatus('EM_EXECUCAO'))).toBe(true);
    expect(s.equals('RECEBIDA')).toBe(false);
  });
});

describe('OrderStatus — transições válidas', () => {
  const cases = [
    { from: 'RECEBIDA', to: 'EM_DIAGNOSTICO' },
    { from: 'EM_DIAGNOSTICO', to: 'AGUARDANDO_APROVACAO' },
    { from: 'AGUARDANDO_APROVACAO', to: 'EM_EXECUCAO' },
    { from: 'EM_EXECUCAO', to: 'FINALIZADA' },
    { from: 'FINALIZADA', to: 'ENTREGUE' }
  ];

  cases.forEach(({ from, to }) => {
    it(`${from} → ${to} retorna novo OrderStatus`, () => {
      const next = new OrderStatus(from).transitionTo(to);
      expect(next).toBeInstanceOf(OrderStatus);
      expect(next.value).toBe(to);
    });
  });
});

describe('OrderStatus — transições inválidas', () => {
  const invalid = [
    { from: 'RECEBIDA', to: 'EM_EXECUCAO' },
    { from: 'RECEBIDA', to: 'FINALIZADA' },
    { from: 'RECEBIDA', to: 'ENTREGUE' },
    { from: 'EM_DIAGNOSTICO', to: 'EM_EXECUCAO' },
    { from: 'EM_EXECUCAO', to: 'RECEBIDA' },
    { from: 'ENTREGUE', to: 'RECEBIDA' },
    { from: 'FINALIZADA', to: 'EM_EXECUCAO' }
  ];

  invalid.forEach(({ from, to }) => {
    it(`${from} → ${to} lança ValidationError`, () => {
      expect(() => new OrderStatus(from).transitionTo(to)).toThrow(ValidationError);
    });
  });

  it('ENTREGUE não aceita nenhuma transição', () => {
    expect(() => new OrderStatus('ENTREGUE').transitionTo('RECEBIDA')).toThrow(ValidationError);
  });

  it('canTransitionTo retorna false para sequência inválida', () => {
    expect(new OrderStatus('RECEBIDA').canTransitionTo('FINALIZADA')).toBe(false);
  });
});

// ─── Order entity ─────────────────────────────────────────────────────────────

describe('Order — create', () => {
  const base = { description: 'Revisão', vehicleId: 1, clientPFId: 2 };

  it('cria ordem com status RECEBIDA por padrão', () => {
    const o = Order.create(base);
    expect(o.status.toString()).toBe('RECEBIDA');
    expect(o.description).toBe('Revisão');
    expect(o.vehicleId).toBe(1);
  });

  it('aceita clientPJId no lugar de clientPFId', () => {
    const o = Order.create({ ...base, clientPFId: undefined, clientPJId: 5 });
    expect(o.clientPJId).toBe(5);
  });

  it('lança ValidationError sem description (null)', () => {
    expect(() => Order.create({ ...base, description: null })).toThrow(ValidationError);
  });

  it('lança ValidationError sem vehicleId', () => {
    expect(() => Order.create({ ...base, vehicleId: undefined })).toThrow();
  });

  it('lança ValidationError sem nenhum cliente', () => {
    expect(() => Order.create({ description: 'x', vehicleId: 1 })).toThrow(ValidationError);
  });
});

describe('Order — transitionTo', () => {
  it('define startAt ao transitar para EM_EXECUCAO sem startAt', () => {
    const o = new Order({ status: 'AGUARDANDO_APROVACAO', vehicleId: 1, startAt: null });
    o.transitionTo('EM_EXECUCAO');
    expect(o.startAt).toBeInstanceOf(Date);
    expect(o.status.toString()).toBe('EM_EXECUCAO');
  });

  it('não redefine startAt quando já existe', () => {
    const existing = new Date('2024-01-01');
    const o = new Order({ status: 'AGUARDANDO_APROVACAO', vehicleId: 1, startAt: existing });
    o.transitionTo('EM_EXECUCAO');
    expect(o.startAt).toBe(existing);
  });

  it('define endAt ao finalizar', () => {
    const o = new Order({ status: 'EM_EXECUCAO', vehicleId: 1, startAt: new Date(), endAt: null });
    o.transitionTo('FINALIZADA');
    expect(o.endAt).toBeInstanceOf(Date);
  });

  it('define endAt ao entregar quando ausente', () => {
    const o = new Order({ status: 'FINALIZADA', vehicleId: 1, startAt: new Date(), endAt: null });
    o.transitionTo('ENTREGUE');
    expect(o.endAt).toBeInstanceOf(Date);
  });

  it('não redefine endAt ao entregar quando já existe', () => {
    const existing = new Date('2024-01-10');
    const o = new Order({ status: 'FINALIZADA', vehicleId: 1, startAt: new Date(), endAt: existing });
    o.transitionTo('ENTREGUE');
    expect(o.endAt).toBe(existing);
  });

  it('lança ValidationError para transição inválida', () => {
    const o = new Order({ status: 'RECEBIDA', vehicleId: 1 });
    expect(() => o.transitionTo('ENTREGUE')).toThrow(ValidationError);
  });
});

describe('Order — approve', () => {
  it('transita de AGUARDANDO_APROVACAO para EM_EXECUCAO', () => {
    const o = new Order({ status: 'AGUARDANDO_APROVACAO', vehicleId: 1, startAt: null });
    o.approve();
    expect(o.status.toString()).toBe('EM_EXECUCAO');
    expect(o.startAt).toBeInstanceOf(Date);
  });

  it('lança quando status não permite aprovação', () => {
    const o = new Order({ status: 'RECEBIDA', vehicleId: 1 });
    expect(() => o.approve()).toThrow(ValidationError);
  });
});

describe('Order — updateBudget e toPlainObject', () => {
  it('updateBudget atualiza budgetValue', () => {
    const o = Order.create({ description: 'x', vehicleId: 1, clientPFId: 1 });
    o.updateBudget(250.5);
    expect(o.budgetValue).toBe(250.5);
  });

  it('toPlainObject inclui apenas campos não-nulos', () => {
    const o = Order.create({ description: 'x', vehicleId: 1, clientPFId: 2 });
    const plain = o.toPlainObject();
    expect(plain.description).toBe('x');
    expect(plain.vehicleId).toBe(1);
    expect(plain.clientPFId).toBe(2);
    expect(plain).not.toHaveProperty('clientPJId');
    expect(plain).not.toHaveProperty('mechanicName');
  });
});

describe('Order — fromPrisma', () => {
  it('reconstrói a entidade a partir de dados brutos', () => {
    const raw = { id: 5, externalId: 'uuid', status: 'EM_EXECUCAO', description: 'x', vehicleId: 1, startAt: new Date() };
    const o = Order.fromPrisma(raw);
    expect(o.id).toBe(5);
    expect(o.status).toBeInstanceOf(OrderStatus);
    expect(o.status.toString()).toBe('EM_EXECUCAO');
  });
});

// ─── DTOs ─────────────────────────────────────────────────────────────────────

describe('OrderProgressResponseDTO', () => {
  it('retorna status, mechanicDescription e mechanicName', () => {
    const result = OrderProgressResponseDTO.fromOrder({ status: 'EM_EXECUCAO', description: 'Revisão', mechanicName: 'Roberto' });
    expect(result).toEqual({ status: 'EM_EXECUCAO', mechanicDescription: 'Revisão', mechanicName: 'Roberto' });
  });

  it('suporta status como OrderStatus instance', () => {
    const result = OrderProgressResponseDTO.fromOrder({ status: new OrderStatus('RECEBIDA'), description: 'x', mechanicName: null });
    expect(result.status).toBe('RECEBIDA');
    expect(result.mechanicName).toBeNull();
  });
});

describe('AddServiceRequestDTO', () => {
  it('aceita serviceId válido', () => {
    const dto = new AddServiceRequestDTO({ serviceId: 5 });
    expect(dto.serviceId).toBe(5);
  });

  it('lança ValidationError se serviceId ausente', () => {
    expect(() => new AddServiceRequestDTO({})).toThrow(ValidationError);
  });

  it('lança ValidationError se serviceId não for inteiro', () => {
    expect(() => new AddServiceRequestDTO({ serviceId: 1.5 })).toThrow(ValidationError);
  });
});

describe('AddPartRequestDTO', () => {
  it('aceita partId e quantity válidos', () => {
    const dto = new AddPartRequestDTO({ orderServiceServiceId: 1, partId: 3, quantity: 2 });
    expect(dto.partId).toBe(3);
    expect(dto.quantity).toBe(2);
  });

  it('usa quantity 1 como padrão', () => {
    const dto = new AddPartRequestDTO({ orderServiceServiceId: 1, partId: 3 });
    expect(dto.quantity).toBe(1);
  });

  it('lança ValidationError se partId ausente', () => {
    expect(() => new AddPartRequestDTO({ orderServiceServiceId: 1 })).toThrow(ValidationError);
  });

  it('lança ValidationError se quantity < 1', () => {
    expect(() => new AddPartRequestDTO({ orderServiceServiceId: 1, partId: 1, quantity: 0 })).toThrow(ValidationError);
  });

  it('lança ValidationError se quantity não for inteiro', () => {
    expect(() => new AddPartRequestDTO({ orderServiceServiceId: 1, partId: 1, quantity: 1.5 })).toThrow(ValidationError);
  });
});
