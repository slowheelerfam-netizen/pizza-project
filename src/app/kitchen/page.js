import { fetchDashboardData, updateStatusAction } from '../actions'
import ChefDisplay from '../../components/ChefDisplay'

export const dynamic = 'force-dynamic'

export default async function ChefPage() {
  const data = await fetchDashboardData()

  // Filter for relevant kitchen statuses
  const kitchenOrders = data.orders.filter((order) =>
    ['NEW', 'CONFIRMED', 'IN_PREP', 'OVEN', 'READY'].includes(order.status)
  )

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-8 flex items-center justify-between border-b border-gray-100 pb-6">
          <h1 className="text-4xl font-black tracking-tight text-gray-900">
            👨‍🍳 Chef
          </h1>
          <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 font-bold text-green-700">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
            </span>
            LIVE SYSTEM
          </div>
        </header>

        <ChefDisplay
          initialOrders={kitchenOrders}
          employees={data.employees}
          updateStatusAction={updateStatusAction}
        />
      </div>
    </main>
  )
}
