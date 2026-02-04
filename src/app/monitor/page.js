import { fetchDashboardData } from '../actions'
import MonitorDisplay from '../../components/MonitorDisplay'

export const dynamic = 'force-dynamic'

export default async function MonitorPage() {
  const data = await fetchDashboardData()

  // Filter for active orders to show on monitor
  // Usually we show IN_PREP and READY
  const activeOrders = data.orders.filter((order) =>
    ['IN_PREP', 'READY'].includes(order.status)
  )

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <MonitorDisplay initialOrders={activeOrders} />
    </main>
  )
}
