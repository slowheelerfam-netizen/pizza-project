// Local storage keys
const KEYS = {
  ORDERS: 'pizza-system-orders',
  EMPLOYEES: 'pizza-system-employees',
  ACTIONS: 'pizza-system-actions',
}

// Check if we are in a browser environment
const isBrowser = typeof window !== 'undefined'

export const demoStorage = {
  // --- ORDERS ---
  getOrders: () => {
    if (!isBrowser) return []
    try {
      const stored = localStorage.getItem(KEYS.ORDERS)
      const parsed = stored ? JSON.parse(stored) : []
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      console.error('Failed to load orders from localStorage', e)
      return []
    }
  },

  saveOrder: (order) => {
    if (!isBrowser) return
    const orders = demoStorage.getOrders()
    // If update, replace; if new, add
    const existingIndex = orders.findIndex((o) => o.id === order.id)

    const now = new Date().toISOString()
    const completeOrder = {
      ...order,
      id: order.id || `local-${Date.now()}`,
      status: order.status || 'NEW',
      createdAt: order.createdAt || now,
      updatedAt: now,
      items: order.items || [],
      customerSnapshot: order.customerSnapshot || {},
      totalPrice: order.totalPrice || 0,
    }

    if (existingIndex >= 0) {
      orders[existingIndex] = completeOrder
    } else {
      orders.push(completeOrder)
    }

    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders))

    // Log action
    demoStorage.logAction({
      actionType: existingIndex >= 0 ? 'UPDATE_ORDER' : 'CREATE_ORDER',
      entityId: completeOrder.id,
      details: `Order ${existingIndex >= 0 ? 'updated' : 'created'} in demo mode`,
    })

    return completeOrder
  },

  updateOrderStatus: (orderId, status, assignedTo = null) => {
    if (!isBrowser) return
    const orders = demoStorage.getOrders()
    const orderIndex = orders.findIndex((o) => o.id === orderId)

    if (orderIndex >= 0) {
      orders[orderIndex].status = status
      orders[orderIndex].updatedAt = new Date().toISOString()

      if (assignedTo) {
        orders[orderIndex].assignedTo = assignedTo
      }

      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders))

      demoStorage.logAction({
        actionType: 'STATUS_CHANGE',
        entityId: orderId,
        details: `Status changed to ${status} (Assigned: ${assignedTo || 'None'})`,
      })
    }
  },

  // --- EMPLOYEES ---
  getEmployees: () => {
    if (!isBrowser) return []
    try {
      const stored = localStorage.getItem(KEYS.EMPLOYEES)
      const parsed = stored ? JSON.parse(stored) : []
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  },

  addEmployee: (name, role) => {
    if (!isBrowser) return
    const employees = demoStorage.getEmployees()
    const newEmp = {
      id: `emp-${Date.now()}`,
      name,
      role,
      isOnDuty: true,
    }
    employees.push(newEmp)
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees))
    return newEmp
  },

  toggleEmployeeDuty: (id, isOnDuty) => {
    if (!isBrowser) return
    const employees = demoStorage.getEmployees()
    const emp = employees.find((e) => e.id === id)
    if (emp) {
      emp.isOnDuty = isOnDuty
      if (isOnDuty) {
        emp.lastPunchTime = new Date().toISOString()
      }
      localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees))
    }
  },

  deleteEmployee: (id) => {
    if (!isBrowser) return
    const employees = demoStorage.getEmployees().filter((e) => e.id !== id)
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees))
  },

  // --- SETTINGS ---
  getSettings: () => {
    if (!isBrowser) return {}
    try {
      const stored = localStorage.getItem('pizza-system-settings')
      return stored ? JSON.parse(stored) : {}
    } catch (e) {
      return {}
    }
  },

  saveSettings: (settings) => {
    if (!isBrowser) return
    localStorage.setItem('pizza-system-settings', JSON.stringify(settings))
  },

  // --- ACTIONS (Audit Log) ---
  getActions: () => {
    if (!isBrowser) return []
    try {
      const stored = localStorage.getItem(KEYS.ACTIONS)
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      return []
    }
  },

  logAction: (action) => {
    if (!isBrowser) return
    const actions = demoStorage.getActions()
    const newAction = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...action,
    }
    const updatedActions = [...actions, newAction].slice(-50)
    localStorage.setItem(KEYS.ACTIONS, JSON.stringify(updatedActions))
  },
}

