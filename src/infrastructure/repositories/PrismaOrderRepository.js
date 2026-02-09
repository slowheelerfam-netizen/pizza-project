import prisma from '../../lib/prisma'
import { DEMO_MODE } from '../../lib/appConfig'

export class PrismaOrderRepository {
  async getAll() {
    const orders = await prisma.order.findMany({
      include: { items: true, notifications: true },
      orderBy: { createdAt: 'desc' },
    })
    return orders.map(this._mapToDomain)
  }

  async findById(id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, notifications: true },
    })
    return order ? this._mapToDomain(order) : null
  }

  async findFirst(args) {
    const result = await prisma.order.findFirst({
      ...args,
      include: { items: true, notifications: true },
    })
    return result ? this._mapToDomain(result) : null
  }

  async create(order) {
    const { id, items, customerSnapshot, ...rest } = order

    const isDemo = DEMO_MODE === true

    const created = await prisma.order.create({
      data: {
        ...(id && { id }),
        displayId: rest.displayId,
        status: rest.status,
        source: isDemo ? 'DEMO' : rest.source,
        totalPrice: rest.totalPrice,
        createdAt: rest.createdAt ? new Date(rest.createdAt) : undefined,
        updatedAt: rest.updatedAt ? new Date(rest.updatedAt) : undefined,

        customerName: isDemo ? 'Demo Customer' : customerSnapshot?.name,
        customerPhone: isDemo ? '000-000-0000' : customerSnapshot?.phone,
        customerType: customerSnapshot?.type,
        customerAddress: isDemo ? null : customerSnapshot?.address,
        isWalkIn: customerSnapshot?.isWalkIn || false,

        assignedTo: rest.assignedTo,

        items: {
          create: items.map((item) => ({
            name: item.name,
            size: item.size,
            crust: item.crust,
            price: item.price,
            quantity: item.quantity || 1,
            notes: item.notes,
            toppings: JSON.stringify(item.toppings || []),
          })),
        },
      },
      include: { items: true, notifications: true },
    })

    return this._mapToDomain(created)
  }

  async update(order) {
    const { id, ...rest } = order

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: rest.status,
        assignedTo: rest.assignedTo,
        updatedAt: new Date(),
      },
      include: { items: true, notifications: true },
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
      updatedAt: prismaOrder.updatedAt.toISOString(),
      isDemo: prismaOrder.source === 'DEMO',
      assignedTo: prismaOrder.assignedTo,
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

