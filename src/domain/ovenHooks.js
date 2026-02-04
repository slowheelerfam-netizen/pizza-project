import { ORDER_STATUS } from '../types/models'
import crypto from 'crypto'

/**
 * Handles side effects when an order enters the OVEN state.
 * Triggers exactly once:
 * 1. Customer notification: "Your pizza will be ready in approximately 10 minutes."
 * 2. Label printing (Simulated log)
 *
 * @param {Object} order - The order object.
 * @param {Object} notificationRepo - The repository to store notifications.
 */
export async function handleOvenEntry(order, notificationRepo) {
  if (order.status !== ORDER_STATUS.OVEN) {
    return null
  }

  const phone = order.customerSnapshot?.phone
  const name = order.customerSnapshot?.name

  if (!phone) {
    console.warn(
      `[OVEN_HOOK] Order ${order.id} has no phone number. Skipping notification.`
    )
    return null
  }

  // 1. Customer Notification
  const notification = {
    id: crypto.randomUUID(),
    orderId: order.id,
    customerName: name,
    phone: phone,
    type: 'SMS',
    status: 'SENT',
    message: `Hello ${name}, your pizza will be ready in approximately 10 minutes.`,
    sentAt: new Date().toISOString(),
  }

  // 2. Label Printing
  // Moved to UI/Client-side (ChefDisplay) per Chunk 7 rules ("UI owns and controls print formatting").
  // The server no longer prints; it only records the timestamp.
  
  try {
    if (notificationRepo?.create) {
      await notificationRepo.create(notification)
      console.info(`[OVEN_HOOK] Notification sent to ${phone} for Order ${order.id}`)
    }
    return notification
  } catch (error) {
    console.error(
      `[OVEN_HOOK] Failed to create notification for Order ${order.id}:`,
      error
    )
    return null
  }
}
