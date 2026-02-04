import { fetchDashboardData, updateStatusAction } from '../actions'
import ExpoDisplay from '../../components/ExpoDisplay'

export const dynamic = 'force-dynamic'

export default async function ExpoPage() {
  const data = await fetchDashboardData()

  return (
    <main className="min-h-screen bg-white">
      <ExpoDisplay
        initialOrders={data.orders}
        updateStatusAction={updateStatusAction}
      />
    </main>
  )
}
