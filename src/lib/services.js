// Client-safe facade
// Actual implementations are injected server-side by actions.js

export let orderService = null
export let repositories = null

export function registerServerServices(services) {
  orderService = services.orderService
  repositories = services.repositories
}

function ensureInit() {
  if (!repositories) {
    throw new Error(
      'Server services not initialized. Ensure registerServerServices is called.'
    )
  }
}

// --- Data Accessors ---

export const getOrders = async () => {
  ensureInit()
  return repositories.order.getAll()
}

export const getWarnings = async () => {
  ensureInit()
  return repositories.warning.getAll()
}

export const getActions = async () => {
  ensureInit()
  return repositories.adminAction.getAll()
}

export const getEmployees = async () => {
  ensureInit()
  return repositories.employee.getAll()
}

// --- Service Operations ---

export const addEmployee = async (data) => {
  ensureInit()
  return repositories.employee.create(data)
}

export const deleteEmployee = async (id) => {
  ensureInit()
  return repositories.employee.delete(id)
}

export const toggleEmployeeDuty = async (id, isOnDuty) => {
  ensureInit()
  const employee = await repositories.employee.findById(id)
  if (employee) {
    employee.isOnDuty = isOnDuty
    await repositories.employee.update(employee)
    return true
  }
  return false
}

export const addWarning = async (data) => {
  ensureInit()
  // Data should include { id, reason, createdBy, customerIdentifier, isActive, createdAt }
  // Or at least minimal fields if the repo doesn't handle it.
  // FileWarningRepository usually just pushes what it gets, so we assume the caller structures it,
  // OR we structure it here?
  // Let's stick to the repo just storing.
  return repositories.warning.create(data)
}

export const checkCustomerWarning = async (phone) => {
  ensureInit()
  if (!phone) return { hasWarning: false }

  const warnings = await repositories.warning.getAll()
  const activeWarning = warnings.find(
    (w) => w.isActive && w.customerIdentifier?.phone === phone
  )

  if (activeWarning) {
    return {
      hasWarning: true,
      warning: {
        reason: activeWarning.reason,
        createdAt: activeWarning.createdAt,
      },
    }
  }

  return { hasWarning: false }
}
