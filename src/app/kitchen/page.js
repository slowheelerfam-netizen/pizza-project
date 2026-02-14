import { unstable_noStore } from 'next/cache'
import {
  fetchDashboardData,
  updateStatusAction,
  updateOrderDetailsAction,
} from '../actions'
import ChefDisplay from '@/components/ChefDisplay'
import { ORDER_STATUS } from '@/types/models'

export const dynamic = 'force-dynamic'

export default async function KitchenPage() {
  unstable_noStore()

  const data = await fetchDashboardData()

  const safeOrders = Array.isArray(data?.orders) ? data.orders : []
  const safeEmployees = Array.isArray(data?.employees) ? data.employees : []

  /**
   * KITCHEN VIEW CONTRACT (LOCKED)
   * ------------------------------
   * Chef sees FULL universe needed for progression,
   * but is responsible ONLY for:
   * PREP → OVEN
   */
  const kitchenOrders = safeOrders.filter(
    (order) =>
      order.status === ORDER_STATUS.NEW ||
      order.status === ORDER_STATUS.PREP ||
      order.status === ORDER_STATUS.OVEN ||
      order.status === ORDER_STATUS.READY
  )

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <ChefDisplay
        orders={kitchenOrders}
        employees={safeEmployees}
        updateStatusAction={updateStatusAction}
        updateOrderDetailsAction={updateOrderDetailsAction}
        viewContext="KITCHEN"
      />
    </main>
  )
}
