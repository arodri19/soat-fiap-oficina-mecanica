class IPartRepository {
  async findPartById(id) { throw new Error('Method not implemented'); }
  async updatePartQuantity(id, quantity) { throw new Error('Method not implemented'); }
}

module.exports = IPartRepository;
