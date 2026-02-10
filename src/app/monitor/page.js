import { fetchDashboardData, updateStatusAction } from '../actions'
import MonitorDisplay from '../../components/MonitorDisplay'

export const dynamic = 'force-dynamic'

export default async function MonitorPage() {
  const data = await fetchDashboardData()

  // Filter for active orders to show on monitor
  // Monitor only shows MONITOR orders (Chunk 2)
  const activeOrders = data.orders.filter((order) =>
    ['MONITOR'].includes(order.status)
  )

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <MonitorDisplay
        initialOrders={activeOrders}
        updateStatusAction={updateStatusAction}
      />
    </main>
  )
}
