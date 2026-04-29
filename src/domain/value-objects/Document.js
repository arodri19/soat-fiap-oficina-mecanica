class CPF {
  constructor(value) {
    if (!this.isValid(value)) {
      throw new Error('CPF inválido');
    }
    this.value = value.replaceAll(/\D/g, '');
  }

  static create(value) {
    return new CPF(value);
  }

  isValid(cpf) {
    if (!cpf) return false;
    const cleaned = cpf.replaceAll(/\D/g, '');
    if (cleaned.length !== 11) return false;

    // Basic validation - check if all digits are the same
    if (/^(\d)\1+$/.test(cleaned)) return false;

    return true; // Simplified validation
  }

  toString() {
    return this.value;
  }

  format() {
    return this.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}

class CNPJ {
  constructor(value) {
    if (!this.isValid(value)) {
      throw new Error('CNPJ inválido');
    }
    this.value = value.replaceAll(/\D/g, '');
  }

  static create(value) {
    return new CNPJ(value);
  }

  isValid(cnpj) {
    if (!cnpj) return false;
    const cleaned = cnpj.replaceAll(/\D/g, '');
    if (cleaned.length !== 14) return false;

    // Basic validation - check if all digits are the same
    if (/^(\d)\1+$/.test(cleaned)) return false;

    return true; // Simplified validation
  }

  toString() {
    return this.value;
  }

  format() {
    return this.value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
}

module.exports = {
  CPF,
  CNPJ
};