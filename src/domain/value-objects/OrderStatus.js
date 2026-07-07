const { ValidationError } = require('../../utils/validation');

const STATUSES = Object.freeze([
  'RECEBIDA',
  'EM_DIAGNOSTICO',
  'AGUARDANDO_APROVACAO',
  'EM_EXECUCAO',
  'FINALIZADA',
  'ENTREGUE'
]);

const VALID_TRANSITIONS = Object.freeze({
  RECEBIDA: ['EM_DIAGNOSTICO'],
  EM_DIAGNOSTICO: ['AGUARDANDO_APROVACAO'],
  AGUARDANDO_APROVACAO: ['EM_EXECUCAO'],
  EM_EXECUCAO: ['FINALIZADA'],
  FINALIZADA: ['ENTREGUE'],
  ENTREGUE: []
});

class OrderStatus {
  constructor(value) {
    if (!STATUSES.includes(value)) {
      throw new ValidationError(`Status inválido: ${value}. Permitidos: ${STATUSES.join(', ')}.`);
    }
    this.value = value;
  }

  static create(value) {
    return new OrderStatus(value);
  }

  static get STATUSES() {
    return STATUSES;
  }

  static get VALID_TRANSITIONS() {
    return VALID_TRANSITIONS;
  }

  canTransitionTo(next) {
    return (VALID_TRANSITIONS[this.value] || []).includes(next);
  }

  transitionTo(next) {
    if (!this.canTransitionTo(next)) {
      const allowed = VALID_TRANSITIONS[this.value] || [];
      throw new ValidationError(
        `Transição inválida: ${this.value} → ${next}. Permitido: ${allowed.join(', ') || 'nenhuma'}.`
      );
    }
    return new OrderStatus(next);
  }

  isAwaitingApproval() {
    return this.value === 'AGUARDANDO_APROVACAO';
  }

  equals(other) {
    const val = other instanceof OrderStatus ? other.value : other;
    return this.value === val;
  }

  toString() {
    return this.value;
  }
}

module.exports = OrderStatus;
