const PrismaUserRepository = require('../repositories/PrismaUserRepository');
const PrismaClientRepository = require('../repositories/PrismaClientRepository');
const PrismaOrderRepository = require('../repositories/PrismaOrderRepository');
const PrismaPartRepository = require('../repositories/PrismaPartRepository');
const AuthApplicationService = require('../../application/services/AuthApplicationService');
const ClientApplicationService = require('../../application/services/ClientApplicationService');
const OrderApplicationService = require('../../application/services/OrderApplicationService');

class Container {
  constructor() {
    this.instances = new Map();
  }

  getUserRepository() {
    if (!this.instances.has('userRepository')) {
      this.instances.set('userRepository', new PrismaUserRepository());
    }
    return this.instances.get('userRepository');
  }

  getAuthApplicationService() {
    if (!this.instances.has('authApplicationService')) {
      this.instances.set('authApplicationService', new AuthApplicationService(this.getUserRepository()));
    }
    return this.instances.get('authApplicationService');
  }

  getClientRepository() {
    if (!this.instances.has('clientRepository')) {
      this.instances.set('clientRepository', new PrismaClientRepository());
    }
    return this.instances.get('clientRepository');
  }

  getClientApplicationService() {
    if (!this.instances.has('clientApplicationService')) {
      this.instances.set('clientApplicationService', new ClientApplicationService(this.getClientRepository()));
    }
    return this.instances.get('clientApplicationService');
  }

  getOrderRepository() {
    if (!this.instances.has('orderRepository')) {
      this.instances.set('orderRepository', new PrismaOrderRepository());
    }
    return this.instances.get('orderRepository');
  }

  getPartRepository() {
    if (!this.instances.has('partRepository')) {
      this.instances.set('partRepository', new PrismaPartRepository());
    }
    return this.instances.get('partRepository');
  }

  getOrderApplicationService() {
    if (!this.instances.has('orderApplicationService')) {
      this.instances.set(
        'orderApplicationService',
        new OrderApplicationService(this.getOrderRepository(), this.getPartRepository())
      );
    }
    return this.instances.get('orderApplicationService');
  }
}

const container = new Container();

module.exports = container;