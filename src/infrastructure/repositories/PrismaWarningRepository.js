import { getPrisma } from '@/lib/prisma'

const prisma = getPrisma()

export class PrismaWarningRepository {
  async getAll() {
    return await prisma.warning.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}

