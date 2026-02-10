import { FileOrderRepository } from '@/infrastructure/repositories/FileOrderRepository'
import { FileWarningRepository } from '@/infrastructure/repositories/FileWarningRepository'
import { FileEmployeeRepository } from '@/infrastructure/repositories/FileEmployeeRepository'

import { OrderService } from '@/domain/orderService'

export function createServerServices() {
  const orderRepository = new FileOrderRepository()
  const warningRepository = new FileWarningRepository()
  const employeeRepository = new FileEmployeeRepository()

  const orderService = new OrderService({
    orderRepository,
    warningRepository,
    employeeRepository,
  })

  return {
    orderService,
    orderRepository,
    warningRepository,
    employeeRepository,
  }
}
