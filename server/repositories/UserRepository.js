const defaultPrisma = require('../utills/db');

/**
 * Repository mínimo para User.
 * Evita Prisma direto espalhado nos controllers de pedidos/notificações.
 */
class UserRepository {
  /**
   * @param {object} prismaClient - Cliente Prisma (injetável para facilitar testes).
   */
  constructor(prismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  async findById(id) {
    if (!id) return null;
    return this.prisma.user.findUnique({ where: { id: String(id) } });
  }

  async findByEmail(email) {
    if (!email) return null;
    return this.prisma.user.findUnique({ where: { email: String(email) } });
  }
}

module.exports = new UserRepository();
module.exports.UserRepository = UserRepository;
