import 'server-only'

import { FileOrderRepository } from '../infrastructure/repositories/FileOrderRepository'
import { FileNotificationRepository } from '../infrastructure/repositories/FileNotificationRepository'
import { FileAdminActionRepository } from '../infrastructure/repositories/FileAdminActionRepository'
import { FileWarningRepository } from '../infrastructure/repositories/FileWarningRepository'
import { FileEmployeeRepository } from '../infrastructure/repositories/FileEmployeeRepository'

export function createRepositories() {
  return {
    order: new FileOrderRepository(),
    notification: new FileNotificationRepository(),
    adminAction: new FileAdminActionRepository(),
    warning: new FileWarningRepository(),
    employee: new FileEmployeeRepository(),
  }
}

