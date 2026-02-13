'use server'

import { createServerServices } from '@/server'
import { revalidatePath, unstable_noStore } from 'next/cache'

export async function createOrderAction(_, formData) {
  unstable_noStore()

  const { orderService } = createServerServices()

  const input = {
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    type: formData.get('type'),
    address: formData.get('address'),
    isWalkIn: formData.get('isWalkIn') === 'true',
    assumeChefRole: formData.get('assumeChefRole') === 'true',
    isPriority: formData.get('isPriority') === 'true',
    items: JSON.parse(formData.get('items') || '[]'),
    totalPrice: Number(formData.get('totalPrice') || 0),
    source: 'REGISTER',
    specialInstructions: formData.get('specialInstructions'),
  }

  const order = await orderService.createOrder(input)

  revalidatePath('/')
  revalidatePath('/register')
  revalidatePath('/kitchen')
  revalidatePath('/monitor')
  revalidatePath('/oven')

  return { success: true, order }
}

export async function updateStatusAction(orderId, status, assignedTo = null) {
  unstable_noStore()

  const { orderService } = createServerServices()

  const order = await orderService.updateStatus(orderId, status, assignedTo)

  revalidatePath('/register')
  revalidatePath('/kitchen')
  revalidatePath('/oven')
  revalidatePath('/monitor')

  return { success: true, order }
}

export async function updateOrderDetailsAction(orderId, updates) {
  unstable_noStore()

  const { orderService } = createServerServices()

  const order = await orderService.updateOrderDetails(orderId, updates)

  revalidatePath('/register')
  revalidatePath('/kitchen')
  revalidatePath('/oven')
  revalidatePath('/monitor')

  return { success: true, order }
}

export async function checkCustomerWarningAction(phone) {
  unstable_noStore()

  const { repositories } = createServerServices()

  const warnings = await repositories.warning.findActiveByIdentifiers({ phone })
  const warning = warnings[0] || null

  return warning ? { hasWarning: true, warning } : { hasWarning: false }
}

export async function fetchDashboardData() {
  unstable_noStore()

  const { repositories } = createServerServices()

  const [orders, warnings, employees] = await Promise.all([
    repositories.order.getAll(),
    repositories.warning.getAll(),
    repositories.employee.getAll(),
  ])

  return { orders, warnings, employees }
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
