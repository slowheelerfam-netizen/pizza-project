import { getPrisma } from '@/lib/prisma'

const prisma = getPrisma()

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

