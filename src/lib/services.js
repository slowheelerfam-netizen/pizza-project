import { OrderService } from '../domain/orderService'
import { PrismaOrderRepository } from '../infrastructure/repositories/PrismaOrderRepository'
import { PrismaWarningRepository } from '../infrastructure/repositories/PrismaWarningRepository'
import { PrismaAdminActionRepository } from '../infrastructure/repositories/PrismaAdminActionRepository'
import { PrismaNotificationRepository } from '../infrastructure/repositories/PrismaNotificationRepository'

// Instantiate Persistence Repositories
const ordersRepository = new PrismaOrderRepository()
const warningsRepository = new PrismaWarningRepository()
const adminActionRepository = new PrismaAdminActionRepository()
const notificationsRepository = new PrismaNotificationRepository()

// Instantiate the Singleton Service with Repositories
export const orderService = new OrderService(
  ordersRepository,
  warningsRepository,
  adminActionRepository,
  notificationsRepository
)

// Export direct accessors for "Read" operations (CQRS-lite)
// These now use the async repository methods
export const getOrders = async () => await ordersRepository.getAll()
export const getWarnings = async () => await warningsRepository.getAll()
export const getActions = async () => await adminActionRepository.getAll()
