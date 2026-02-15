import { DEMO_MODE } from './appConfig'
import { MemoryOrderRepository } from '../infrastructure/repositories/MemoryOrderRepository'
import { MemoryEmployeeRepository } from '../infrastructure/repositories/MemoryEmployeeRepository'
import { MemoryWarningRepository } from '../infrastructure/repositories/MemoryWarningRepository'
import { MemoryAdminActionRepository } from '../infrastructure/repositories/MemoryAdminActionRepository'
import { MemoryNotificationRepository } from '../infrastructure/repositories/MemoryNotificationRepository'
import { FileOrderRepository } from '../infrastructure/repositories/FileOrderRepository'
import { FileEmployeeRepository } from '../infrastructure/repositories/FileEmployeeRepository'
import { FileWarningRepository } from '../infrastructure/repositories/FileWarningRepository'
import { FileAdminActionRepository } from '../infrastructure/repositories/FileAdminActionRepository'
import { FileNotificationRepository } from '../infrastructure/repositories/FileNotificationRepository'

export function createRepositories() {
  if (DEMO_MODE) {
    // Use in-memory repositories for server-side demo mode
    return {
      order: new MemoryOrderRepository(),
      employee: new MemoryEmployeeRepository(),
      warning: new MemoryWarningRepository(),
      adminAction: new MemoryAdminActionRepository(),
      notification: new MemoryNotificationRepository(),
    }
  }

  // Default to file-based repositories
  return {
    order: new FileOrderRepository(),
    employee: new FileEmployeeRepository(),
    warning: new FileWarningRepository(),
    adminAction: new FileAdminActionRepository(),
    notification: new FileNotificationRepository(),
  }
}



