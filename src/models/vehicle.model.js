const { validateString, validateNumber } = require('../utils/validation');

function buildVehicleData(body) {
  return {
    plate: validateString(body.plate, 'plate'),
    model: validateString(body.model, 'model'),
    year: validateNumber(body.year, 'year', { required: true, integer: true }),
    color: validateString(body.color, 'color'),
    clientPFId: validateNumber(body.clientPFId, 'clientPFId', { required: true, integer: true })
  };
}

function buildVehicleUpdateData(body) {
  const data = {};
  if (body.plate !== undefined) data.plate = validateString(body.plate, 'plate', { required: false });
  if (body.model !== undefined) data.model = validateString(body.model, 'model', { required: false });
  if (body.year !== undefined) data.year = validateNumber(body.year, 'year', { required: false, integer: true });
  if (body.color !== undefined) data.color = validateString(body.color, 'color', { required: false });
  if (body.clientPFId !== undefined) data.clientPFId = validateNumber(body.clientPFId, 'clientPFId', { required: false, integer: true });
  return data;
}

module.exports = {
  buildVehicleData,
  buildVehicleUpdateData
};
