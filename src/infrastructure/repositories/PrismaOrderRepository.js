import { prisma } from '../../lib/prisma'

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
    // order object comes from domain/service.
    // It might have an ID (if domain generated it) or not.

    const { id, items, customerSnapshot, ...rest } = order

    // Prepare items for creation
    // We ignore the incoming item IDs (which might be temporary timestamps)
    // and let Prisma/DB generate proper UUIDs, OR we cast them to string if we really want to keep them.
    // Given the domain logic might rely on IDs for updates, but usually items are re-created or just listed.
    // Let's generate new UUIDs for items to be clean.

    const created = await prisma.order.create({
      data: {
        // If id is provided, use it. If not, Prisma defaults to UUID.
        ...(id && { id }),
        displayId: rest.displayId,
        status: rest.status,
        source: rest.source,
        totalPrice: rest.totalPrice,
        createdAt: rest.createdAt ? new Date(rest.createdAt) : undefined,
        updatedAt: rest.updatedAt ? new Date(rest.updatedAt) : undefined,

        customerName: customerSnapshot?.name,
        customerPhone: customerSnapshot?.phone,
        customerType: customerSnapshot?.type,
        customerAddress: customerSnapshot?.address,
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
    const { id, items, customerSnapshot, ...rest } = order

    // Update the main order fields
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: rest.status,
        assignedTo: rest.assignedTo,
        updatedAt: new Date(),
        // We don't typically update customer details or items after creation in this simple app,
        // but if we did, we'd need more complex logic.
        // For now, assume status updates are the main use case.
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
      isNoContact: false, // Default
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
