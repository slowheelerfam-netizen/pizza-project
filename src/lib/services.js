import { DEMO_MODE } from '../lib/appConfig'

import { OrderService } from '../domain/orderService'

import { FileOrderRepository } from '../infrastructure/repositories/FileOrderRepository'
import { FileWarningRepository } from '../infrastructure/repositories/FileWarningRepository'
import { FileAdminActionRepository } from '../infrastructure/repositories/FileAdminActionRepository'
import { FileNotificationRepository } from '../infrastructure/repositories/FileNotificationRepository'
import { FileEmployeeRepository } from '../infrastructure/repositories/FileEmployeeRepository'

import { PrismaOrderRepository } from '../infrastructure/repositories/PrismaOrderRepository'

// --------------------
// Repository Selection
// --------------------

const ordersRepository = DEMO_MODE
  ? new FileOrderRepository()
  : new PrismaOrderRepository()

const warningsRepository = new FileWarningRepository()
const adminActionRepository = new FileAdminActionRepository()
const notificationsRepository = new FileNotificationRepository()
export const employeeRepository = new FileEmployeeRepository()

// --------------------
// Service Wiring
// --------------------

export const orderService = new OrderService(
  ordersRepository,
  warningsRepository,
  adminActionRepository,
  notificationsRepository
)

// --------------------
// Read Accessors
// --------------------

export const getOrders = async () => await ordersRepository.getAll()
export const getWarnings = async () => await warningsRepository.getAll()
export const getActions = async () => await adminActionRepository.getAll()
export const getEmployees = async () => await employeeRepository.getAll()
