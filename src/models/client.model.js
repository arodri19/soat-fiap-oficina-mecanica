const { validateString, validateEmail } = require('../utils/validation');

function buildClientPFData(body) {
  return {
    name: validateString(body.name, 'name'),
    cpf: validateString(body.cpf, 'cpf'),
    email: validateEmail(body.email, 'email'),
    address: validateString(body.address, 'address'),
    number: validateString(body.number, 'number'),
    state: validateString(body.state, 'state'),
    cep: validateString(body.cep, 'cep')
  };
}

function buildClientPFUpdateData(body) {
  const data = {};
  if (body.name !== undefined) data.name = validateString(body.name, 'name', { required: false });
  if (body.cpf !== undefined) data.cpf = validateString(body.cpf, 'cpf', { required: false });
  if (body.email !== undefined) data.email = validateEmail(body.email, 'email');
  if (body.address !== undefined) data.address = validateString(body.address, 'address', { required: false });
  if (body.number !== undefined) data.number = validateString(body.number, 'number', { required: false });
  if (body.state !== undefined) data.state = validateString(body.state, 'state', { required: false });
  if (body.cep !== undefined) data.cep = validateString(body.cep, 'cep', { required: false });
  return data;
}

function buildClientPJData(body) {
  return {
    name: validateString(body.name, 'name'),
    fantasyName: validateString(body.fantasyName, 'fantasyName'),
    companyName: validateString(body.companyName, 'companyName'),
    cnpj: validateString(body.cnpj, 'cnpj'),
    email: validateEmail(body.email, 'email'),
    address: validateString(body.address, 'address'),
    number: validateString(body.number, 'number'),
    state: validateString(body.state, 'state'),
    cep: validateString(body.cep, 'cep'),
    legalResponsible: validateString(body.legalResponsible, 'legalResponsible')
  };
}

function buildClientPJUpdateData(body) {
  const data = {};
  if (body.name !== undefined) data.name = validateString(body.name, 'name', { required: false });
  if (body.fantasyName !== undefined) data.fantasyName = validateString(body.fantasyName, 'fantasyName', { required: false });
  if (body.companyName !== undefined) data.companyName = validateString(body.companyName, 'companyName', { required: false });
  if (body.cnpj !== undefined) data.cnpj = validateString(body.cnpj, 'cnpj', { required: false });
  if (body.email !== undefined) data.email = validateEmail(body.email, 'email');
  if (body.address !== undefined) data.address = validateString(body.address, 'address', { required: false });
  if (body.number !== undefined) data.number = validateString(body.number, 'number', { required: false });
  if (body.state !== undefined) data.state = validateString(body.state, 'state', { required: false });
  if (body.cep !== undefined) data.cep = validateString(body.cep, 'cep', { required: false });
  if (body.legalResponsible !== undefined) data.legalResponsible = validateString(body.legalResponsible, 'legalResponsible', { required: false });
  return data;
}

module.exports = {
  buildClientPFData,
  buildClientPFUpdateData,
  buildClientPJData,
  buildClientPJUpdateData
};
