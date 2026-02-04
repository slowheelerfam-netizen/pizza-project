import { fetchDashboardData, updateStatusAction } from '../actions'
import AdminDashboard from '../../components/AdminDashboard'
import OrderCreationForm from '../../components/OrderCreationForm'
import StaffScheduler from '../../components/StaffScheduler'
import SystemWarnings from '../../components/SystemWarnings'
import AuditLog from '../../components/AuditLog'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const data = await fetchDashboardData()

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <header className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-indigo-900">
              Pizza Kitchen
            </h1>
            <p className="mt-2 text-lg font-medium text-indigo-600/80">
              Manage orders, track status, and view alerts
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <SystemWarnings warnings={data.warnings} />
            <AuditLog actions={data.actions} />
            <a
              href="/monitor"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
            >
              📺 Monitor
            </a>
            <a
              href="/kitchen"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg"
            >
              👨‍🍳 Chef
            </a>
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
              System Online
            </span>
          </div>
        </header>

        {/* Main Content Grid: Order Form & Dashboard */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Create Order & Staff Scheduler */}
          <section className="space-y-8 lg:col-span-4">
            <OrderCreationForm />
            <StaffScheduler employees={data.employees} />
          </section>

          {/* Right Column: Live Dashboard */}
          <section className="lg:col-span-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-indigo-900">
                <span className="text-2xl">📊</span> Live Dashboard
              </h2>
            </div>
            <AdminDashboard
              orders={data.orders}
              updateStatusAction={updateStatusAction}
            />
          </section>
        </div>
      </div>
    </main>
  )
}
