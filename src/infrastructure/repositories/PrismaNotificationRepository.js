import prisma from '../../lib/prisma'

export class PrismaNotificationRepository {
  async getAll() {
    return await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(notification) {
    return await prisma.notification.create({
      data: notification,
    })
  }
}
