import 'server-only'
import { FileOrderRepository } from '../infrastructure/repositories/FileOrderRepository'
import { FileNotificationRepository } from '../infrastructure/repositories/FileNotificationRepository'
import { FileAdminActionRepository } from '../infrastructure/repositories/FileAdminActionRepository'
import { FileWarningRepository } from '../infrastructure/repositories/FileWarningRepository'
import { FileEmployeeRepository } from '../infrastructure/repositories/FileEmployeeRepository'

import { OrderService } from '../domain/orderService'

export function createServerServices() {
  const repositories = {
    order: new FileOrderRepository(),
    notification: new FileNotificationRepository(),
    adminAction: new FileAdminActionRepository(),
    warning: new FileWarningRepository(),
    employee: new FileEmployeeRepository(),
  }

  // Ensure correct argument order matching OrderService constructor:
  // (ordersRepository, warningsRepository, adminActionRepository, notificationsRepository)
  const orderService = new OrderService(
    repositories.order,
    repositories.warning,
    repositories.adminAction,
    repositories.notification
  )

  return {
    orderService,
    repositories,
  }
}
