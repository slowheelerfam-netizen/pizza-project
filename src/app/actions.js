'use server'

import { createServerServices } from '@/server/services'
import { revalidatePath } from 'next/cache'
import { FileOrderRepository } from '@/infrastructure/repositories/FileOrderRepository'
import { FileWarningRepository } from '@/infrastructure/repositories/FileWarningRepository'
import { FileEmployeeRepository } from '@/infrastructure/repositories/FileEmployeeRepository'


export async function createOrderAction(_, formData) {
  const services = createServerServices()
  const orderService = services.orderService

  const input = {
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    type: formData.get('type'),
    address: formData.get('address'),
    isWalkIn: formData.get('isWalkIn') === 'true',
    assumeChefRole: formData.get('assumeChefRole') === 'true', // ✅
    isPriority: formData.get('isPriority') === 'true',
    items: JSON.parse(formData.get('items') || '[]'),
    totalPrice: Number(formData.get('totalPrice') || 0),
    source: 'REGISTER',
  }

  try {
    const order = await orderService.createOrder(input)
    revalidatePath('/')
    return { success: true, order }
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Order creation failed',
    }
  }
}

export async function updateOrderDetailsAction(orderId, updates) {
  const services = createServerServices()
  const orderService = services.orderService

  try {
    const order = await orderService.updateOrderDetails(orderId, updates)
    revalidatePath('/')
    return { success: true, order }
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Order update failed',
    }
  }
}

export async function checkCustomerWarningAction(phone) {
  const services = createServerServices()
  const warningRepo = services.warningRepository

  const warning = await warningRepo.findActiveByPhone(phone)
  if (!warning) {
    return { hasWarning: false }
  }

  return {
    hasWarning: true,
    warning,
  }
}
// --------------------------------------------------
// Demo / UI compatibility stubs
// --------------------------------------------------
export async function fetchDashboardData() {
  const orderRepo = new FileOrderRepository()
  const warningRepo = new FileWarningRepository()
  const employeeRepo = new FileEmployeeRepository()

  const [orders, warnings, employees] = await Promise.all([
    orderRepo.getAll(),
    warningRepo.getAll(),
    employeeRepo.getAll(),
  ])

  return {
    orders,
    warnings,
    employees,
  }
}


export async function updateStatusAction() {
  // no-op in demo
  return { ok: true }
}

export async function addEmployeeAction() {
  return { ok: true }
}

export async function toggleEmployeeDutyAction() {
  return { ok: true }
}

export async function deleteEmployeeAction() {
  return { ok: true }
}

export async function addWarningAction() {
  return { ok: true }
}
