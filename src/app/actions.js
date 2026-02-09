'use server'

import { revalidatePath } from 'next/cache'
import { ROUTES } from '../lib/routes'
import { createServerServices } from '../server/services'
import { registerServerServices } from '../lib/services'

// Initialize services on module load
const { orderService, repositories } = createServerServices()

// Register for other consumers (facade support)
registerServerServices({ orderService, repositories })

// --------------------
// Employee / Staff Management
// --------------------

// Wrapper for direct export to ensure it's a Server Action
export async function getEmployees() {
  return repositories.employee.getAll()
}

export async function addEmployeeAction(prevState, formData) {
  try {
    const name = formData.get('name')
    const role = formData.get('role')

    if (!name || !role) {
      return { success: false, message: 'Missing fields' }
    }

    await repositories.employee.create({
      name,
      role,
      isOnDuty: true,
    })

    revalidatePath(ROUTES.HOME)
    revalidatePath('/kitchen')
    return { success: true }
  } catch (error) {
    console.error('Add Employee Failed:', error)
    return { success: false, message: 'Failed to add employee' }
  }
}

export async function toggleEmployeeDutyAction(id, isOnDuty) {
  try {
    const employee = await repositories.employee.findById(id)
    if (employee) {
      employee.isOnDuty = isOnDuty
      await repositories.employee.update(employee)
    }
    revalidatePath(ROUTES.HOME)
    revalidatePath('/kitchen')
    return { success: true }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

export async function deleteEmployeeAction(id) {
  try {
    await repositories.employee.delete(id)
    revalidatePath(ROUTES.HOME)
    revalidatePath('/kitchen')
    return { success: true }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

// --------------------
// Warning / Security
// --------------------

export async function checkCustomerWarningAction(phone) {
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

export async function addWarningAction(phone, reason) {
  try {
    const warning = {
      id: `warn-${Date.now()}`,
      reason: reason || 'Prank Caller',
      createdBy: 'staff',
      customerIdentifier: { phone },
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    await repositories.warning.create(warning)
    revalidatePath(ROUTES.HOME)
    return { success: true, message: 'Warning added successfully' }
  } catch (error) {
    console.error('Failed to add warning:', error)
    return { success: false, message: 'Failed to add warning' }
  }
}

// --------------------
// Dashboard Query
// --------------------
export async function fetchDashboardData() {
  try {
    const [orders, warnings, actions, employees] = await Promise.all([
      repositories.order.getAll(),
      repositories.warning.getAll(),
      repositories.adminAction.getAll(),
      repositories.employee.getAll(),
    ])

    return {
      orders: orders.map((o) => ({ ...o })),
      warnings: warnings.map((w) => ({ ...w })),
      actions: actions.map((a) => ({ ...a })),
      employees: employees,
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    return {
      orders: [],
      warnings: [],
      actions: [],
      employees: [],
    }
  }
}

// --------------------
// Create Order
// --------------------
export async function createOrderAction(prevState, formData) {
  try {
    const customerName = formData.get('customerName')
    const customerPhone = formData.get('customerPhone')
    const type = formData.get('type')
    const address = formData.get('address')
    const isWalkIn = formData.get('isWalkIn') === 'true'
    const itemsJson = formData.get('items')
    const totalPrice = parseFloat(formData.get('totalPrice'))

    if (!customerName || !customerPhone || !itemsJson) {
      return { success: false, message: 'Missing required fields' }
    }

    const items = JSON.parse(itemsJson)

    const input = {
      customerName,
      customerPhone,
      type,
      address,
      isWalkIn,
      source: 'CALL_IN',
      items,
      totalPrice,
    }

    await orderService.createOrder(input)

    revalidatePath(ROUTES.HOME)

    return {
      success: true,
      message: 'Order created successfully',
    }
  } catch (error) {
    console.error('[CREATE_ORDER_ACTION_FAILED]', error)
    return {
      success: false,
      message: 'Failed to create order. Please try again.',
    }
  }
}

export async function updateStatusAction(orderId, status, assignedTo) {
  try {
    await orderService.updateOrderStatus(orderId, status, assignedTo)
    revalidatePath(ROUTES.HOME)
    revalidatePath('/kitchen')
    revalidatePath('/oven')
    return { success: true }
  } catch (error) {
    console.error('Update Status Failed:', error)
    return { success: false, message: 'Failed to update status' }
  }
}

export async function updateOrderDetailsAction(orderId, details) {
  try {
    await orderService.updateOrderDetails(orderId, details)
    revalidatePath(ROUTES.HOME)
    return { success: true }
  } catch (error) {
    console.error('Update Details Failed:', error)
    return { success: false, message: 'Failed to update details' }
  }
}
