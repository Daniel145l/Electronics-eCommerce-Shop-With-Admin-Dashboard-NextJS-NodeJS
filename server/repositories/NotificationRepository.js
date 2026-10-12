const defaultPrisma = require('../utills/db');

/**
 * Repository para a entidade Notification.
 * Usado pelo NotificationFactory (persistência) e pelo
 * notificationController (leituras/updates/deletes).
 */
class NotificationRepository {
  /**
   * @param {object} prismaClient - Cliente Prisma (injetável para facilitar testes).
   */
  constructor(prismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  async create(data) {
    return this.prisma.notification.create({ data });
  }

  async createMany(items) {
    return this.prisma.notification.createMany({ data: items });
  }

  async findMany({ where = {}, orderBy = { createdAt: 'desc' }, skip, take } = {}) {
    return this.prisma.notification.findMany({
      where,
      orderBy,
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
    });
  }

  async findFirst(where) {
    return this.prisma.notification.findFirst({ where });
  }

  async findById(id) {
    if (!id) return null;
    return this.prisma.notification.findFirst({ where: { id: String(id) } });
  }

  async update(id, data) {
    return this.prisma.notification.update({
      where: { id: String(id) },
      data,
    });
  }

  async updateMany(where, data) {
    return this.prisma.notification.updateMany({ where, data });
  }

  async delete(id) {
    return this.prisma.notification.delete({ where: { id: String(id) } });
  }

  async deleteMany(where) {
    return this.prisma.notification.deleteMany({ where });
  }

  async count(where = {}) {
    return this.prisma.notification.count({ where });
  }
}

module.exports = new NotificationRepository();
module.exports.NotificationRepository = NotificationRepository;
