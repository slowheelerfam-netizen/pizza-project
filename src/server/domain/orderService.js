import { ORDER_STATUS } from '@/types/models'
import { isValidTransition } from '@/domain/orderState'
import { handleOrderReadiness } from '@/domain/orderReadiness'
import { handleOvenEntry } from '@/domain/ovenHooks'
import { logAdminAction } from '@/domain/adminActionService'
import crypto from 'crypto'
import { getPrisma } from '@/server/services/prismaClient'

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
    this.prisma = getPrisma()
  }

  async createOrder(input) {
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
      source: source || 'REGISTER',
      items,
      totalPrice,
      isPaid: !!input.isPaid,
      isPriority: !!input.isPriority,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      estimatedReadyAt: null,
      actualReadyAt: null,
      customerSnapshot,
      assignedTo: null,
    }

    if (this.prisma) {
      // Optional: persist to DB if DATABASE_URL exists
    }

    const created = await this.orders.create(order)
    return created
  }

  async updateStatus(orderId, newStatus, assignedTo = null) {
    const order = await this.orders.findById(orderId)
    if (!order) throw new Error(`Order ${orderId} not found`)

    if (order.status === newStatus) {
      if (assignedTo !== null) {
        order.assignedTo = assignedTo
        order.updatedAt = new Date().toISOString()
        await this.orders.update(order)
      }
      return order
    }

    if (!isValidTransition(order.status, newStatus)) {
      throw new Error(`Invalid transition from ${order.status} to ${newStatus}`)
    }

    order.status = newStatus
    if (assignedTo !== null) order.assignedTo = assignedTo
    order.updatedAt = new Date().toISOString()

    if (newStatus === ORDER_STATUS.OVEN) {
      order.ovenEnteredAt = new Date().toISOString()
    }

    if (newStatus === ORDER_STATUS.READY) {
      order.actualReadyAt = new Date().toISOString()
    }

    await this.orders.update(order)

    if (newStatus === ORDER_STATUS.OVEN) {
      await handleOvenEntry(order, this.notifications)
    }

    if (newStatus === ORDER_STATUS.READY) {
      await handleOrderReadiness(order, null, this.notifications)
    }

    return order
  }

  async updateOrderDetails(orderId, updates) {
    const order = await this.orders.findById(orderId)
    if (!order) throw new Error(`Order ${orderId} not found`)

    if (updates.customerSnapshot) {
      order.customerSnapshot = {
        ...order.customerSnapshot,
        ...updates.customerSnapshot,
      }
    }

    if (updates.items) order.items = updates.items
    if (updates.totalPrice !== undefined) order.totalPrice = updates.totalPrice
    if (updates.createdAt) order.createdAt = updates.createdAt
    if (updates.isPriority !== undefined) order.isPriority = updates.isPriority
    if (updates.isPaid !== undefined) order.isPaid = updates.isPaid
    if (updates.assignedTo !== undefined) order.assignedTo = updates.assignedTo

    order.updatedAt = new Date().toISOString()
    await this.orders.update(order)

    return order
  }

  async adminOverrideStatus(
    adminId,
    orderId,
    newStatus,
    reason,
    comment,
    assignedTo = null
  ) {
    const updatedOrder = await this.updateStatus(orderId, newStatus, assignedTo)

    const actionLog = logAdminAction(
      adminId,
      'ORDER',
      orderId,
      'STATUS_OVERRIDE',
      `${reason}${comment ? ': ' + comment : ''}`
    )

    await this.actions.create(actionLog)

    return { order: updatedOrder, actionLog }
  }
}


