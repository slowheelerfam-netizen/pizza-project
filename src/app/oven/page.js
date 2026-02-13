import { fetchDashboardData, updateStatusAction } from '../actions'
import Oven from '../../components/Oven'

export const dynamic = 'force-dynamic'

export default async function OvenPage() {
  const data = await fetchDashboardData()
  const safeOrders = Array.isArray(data.orders) ? data.orders : []

  // Filter for OVEN and READY statuses
  const activeOrders = safeOrders.filter((order) =>
    ['OVEN', 'READY'].includes(order.status)
  )

  return (
    <main className="min-h-screen bg-slate-900">
      <Oven
        initialOrders={activeOrders}
        updateStatusAction={updateStatusAction}
      />
    </main>
  )
}
