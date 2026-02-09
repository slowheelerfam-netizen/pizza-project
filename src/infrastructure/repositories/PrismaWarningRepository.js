import prisma from '@/lib/prisma'

export class PrismaWarningRepository {
  async getAll() {
    return await prisma.warning.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}
