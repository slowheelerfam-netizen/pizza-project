import { fetchDashboardData, updateStatusAction } from '../actions'
import ExpoDisplay from '../../components/ExpoDisplay'

export const dynamic = 'force-dynamic'

export default async function ExpoPage() {
  const data = await fetchDashboardData()

  return (
    <main className="min-h-screen bg-slate-900">
      <ExpoDisplay
        initialOrders={data.orders}
        updateStatusAction={updateStatusAction}
      />
    </main>
  )
}
