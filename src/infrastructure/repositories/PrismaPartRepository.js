const prisma = require('../../prisma');
const IPartRepository = require('../interfaces/IPartRepository');

class PrismaPartRepository extends IPartRepository {
  async findPartById(id) {
    return prisma.part.findUnique({ where: { id } });
  }

  async updatePartQuantity(id, quantity) {
    return prisma.part.update({ where: { id }, data: { quantity } });
  }
}

module.exports = PrismaPartRepository;
