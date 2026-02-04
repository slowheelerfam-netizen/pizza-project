import { prisma } from '../../lib/prisma'

export class PrismaNotificationRepository {
  async getAll() {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return notifications.map(this._mapToDomain)
  }

  async findByOrderId(orderId) {
    const notifications = await prisma.notification.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' }
    })
    return notifications.map(this._mapToDomain)
  }

  async create(notification) {
    const { id, ...rest } = notification
    
    const created = await prisma.notification.create({
      data: {
        ...(id && { id }),
        type: rest.type,
        message: rest.message,
        orderId: rest.orderId,
        isRead: rest.isRead || false,
        createdAt: rest.createdAt ? new Date(rest.createdAt) : undefined
      }
    })
    
    return this._mapToDomain(created)
  }

  async update(updatedNotification) {
    const { id, ...rest } = updatedNotification
    
    try {
      const updated = await prisma.notification.update({
        where: { id },
        data: {
          isRead: rest.isRead,
          // Update other fields if necessary
        }
      })
      return this._mapToDomain(updated)
    } catch (e) {
      if (e.code === 'P2025') return null
      throw e
    }
  }
  
  _mapToDomain(p) {
    return {
      id: p.id,
      type: p.type,
      message: p.message,
      orderId: p.orderId,
      isRead: p.isRead,
      createdAt: p.createdAt.toISOString()
    }
  }
}
