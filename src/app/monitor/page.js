import { fetchDashboardData } from '../actions'
import MonitorDisplay from '../../components/MonitorDisplay'

export const dynamic = 'force-dynamic'

export default async function MonitorPage() {
  const data = await fetchDashboardData()

  // Filter for active orders to show on monitor
  // Monitor shows ONLY PREP (In Progress) orders
  // NEW orders are for the Chef to acknowledge first
  const safeOrders = Array.isArray(data.orders) ? data.orders : []
  const activeOrders = safeOrders.filter((order) =>
    ['PREP'].includes(order.status)
  )

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <MonitorDisplay initialOrders={activeOrders} />
    </main>
  )
}
