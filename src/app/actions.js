'use server'

import { revalidatePath } from 'next/cache'
import { ROUTES } from '../lib/routes'
import {
  orderService,
  getOrders,
  getWarnings,
  getActions,
} from '../lib/services'

import { prisma } from '../lib/prisma'

// --------------------
// Employee / Staff Management
// --------------------
export async function getEmployees() {
  const employees = await prisma.employee.findMany({
    orderBy: { name: 'asc' },
  })
  return employees
}

export async function addEmployeeAction(prevState, formData) {
  try {
    const name = formData.get('name')
    const role = formData.get('role')

    if (!name || !role) {
      return { success: false, message: 'Missing fields' }
    }

    await prisma.employee.create({
      data: {
        name,
        role,
        isOnDuty: false,
      },
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
    await prisma.employee.update({
      where: { id },
      data: { isOnDuty },
    })
    revalidatePath(ROUTES.HOME)
    revalidatePath('/kitchen')
    return { success: true }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

export async function deleteEmployeeAction(id) {
  try {
    await prisma.employee.delete({
      where: { id },
    })
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
export async function checkCustomerWarning(phone) {
  if (!phone) return { hasWarning: false }

  const warnings = await getWarnings()
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
    // We need to import the repository directly or expose a create method in service
    // For now, let's look at how services.js exports things.
    // It exports `orderService` which has `warnings` repo.

    const warning = {
      id: `warn-${Date.now()}`,
      reason: reason || 'Prank Caller',
      createdBy: 'staff',
      customerIdentifier: { phone },
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    await orderService.warnings.create(warning)
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
      getOrders(),
      getWarnings(),
      getActions(),
      getEmployees(),
    ])

    return {
      orders: orders.map((o) => ({ ...o })),
      warnings: warnings.map((w) => ({ ...w })),
      actions: actions.map((a) => ({ ...a })),
      employees: employees,
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    // Return empty state to prevent page crash (e.g., if DB is missing on Vercel)
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

// --------------------
// Status Updates
// --------------------
export async function updateStatusAction(
  orderId,
  newStatus,
  assignedTo = null
) {
  try {
    await orderService.updateStatus(orderId, newStatus, null, assignedTo)

    revalidatePath(ROUTES.HOME)
    revalidatePath('/kitchen')
    revalidatePath('/monitor')

    return { success: true }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

export async function updateOrderDetailsAction(orderId, formData) {
  try {
    const customerName = formData.get('customerName')
    const customerPhone = formData.get('customerPhone')
    const type = formData.get('type')
    const address = formData.get('address')
    const itemsJson = formData.get('items')
    const totalPrice = parseFloat(formData.get('totalPrice'))

    const items = JSON.parse(itemsJson)

    const updates = {
      customerSnapshot: {
        name: customerName,
        phone: customerPhone,
        type,
        address,
      },
      items,
      totalPrice,
    }

    await orderService.updateOrderDetails(orderId, updates)
    revalidatePath(ROUTES.HOME)
    revalidatePath('/kitchen')
    revalidatePath('/monitor')
    return { success: true, message: 'Order updated successfully' }
  } catch (error) {
    console.error('[UPDATE_ORDER_FAILED]', error)
    return { success: false, message: error.message }
  }
}
export async function __testCreateOrder(input) {
  await orderService.createOrder(input)
}
