// Compatibility shim — budget.service imports this module.
// The order domain uses PrismaOrderRepository via the DI container.
const PrismaOrderRepository = require('../infrastructure/repositories/PrismaOrderRepository');

module.exports = new PrismaOrderRepository();
