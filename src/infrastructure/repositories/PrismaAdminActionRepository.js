import { getPrisma } from '@/lib/prisma'

const prisma = getPrisma()

export class PrismaAdminActionRepository {
  async getAll() {
    return await prisma.adminAction.findMany({
      orderBy: {
        performedAt: 'desc',
      },
    })
  }
}


