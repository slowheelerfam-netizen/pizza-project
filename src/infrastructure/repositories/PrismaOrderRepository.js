import { getPrisma } from '@/lib/prisma'
import { DEMO_MODE } from '../../lib/appConfig'

const prisma = getPrisma()

export class PrismaOrderRepository {
  async getAll() {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        notifications: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return orders.map((o) => this._mapToDomain(o))
  }

  async findById(id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        notifications: true,
      },
    })

    return order ? this._mapToDomain(order) : null
  }

  async findFirst(args) {
    const result = await prisma.order.findFirst({
      ...args,
      include: {
        items: true,
        notifications: true,
      },
    })

    return result ? this._mapToDomain(result) : null
  }

  async create(order) {
    const { id, items = [], customerSnapshot, ...rest } = order
    const isDemo = DEMO_MODE === true

    const created = await prisma.order.create({
      data: {
        ...(id && { id }),
        displayId: rest.displayId,
        status: rest.status || 'NEW',
        source: isDemo ? 'DEMO' : rest.source || 'REGISTER',
        totalPrice: rest.totalPrice || 0,
        customerName: isDemo ? 'Demo Customer' : customerSnapshot?.name || null,
        customerPhone: isDemo
          ? '000-000-0000'
          : customerSnapshot?.phone || null,
        customerType: customerSnapshot?.type || 'PICKUP',
        customerAddress: isDemo ? null : customerSnapshot?.address || null,
        isWalkIn: customerSnapshot?.isWalkIn ?? false,
        isPaid: rest.isPaid ?? false,
        specialInstructions: rest.specialInstructions || null,
        items: {
          create: items.map((item) => ({
            name: item.name,
            size: item.size || null,
            crust: item.crust || null,
            price: item.price,
            quantity: item.quantity || 1,
            notes: item.notes || null,
            toppings: JSON.stringify(item.toppings || []),
          })),
        },
      },
      include: {
        items: true,
        notifications: true,
      },
    })

    return this._mapToDomain(created)
  }

  async update(order) {
    const dataToUpdate = {
      status: order.status,
      totalPrice: order.totalPrice,
      updatedAt: new Date(),
      assignedTo: order.assignedTo,
      specialInstructions: order.specialInstructions,
      customerName: order.customerSnapshot?.name,
      customerPhone: order.customerSnapshot?.phone,
      customerType: order.customerSnapshot?.type,
      customerAddress: order.customerSnapshot?.address,
      isWalkIn: order.customerSnapshot?.isWalkIn,
      isPaid: order.isPaid,
    }

    if (order.ovenEnteredAt) dataToUpdate.ovenEnteredAt = order.ovenEnteredAt
    if (order.actualReadyAt) dataToUpdate.actualReadyAt = order.actualReadyAt
    if (order.estimatedReadyAt) dataToUpdate.estimatedReadyAt = order.estimatedReadyAt

    let itemsUpdate = {}
    if (order.items && Array.isArray(order.items)) {
      itemsUpdate = {
        items: {
          deleteMany: {},
          create: order.items.map((item) => ({
            name: item.name,
            size: item.size || null,
            crust: item.crust || null,
            price: item.price,
            quantity: item.quantity || 1,
            notes: item.notes || null,
            toppings: JSON.stringify(item.toppings || []),
          })),
        },
      }
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { ...dataToUpdate, ...itemsUpdate },
      include: {
        items: true,
        notifications: true,
      },
    })

    return this._mapToDomain(updated)
  }

  async updateStatus(orderId, nextStatus) {
    const dataToUpdate = {
      status: nextStatus,
      updatedAt: new Date(),
    }

    if (nextStatus === 'OVEN') dataToUpdate.ovenEnteredAt = new Date()
    if (nextStatus === 'READY') dataToUpdate.actualReadyAt = new Date()

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: dataToUpdate,
      include: {
        items: true,
        notifications: true,
      },
    })

    return this._mapToDomain(updated)
  }

  _mapToDomain(prismaOrder) {
    return {
      id: prismaOrder.id,
      displayId: prismaOrder.displayId,
      status: prismaOrder.status,
      source: prismaOrder.source,
      totalPrice: prismaOrder.totalPrice,
      createdAt: prismaOrder.createdAt.toISOString(),
      estimatedReadyAt: prismaOrder.estimatedReadyAt
        ? prismaOrder.estimatedReadyAt.toISOString()
        : null,
      actualReadyAt: prismaOrder.actualReadyAt
        ? prismaOrder.actualReadyAt.toISOString()
        : null,
      ovenEnteredAt: prismaOrder.ovenEnteredAt
        ? prismaOrder.ovenEnteredAt.toISOString()
        : null,
      assignedTo: prismaOrder.assignedTo,
      specialInstructions: prismaOrder.specialInstructions,
      updatedAt: prismaOrder.updatedAt.toISOString(),
      isDemo: prismaOrder.source === 'DEMO',
      isPaid: prismaOrder.isPaid,
      customerSnapshot: {
        name: prismaOrder.customerName,
        phone: prismaOrder.customerPhone,
        type: prismaOrder.customerType,
        address: prismaOrder.customerAddress,
        isWalkIn: prismaOrder.isWalkIn,
      },
      items: (prismaOrder.items || []).map((item) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        crust: item.crust,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
        toppings: JSON.parse(item.toppings || '[]'),
      })),
    }
  }
}


