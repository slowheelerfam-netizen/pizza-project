import 'server-only'

import { FileOrderRepository } from '../infrastructure/repositories/FileOrderRepository'
import { FileNotificationRepository } from '../infrastructure/repositories/FileNotificationRepository'
import { FileAdminActionRepository } from '../infrastructure/repositories/FileAdminActionRepository'
import { FileWarningRepository } from '../infrastructure/repositories/FileWarningRepository'
import { FileEmployeeRepository } from '../infrastructure/repositories/FileEmployeeRepository'
import { MemoryOrderRepository } from '../infrastructure/repositories/MemoryOrderRepository'
import { MemoryWarningRepository } from '../infrastructure/repositories/MemoryWarningRepository'
import { MemoryEmployeeRepository } from '../infrastructure/repositories/MemoryEmployeeRepository'
import { DEMO_MODE } from './demoMode'

export function createRepositories() {
  if (DEMO_MODE) {
    return {
      order: new MemoryOrderRepository(),
      notification: null, // optional: add MemoryNotificationRepository if needed
      adminAction: null, // optional: add MemoryAdminActionRepository if needed
      warning: new MemoryWarningRepository(),
      employee: new MemoryEmployeeRepository(),
    }
  }

  return {
    order: new FileOrderRepository(),
    notification: new FileNotificationRepository(),
    adminAction: new FileAdminActionRepository(),
    warning: new FileWarningRepository(),
    employee: new FileEmployeeRepository(),
  }
}


