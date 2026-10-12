const { NotificationFactory } = require('../factories');

/**
 * Helpers de notificação (compatibilidade).
 *
 * Toda a lógica de montagem + persistência vive no NotificationFactory.
 * Este módulo mantém a API antiga apenas como wrapper fino.
 */

const createOrderUpdateNotification = async (userId, orderStatus, orderId, totalAmount = null) => {
  try {
    return await NotificationFactory.createOrderUpdate(userId, orderStatus, orderId, totalAmount);
  } catch (error) {
    console.error('❌ Error creating order notification:', error);
    throw error;
  }
};

const createPaymentNotification = async (userId, paymentStatus, amount, orderId) => {
  try {
    return await NotificationFactory.createPaymentStatus(userId, paymentStatus, amount, orderId);
  } catch (error) {
    console.error('❌ Error creating payment notification:', error);
    throw error;
  }
};

const createPromotionNotification = async (userId, title, message, promoCode = null, discount = null) => {
  try {
    return await NotificationFactory.createPromotion(userId, title, message, promoCode, discount);
  } catch (error) {
    console.error('❌ Error creating promotion notification:', error);
    throw error;
  }
};

const createSystemAlertNotification = async (userId, title, message, priority = 'HIGH') => {
  try {
    return await NotificationFactory.createSystemAlert(userId, title, message, priority);
  } catch (error) {
    console.error('❌ Error creating system alert notification:', error);
    throw error;
  }
};

const createBulkNotifications = async (userIds, title, message, type = 'SYSTEM_ALERT', priority = 'NORMAL', metadata = {}) => {
  try {
    return await NotificationFactory.createBulk(userIds, title, message, type, priority, metadata);
  } catch (error) {
    console.error('❌ Error creating bulk notifications:', error);
    throw error;
  }
};

module.exports = {
  createOrderUpdateNotification,
  createPaymentNotification,
  createPromotionNotification,
  createSystemAlertNotification,
  createBulkNotifications,
};
