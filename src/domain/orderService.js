import { ORDER_STATUS } from '../types/models'
import { isValidTransition } from './orderState'
import { handleOrderReadiness } from './orderReadiness'
import { handleOvenEntry } from './ovenHooks'
import { logAdminAction } from './adminActionService'
import crypto from 'crypto'

export class OrderService {
  constructor(
    ordersRepository,
    warningsRepository,
    adminActionRepository,
    notificationsRepository
  ) {
    this.orders = ordersRepository
    this.warnings = warningsRepository
    this.actions = adminActionRepository
    this.notifications = notificationsRepository
  }

  async createOrder(input) {
    console.log('[OrderService.createOrder] input:', input)

    try {
      const {
        customerName,
        customerPhone,
        type,
        address,
        source,
        items,
        totalPrice,
      } = input

      const customerSnapshot = {
        customerId: null,
        name:
          customerName && customerName.trim() ? customerName.trim() : 'Walk-in',
        phone: customerPhone || null,
        type: type || 'PICKUP',
        address: address || null,
        isWalkIn: input.isWalkIn || !customerName,
      }

      const allOrders = await this.orders.getAll()
      const lastOrder =
        allOrders.length > 0
          ? allOrders.reduce((latest, current) =>
              new Date(current.createdAt) > new Date(latest.createdAt)
                ? current
                : latest
            )
          : null

      const nextDisplayId = lastOrder ? (lastOrder.displayId % 50) + 1 : 1

      const order = {
        id: crypto.randomUUID(),
        displayId: nextDisplayId,
        status: ORDER_STATUS.NEW,
        assumeChefRole: input.assumeChefRole || false,
        source,
        items,
        totalPrice,
        isPriority: !!input.isPriority,
        createdAt: input.isPriority
          ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          : new Date().toISOString(),
        updatedAt: null,
        estimatedReadyAt: null,
        actualReadyAt: null,
        completedAt: null,
        isNoContact: false,
        customerSnapshot,
      }

      await this.orders.create(order)

      console.info('[ORDER_CREATED]', order.id, order.customerSnapshot.name)

      return order
    } catch (err) {
      console.error('[ORDER_CREATE_FAILED]', err.message)
      throw err
    }
  }

  async updateStatus(orderId, newStatus, customer = null, assignedTo = null) {
    const order = await this.orders.findById(orderId)
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    if (!isValidTransition(order, newStatus)) {
      throw new Error(`Invalid transition from ${order.status} to ${newStatus}`)
    }

    order.status = newStatus
    if (assignedTo) {
      order.assignedTo = assignedTo
    }
    order.updatedAt = new Date().toISOString()

    if (newStatus === ORDER_STATUS.COMPLETED) {
      order.completedAt = new Date().toISOString()
    }

    if (newStatus === ORDER_STATUS.OVEN) {
      order.ovenEnteredAt = new Date().toISOString()
    }

    await this.orders.update(order)

    if (newStatus === ORDER_STATUS.READY) {
      await handleOrderReadiness(order, customer, this.notifications)
    }

    if (newStatus === ORDER_STATUS.OVEN) {
      await handleOvenEntry(order, this.notifications)
    }

    return order
  }

  async updateOrderDetails(orderId, updates) {
    const order = await this.orders.findById(orderId)
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    if (updates.customerSnapshot) {
      order.customerSnapshot = {
        ...order.customerSnapshot,
        ...updates.customerSnapshot,
      }
    }

    if (updates.items) order.items = updates.items
    if (updates.totalPrice) order.totalPrice = updates.totalPrice
    if (updates.createdAt) order.createdAt = updates.createdAt
    if (updates.isPriority !== undefined) order.isPriority = updates.isPriority

    order.updatedAt = new Date().toISOString()

    await this.orders.update(order)
    console.info('[ORDER_UPDATED]', order.id)
    return order
  }

  async adminOverrideStatus(
    adminId,
    orderId,
    newStatus,
    reason,
    comment,
    customer = null
  ) {
    const updatedOrder = await this.updateStatus(orderId, newStatus, customer)

    const actionLog = logAdminAction(
      adminId,
      'ORDER',
      orderId,
      'STATUS_OVERRIDE',
      `${reason}${comment ? ': ' + comment : ''}`
    )

    await this.actions.create(actionLog)

    return {
      order: updatedOrder,
      actionLog,
    }
  }
}
