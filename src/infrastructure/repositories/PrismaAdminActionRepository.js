import prisma from '@/lib/prisma'

export class PrismaAdminActionRepository {
  async getAll() {
    return await prisma.adminAction.findMany({
      orderBy: {
        performedAt: 'desc',
      },
    })
  }
}

