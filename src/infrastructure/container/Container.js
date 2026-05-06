const PrismaUserRepository = require('../repositories/PrismaUserRepository');
const PrismaClientRepository = require('../repositories/PrismaClientRepository');
const AuthApplicationService = require('../../application/services/AuthApplicationService');
const ClientApplicationService = require('../../application/services/ClientApplicationService');

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
      const userRepository = this.getUserRepository();
      this.instances.set('authApplicationService', new AuthApplicationService(userRepository));
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
      const clientRepository = this.getClientRepository();
      this.instances.set('clientApplicationService', new ClientApplicationService(clientRepository));
    }
    return this.instances.get('clientApplicationService');
  }
}

const container = new Container();

module.exports = container;