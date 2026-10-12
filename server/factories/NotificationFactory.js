const { randomUUID } = require('crypto');
const notificationRepository = require('../repositories/NotificationRepository');

const VALID_TYPES = ['ORDER_UPDATE', 'PAYMENT_STATUS', 'PROMOTION', 'SYSTEM_ALERT'];
const VALID_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const ORDER_STATUS_MESSAGES = {
  pending: {
    title: 'Order Received',
    message: (orderId) => `Thank you! Your order #${orderId} has been received and is being processed.`,
    priority: 'NORMAL',
  },
  confirmed: {
    title: 'Order Confirmed',
    message: (orderId) => `Great news! Your order #${orderId} has been confirmed and will be prepared for shipping.`,
    priority: 'HIGH',
  },
  processing: {
    title: 'Order Processing',
    message: (orderId) => `Your order #${orderId} is currently being processed and will ship soon.`,
    priority: 'NORMAL',
  },
  shipped: {
    title: 'Order Shipped',
    message: (orderId) => `Excellent! Your order #${orderId} has been shipped and is on its way to you.`,
    priority: 'HIGH',
  },
  delivered: {
    title: 'Order Delivered',
    message: (orderId) => `Your order #${orderId} has been successfully delivered. We hope you love your new items!`,
    priority: 'HIGH',
  },
  cancelled: {
    title: 'Order Cancelled',
    message: (orderId) => `Your order #${orderId} has been cancelled. If you have any questions, please contact our support.`,
    priority: 'URGENT',
  },
};

const PAYMENT_STATUS_MESSAGES = {
  success: {
    title: 'Payment Successful',
    message: (amount, orderId) => `Your payment of $${amount} has been successfully processed for order #${orderId}.`,
    priority: 'HIGH',
  },
  failed: {
    title: 'Payment Failed',
    message: (amount, orderId) => `Unfortunately, your payment of $${amount} for order #${orderId} could not be processed. Please try again.`,
    priority: 'URGENT',
  },
  pending: {
    title: 'Payment Pending',
    message: (amount, orderId) => `Your payment of $${amount} for order #${orderId} is currently being processed.`,
    priority: 'NORMAL',
  },
};

