const {
  ORDER_STATUSES,
  VALID_TRANSITIONS,
  buildOrderStatusUpdate,
  validateOrderStatus,
  buildOrderProgress,
  validateServiceToOrder,
  validatePartToOrder
} = require('../../../src/models/order.model');
const { ValidationError } = require('../../../src/utils/validation');

describe('ORDER_STATUSES e VALID_TRANSITIONS', () => {
  it('contém os 6 status esperados na ordem correta', () => {
    expect(ORDER_STATUSES).toEqual([
      'RECEBIDA',
      'EM_DIAGNOSTICO',
      'AGUARDANDO_APROVACAO',
      'EM_EXECUCAO',
      'FINALIZADA',
      'ENTREGUE'
    ]);
  });

  it('VALID_TRANSITIONS define sequência linear', () => {
    expect(VALID_TRANSITIONS.RECEBIDA).toEqual(['EM_DIAGNOSTICO']);
    expect(VALID_TRANSITIONS.EM_DIAGNOSTICO).toEqual(['AGUARDANDO_APROVACAO']);
    expect(VALID_TRANSITIONS.AGUARDANDO_APROVACAO).toEqual(['EM_EXECUCAO']);
    expect(VALID_TRANSITIONS.EM_EXECUCAO).toEqual(['FINALIZADA']);
    expect(VALID_TRANSITIONS.FINALIZADA).toEqual(['ENTREGUE']);
    expect(VALID_TRANSITIONS.ENTREGUE).toEqual([]);
  });
});

describe('validateOrderStatus', () => {
  it('retorna true para todos os status válidos', () => {
    ORDER_STATUSES.forEach((s) => expect(validateOrderStatus(s)).toBe(true));
  });

  it('retorna false para status inválido', () => {
    expect(validateOrderStatus('INVALIDO')).toBe(false);
    expect(validateOrderStatus('')).toBe(false);
    expect(validateOrderStatus(undefined)).toBe(false);
  });
});

describe('buildOrderStatusUpdate', () => {
  describe('transições válidas', () => {
    const cases = [
      { from: 'RECEBIDA', to: 'EM_DIAGNOSTICO' },
      { from: 'EM_DIAGNOSTICO', to: 'AGUARDANDO_APROVACAO' },
      { from: 'AGUARDANDO_APROVACAO', to: 'EM_EXECUCAO' },
      { from: 'EM_EXECUCAO', to: 'FINALIZADA' },
      { from: 'FINALIZADA', to: 'ENTREGUE' }
    ];

    cases.forEach(({ from, to }) => {
      it(`${from} → ${to} não lança erro`, () => {
        const order = { status: from, startAt: new Date(), endAt: null };
        expect(() => buildOrderStatusUpdate(to, order)).not.toThrow();
      });
    });
  });

  describe('transições inválidas', () => {
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
        const order = { status: from, startAt: null, endAt: null };
        expect(() => buildOrderStatusUpdate(to, order)).toThrow(ValidationError);
      });
    });

    it('lança ValidationError para status fora do enum', () => {
      const order = { status: 'RECEBIDA', startAt: null };
      expect(() => buildOrderStatusUpdate('INVALIDO', order)).toThrow(ValidationError);
    });
  });

  describe('efeitos colaterais de data', () => {
    it('define startAt quando EM_EXECUCAO e startAt ausente', () => {
      const order = { status: 'AGUARDANDO_APROVACAO', startAt: null };
      const data = buildOrderStatusUpdate('EM_EXECUCAO', order);
      expect(data.startAt).toBeInstanceOf(Date);
    });

    it('não redefine startAt quando já existe em EM_EXECUCAO', () => {
      const existing = new Date('2024-01-01');
      const order = { status: 'AGUARDANDO_APROVACAO', startAt: existing };
      const data = buildOrderStatusUpdate('EM_EXECUCAO', order);
      expect(data.startAt).toBeUndefined();
    });

    it('define endAt ao finalizar', () => {
      const order = { status: 'EM_EXECUCAO', startAt: new Date(), endAt: null };
      const data = buildOrderStatusUpdate('FINALIZADA', order);
      expect(data.endAt).toBeInstanceOf(Date);
    });

    it('define endAt ao entregar quando ausente', () => {
      const order = { status: 'FINALIZADA', startAt: new Date(), endAt: null };
      const data = buildOrderStatusUpdate('ENTREGUE', order);
      expect(data.endAt).toBeInstanceOf(Date);
    });

    it('não redefine endAt ao entregar quando já existe', () => {
      const existing = new Date('2024-01-10');
      const order = { status: 'FINALIZADA', startAt: new Date(), endAt: existing };
      const data = buildOrderStatusUpdate('ENTREGUE', order);
      expect(data.endAt).toBeUndefined();
    });
  });
});

describe('buildOrderProgress', () => {
  it('retorna status, mechanicDescription e mechanicName', () => {
    const order = { status: 'EM_EXECUCAO', description: 'Revisão completa', mechanicName: 'Roberto' };
    expect(buildOrderProgress(order)).toEqual({
      status: 'EM_EXECUCAO',
      mechanicDescription: 'Revisão completa',
      mechanicName: 'Roberto'
    });
  });

  it('inclui mechanicName nulo quando não definido', () => {
    const order = { status: 'RECEBIDA', description: 'Diagnóstico', mechanicName: null };
    const result = buildOrderProgress(order);
    expect(result.mechanicName).toBeNull();
  });
});

describe('validateServiceToOrder', () => {
  it('retorna serviceId válido', () => {
    expect(validateServiceToOrder({ serviceId: 5 })).toEqual({ serviceId: 5 });
  });

  it('lança ValidationError se serviceId ausente', () => {
    expect(() => validateServiceToOrder({})).toThrow(ValidationError);
  });

  it('lança ValidationError se serviceId não for inteiro', () => {
    expect(() => validateServiceToOrder({ serviceId: 1.5 })).toThrow(ValidationError);
  });
});

describe('validatePartToOrder', () => {
  it('retorna partId e quantity válidos', () => {
    expect(validatePartToOrder({ partId: 3, quantity: 2 })).toEqual({ partId: 3, quantity: 2 });
  });

  it('usa quantity 1 como padrão', () => {
    expect(validatePartToOrder({ partId: 3 })).toEqual({ partId: 3, quantity: 1 });
  });

  it('lança ValidationError se partId ausente', () => {
    expect(() => validatePartToOrder({})).toThrow(ValidationError);
  });

  it('lança ValidationError se quantity < 1', () => {
    expect(() => validatePartToOrder({ partId: 1, quantity: 0 })).toThrow(ValidationError);
  });

  it('lança ValidationError se quantity não for inteiro', () => {
    expect(() => validatePartToOrder({ partId: 1, quantity: 1.5 })).toThrow(ValidationError);
  });
});
