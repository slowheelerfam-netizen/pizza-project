import 'server-only'

import { FileOrderRepository } from '../infrastructure/repositories/FileOrderRepository'
import { MemoryOrderRepository } from '../infrastructure/repositories/MemoryOrderRepository'
import { PrismaOrderRepository } from '../infrastructure/repositories/PrismaOrderRepository'
import { FileNotificationRepository } from '../infrastructure/repositories/FileNotificationRepository'
import { FileAdminActionRepository } from '../infrastructure/repositories/FileAdminActionRepository'
import { FileWarningRepository } from '../infrastructure/repositories/FileWarningRepository'
import { FileEmployeeRepository } from '../infrastructure/repositories/FileEmployeeRepository'
import { KvOrderRepository } from '../infrastructure/repositories/KvOrderRepository'
import { isDemoMode } from './isDemoMode'

export function createRepositories() {
  const demo = isDemoMode()
  const isVercel = process.env.VERCEL === '1'

  let orderRepository
  if (demo && isVercel) {
    orderRepository = new KvOrderRepository()
  } else if (demo) {
    orderRepository = new MemoryOrderRepository()
  } else {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL environment variable is required in production mode'
      )
    }
    orderRepository = new PrismaOrderRepository()
  }

  return {
    order: orderRepository,
    notification: new FileNotificationRepository(),
    adminAction: new FileAdminActionRepository(),
    warning: new FileWarningRepository(),
    employee: new FileEmployeeRepository(),
  }
}






