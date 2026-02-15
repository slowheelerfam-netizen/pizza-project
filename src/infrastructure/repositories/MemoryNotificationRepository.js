// In-memory implementation for Demo Mode
let mockNotifications = []

export class MemoryNotificationRepository {
  async create(notification) {
    mockNotifications.push(notification)
    return notification
  }

  async update(updatedNotification) {
    const index = mockNotifications.findIndex(
      (n) => n.id === updatedNotification.id
    )

    if (index === -1) return null

    mockNotifications[index] = updatedNotification
    return updatedNotification
  }

  async findByOrderId(orderId) {
    return mockNotifications.filter((n) => n.orderId === orderId)
  }

  async getAll() {
    return [...mockNotifications]
  }
}
