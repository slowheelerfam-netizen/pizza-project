import { PrismaClient } from '@prisma/client'
import { DEMO_MODE } from '@/lib/appConfig'

const prisma = new PrismaClient()

prisma.$use(async (params, next) => {
  if (DEMO_MODE) {
    const blockedActions = ['create', 'update', 'delete', 'upsert']
    if (blockedActions.includes(params.action)) {
      return null
    }
  }

  return next(params)
})

export default prisma