function assertRequired(value, name) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${name} is required`);
  }
}

/**
 * Factory centralizada de notificações.
 *
 * - Métodos `build*` apenas MONTAM o objeto (puros, sem I/O, fáceis de testar).
 * - Métodos `create*` montam + PERSISTEM via NotificationRepository.
 * - `create(type, payload)` é o ponto único de entrada genérico.
 *
 * O Prisma nunca é acessado aqui diretamente.
 */
class NotificationFactory {
  static _repository = notificationRepository;

  /** Permite injetar um repositório fake nos testes. */
  static setRepository(repository) {
    this._repository = repository;
  }

  // ---------- builders (puros) ----------

  static buildOrderUpdate(userId, orderStatus, orderId, totalAmount = null) {
    assertRequired(userId, 'userId');
    assertRequired(orderStatus, 'orderStatus');
    assertRequired(orderId, 'orderId');

    const key = String(orderStatus).toLowerCase();
    const template = ORDER_STATUS_MESSAGES[key];

    return {
      id: randomUUID(),
      userId: String(userId),
      title: template ? template.title : 'Order Update',
      message: template
        ? template.message(orderId)
        : `Your order #${orderId} status has been updated to: ${orderStatus}`,
      type: 'ORDER_UPDATE',
      priority: template ? template.priority : 'NORMAL',
      isRead: false,
      metadata: {
        orderId: String(orderId),
        status: orderStatus,
        ...(totalAmount !== null && totalAmount !== undefined && { totalAmount }),
      },
    };
  }

  static buildPaymentStatus(userId, paymentStatus, amount, orderId) {
    assertRequired(userId, 'userId');
    assertRequired(paymentStatus, 'paymentStatus');
    assertRequired(orderId, 'orderId');

    const key = String(paymentStatus).toLowerCase();
    const template = PAYMENT_STATUS_MESSAGES[key];

    return {
      id: randomUUID(),
      userId: String(userId),
      title: template ? template.title : 'Payment Update',
      message: template
        ? template.message(amount, orderId)
        : `Your payment status for order #${orderId} has been updated.`,
      type: 'PAYMENT_STATUS',
      priority: template ? template.priority : 'NORMAL',
      isRead: false,
      metadata: {
        orderId: String(orderId),
        paymentStatus,
        amount,
      },
    };
  }

  static buildPromotion(userId, title, message, promoCode = null, discount = null) {
    assertRequired(userId, 'userId');
    assertRequired(title, 'title');
    assertRequired(message, 'message');

    return {
      id: randomUUID(),
      userId: String(userId),
      title,
      message,
      type: 'PROMOTION',
      priority: 'NORMAL',
      isRead: false,
      metadata: {
        ...(promoCode && { promoCode }),
        ...(discount !== null && discount !== undefined && { discount }),
      },
    };
  }

  static buildSystemAlert(userId, title, message, priority = 'HIGH') {
    assertRequired(userId, 'userId');
    assertRequired(title, 'title');
    assertRequired(message, 'message');

    if (!VALID_PRIORITIES.includes(priority)) {
      throw new Error(`Invalid priority: ${priority}`);
    }

    return {
      id: randomUUID(),
      userId: String(userId),
      title,
      message,
      type: 'SYSTEM_ALERT',
      priority,
      isRead: false,
      metadata: { alertType: 'system' },
    };
  }

  static buildBulk(userIds, title, message, type = 'SYSTEM_ALERT', priority = 'NORMAL', metadata = {}) {
    assertRequired(userIds, 'userIds');
    assertRequired(title, 'title');
    assertRequired(message, 'message');

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('userIds must be a non-empty array');
    }
    if (!VALID_TYPES.includes(type)) {
      throw new Error(`Invalid notification type: ${type}`);
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      throw new Error(`Invalid priority: ${priority}`);
    }

    return userIds.map((userId) => ({
      id: randomUUID(),
      userId: String(userId),
      title,
      message,
      type,
      priority,
      isRead: false,
      metadata: metadata || {},
    }));
  }

  // ---------- persistência ----------

  static async create(type, payload = {}) {
    switch (type) {
      case 'ORDER_UPDATE':
        return this.createOrderUpdate(
          payload.userId,
          payload.orderStatus,
          payload.orderId,
          payload.totalAmount
        );
      case 'PAYMENT_STATUS':
        return this.createPaymentStatus(
          payload.userId,
          payload.paymentStatus,
          payload.amount,
          payload.orderId
        );
      case 'PROMOTION':
        return this.createPromotion(
          payload.userId,
          payload.title,
          payload.message,
          payload.promoCode,
          payload.discount
        );
      case 'SYSTEM_ALERT':
        return this.createSystemAlert(
          payload.userId,
          payload.title,
          payload.message,
          payload.priority
        );
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }

  static async createOrderUpdate(userId, orderStatus, orderId, totalAmount = null) {
    const data = this.buildOrderUpdate(userId, orderStatus, orderId, totalAmount);
    const notification = await this._repository.create(data);
    console.log(`Notification created for user ${userId}: ${notification.title}`);
    return notification;
  }

  static async createPaymentStatus(userId, paymentStatus, amount, orderId) {
    const data = this.buildPaymentStatus(userId, paymentStatus, amount, orderId);
    const notification = await this._repository.create(data);
    console.log(`Payment notification created for user ${userId}: ${notification.title}`);
    return notification;
  }

  static async createPromotion(userId, title, message, promoCode = null, discount = null) {
    const data = this.buildPromotion(userId, title, message, promoCode, discount);
    const notification = await this._repository.create(data);
    console.log(`Promotion notification created for user ${userId}: ${title}`);
    return notification;
  }

  static async createSystemAlert(userId, title, message, priority = 'HIGH') {
    const data = this.buildSystemAlert(userId, title, message, priority);
    const notification = await this._repository.create(data);
    console.log(`System alert notification created for user ${userId}: ${title}`);
    return notification;
  }

  static async createBulk(userIds, title, message, type = 'SYSTEM_ALERT', priority = 'NORMAL', metadata = {}) {
    const items = this.buildBulk(userIds, title, message, type, priority, metadata);
    await this._repository.createMany(items);
    console.log(`Bulk notifications created for ${userIds.length} users: ${title}`);
    return items.length;
  }
}

module.exports = NotificationFactory;
