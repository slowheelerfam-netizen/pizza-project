// In-memory implementation for Demo Mode
let mockOrders = []

export class MemoryOrderRepository {
  async getAll() {
    return [...mockOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  async findById(id) {
    const order = mockOrders.find((o) => o.id === id)
    return order ? { ...order } : null
  }

  async create(order) {
    const newOrder = { 
      ...order, 
      id: order.id || `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'DEMO', 
      updatedAt: new Date().toISOString() 
    }
    mockOrders.push(newOrder)
    return { ...newOrder }
  }

  async update(order) {
    const index = mockOrders.findIndex((o) => o.id === order.id)
    if (index === -1) throw new Error(`Order ${order.id} not found`)

    const existing = mockOrders[index]
    const updated = {
      ...existing,
      ...order,
      updatedAt: new Date().toISOString(),
    }
    mockOrders[index] = updated
    return { ...updated }
  }

  async updateStatus(orderId, nextStatus) {
    const index = mockOrders.findIndex((o) => o.id === orderId)
    if (index === -1) throw new Error(`Order ${orderId} not found`)

    const order = mockOrders[index]
    order.status = nextStatus
    order.updatedAt = new Date().toISOString()
    
    if (nextStatus === 'OVEN') {
      order.ovenEnteredAt = new Date().toISOString()
    }
    if (nextStatus === 'READY') {
      order.actualReadyAt = new Date().toISOString()
    }

    mockOrders[index] = order
    return { ...order }
  }
}
