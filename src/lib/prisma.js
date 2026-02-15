import { PrismaClient } from '@prisma/client'

let prismaInstance = null

export function getPrisma() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient()
    if (process.env.NODE_ENV !== 'production') {
      globalThis.prisma = prismaInstance
    }
  }
  return prismaInstance
}
