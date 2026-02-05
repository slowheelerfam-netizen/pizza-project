import { fetchDashboardData, updateStatusAction } from '../actions'
import Link from 'next/link'
import AdminDashboard from '../../components/AdminDashboard'
import OrderCreationForm from '../../components/OrderCreationForm'
import StaffScheduler from '../../components/StaffScheduler'
import SystemWarnings from '../../components/SystemWarnings'
import AuditLog from '../../components/AuditLog'

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  // Force rebuild
  const data = await fetchDashboardData()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-6 md:p-10">
      <div className="mx-auto max-w-[1600px] space-y-8">
        {/* Header Section */}
        <header className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl lg:flex-row">
          <div className="text-center lg:text-left">
            <h1 className="bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-sm">
              Pizza Kitchen
            </h1>
            <p className="mt-2 text-lg font-medium text-indigo-100/60">
              Manage orders, track status, and view alerts
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 lg:relative lg:left-30">
            <Link
              href="/order"
              target="_blank"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/40 active:translate-y-0 active:shadow-md"
            >
              <span className="relative z-10 flex items-center gap-2">
                🍕 Public Order
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>

            <Link
              href="/monitor"
              target="_blank"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40 active:translate-y-0 active:shadow-md"
            >
              <span className="relative z-10 flex items-center gap-2">
                📺 Monitor
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>

            <Link
              href="/kitchen"
              target="_blank"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 active:translate-y-0 active:shadow-md"
            >
              <span className="relative z-10 flex items-center gap-2">
                👨‍🍳 Chef
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>

            <Link
              href="/expo"
              target="_blank"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/40 active:translate-y-0 active:shadow-md"
            >
              <span className="relative z-10 flex items-center gap-2">
                🔥 Expo
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </div>

          {/* Spacer to help center buttons if needed, or keep empty */}
          <div className="hidden lg:block lg:w-48"></div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column */}
          <section className="space-y-8 lg:col-span-4">
            <OrderCreationForm />
            <StaffScheduler employees={data.employees} />
          </section>

          {/* Right Column */}
          <section className="lg:col-span-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                <span className="text-2xl">📊</span> Live Dashboard
              </h2>

              <div className="flex items-center gap-3">
                <SystemWarnings warnings={data.warnings} />
                <AuditLog actions={data.actions} />
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
                  System Online
                </span>
              </div>
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
