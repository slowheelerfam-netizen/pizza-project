export const dynamic = 'force-dynamic'

import {
  fetchDashboardData,
  updateStatusAction,
  createOrderAction,
  updateOrderDetailsAction,
  checkCustomerWarningAction,
} from '../actions'
import PublicOrderInterface from '@/components/PublicOrderInterface'

export default async function RegisterPage() {
  const data = await fetchDashboardData()

  const orders = data?.orders || []
  const employees = data?.employees || []
  const warnings = data?.warnings || []

  return (
    <PublicOrderInterface
      initialOrders={orders}
      employees={employees}
      warnings={warnings}
      createOrderAction={createOrderAction}
      updateStatusAction={updateStatusAction}
      updateOrderDetailsAction={updateOrderDetailsAction}
      checkCustomerWarningAction={checkCustomerWarningAction}
    />
  )
}
