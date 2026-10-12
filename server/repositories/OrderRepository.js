const defaultPrisma = require('../utills/db');

const ORDER_FIELDS = [
  'name',
  'lastname',
  'phone',
  'email',
  'company',
  'adress',
  'apartment',
  'postalCode',
  'status',
  'city',
  'country',
  'orderNotice',
  'total',
];

/**
 * Remove chaves undefined para permitir updates parciais
 * sem sobrescrever campos com undefined.
 */
function pickDefined(data = {}) {
  const picked = {};
  for (const field of ORDER_FIELDS) {
    if (data[field] !== undefined) {
      picked[field] = data[field];
    }
  }
  return picked;
}

/**
 * Repository para a entidade Customer_order.
 *
 * @example
 * const { orderRepository } = require('../repositories');
 * const order = await orderRepository.findById(id);
 */
class OrderRepository {
  /**
   * @param {object} prismaClient - Cliente Prisma (injetável para facilitar testes).
   */
  constructor(prismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  async findAll(page = 1, limit = 50) {
    const safePage = Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number(limit) > 0 ? Math.min(Number(limit), 100) : 50;
    const offset = (safePage - 1) * safeLimit;

    const [orders, totalCount] = await Promise.all([
      this.prisma.customer_order.findMany({
        skip: offset,
        take: safeLimit,
        orderBy: { dateTime: 'desc' },
      }),
      this.prisma.customer_order.count(),
    ]);

    return {
      orders,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / safeLimit),
      },
    };
  }

  async findById(id) {
    if (!id) return null;
    return this.prisma.customer_order.findUnique({
      where: { id: String(id) },
    });
  }

  async findFirst(where) {
    return this.prisma.customer_order.findFirst({ where });
  }

  async findByEmailAndTotal(email, total, withinMinutes = 1) {
    if (!email || total === undefined || total === null) return null;
    const timeAgo = new Date(Date.now() - withinMinutes * 60 * 1000);
    return this.prisma.customer_order.findFirst({
      where: {
        email,
        total,
        dateTime: { gte: timeAgo },
      },
    });
  }

  async create(data) {
    return this.prisma.customer_order.create({
      data: {
        ...pickDefined(data),
        dateTime: data.dateTime || new Date(),
      },
    });
  }

  async update(id, data) {
    return this.prisma.customer_order.update({
      where: { id: String(id) },
      data: pickDefined(data),
    });
  }

  async delete(id) {
    return this.prisma.customer_order.delete({
      where: { id: String(id) },
    });
  }

  async count(where = {}) {
    return this.prisma.customer_order.count({ where });
  }
}

module.exports = new OrderRepository();
module.exports.OrderRepository = OrderRepository;
