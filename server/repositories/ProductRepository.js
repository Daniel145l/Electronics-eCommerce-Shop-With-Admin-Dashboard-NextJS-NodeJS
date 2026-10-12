const defaultPrisma = require('../utills/db');

/**
 * Repository para a entidade Product.
 *
 * Centraliza todo o acesso a dados de produtos para que os
 * controllers não usem o Prisma diretamente.
 *
 * @example
 * const { productRepository } = require('../repositories');
 * const products = await productRepository.findMany({ where, skip, take, orderBy });
 */
class ProductRepository {
  /**
   * @param {object} prismaClient - Cliente Prisma (injetável para facilitar testes).
   */
  constructor(prismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Busca genérica com paginação/ordenação/filtros.
   * Cobre todos os usos do controller (admin, vitrine, filtros, sort).
   */
  async findMany({ where = {}, orderBy = {}, skip, take, include } = {}) {
    return this.prisma.product.findMany({
      where,
      orderBy,
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
      include: include || {
        category: { select: { name: true } },
      },
    });
  }

  async findAll(filters = {}) {
    return this.findMany({ where: filters });
  }

  async findById(id) {
    if (!id) return null;
    return this.prisma.product.findUnique({
      where: { id: String(id) },
      include: { category: true, merchant: true, images: true },
    });
  }

  /**
   * Busca simples por id, com include de categoria (uso do getProductById).
   */
  async findByIdWithCategory(id) {
    if (!id) return null;
    return this.prisma.product.findUnique({
      where: { id: String(id) },
      include: { category: true },
    });
  }

  async findBySlug(slug) {
    if (!slug) return null;
    return this.prisma.product.findUnique({
      where: { slug: String(slug) },
      include: { category: true, merchant: true, images: true },
    });
  }

  async findFirst(where) {
    return this.prisma.product.findFirst({ where });
  }

  async search(query) {
    if (!query) return [];
    return this.prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      },
    });
  }

  async create(data) {
    return this.prisma.product.create({ data });
  }

  async update(id, data) {
    return this.prisma.product.update({
      where: { id: String(id) },
      data,
    });
  }

  async delete(id) {
    return this.prisma.product.delete({ where: { id: String(id) } });
  }

  async count(filters = {}) {
    return this.prisma.product.count({ where: filters });
  }

  /**
   * Verifica itens vinculados em customer_order_product
   * (usado para bloquear delete por FK).
   */
  async findRelatedOrderItems(productId) {
    return this.prisma.customer_order_product.findMany({
      where: { productId: String(productId) },
    });
  }
}

module.exports = new ProductRepository();
module.exports.ProductRepository = ProductRepository;
