'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MonitorDisplay({ initialOrders }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)

  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 5000) // Fast refresh for monitor
    return () => clearInterval(interval)
  }, [router])

  const preparing = orders.filter((o) => ['IN_PREP', 'OVEN'].includes(o.status))
  const ready = orders.filter((o) => o.status === 'READY')

  return (
    <div className="flex h-screen flex-col p-8">
      {/* Header */}
      <header className="mb-12 flex items-center justify-between border-b border-slate-700 pb-6">
        <h1 className="text-5xl font-black tracking-tight text-white">
          🍕 ORDER STATUS
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-xl font-medium text-slate-400">
            {new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </header>

      {/* Columns */}
      <div className="grid flex-1 grid-cols-2 gap-12">
        {/* PREPARING COLUMN */}
        <div className="rounded-3xl bg-slate-800/50 p-8">
          <h2 className="mb-8 flex items-center gap-4 text-4xl font-bold text-orange-400">
            <span className="animate-pulse">🔥</span> WE'RE COOKING
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {preparing.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-lg"
              >
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-2xl font-bold text-white">
                    {order.displayId}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">
                      {order.customerSnapshot.name}
                    </h3>
                    <p className="text-lg text-slate-400">
                      {order.items.length} items
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {preparing.length === 0 && (
              <p className="text-center text-2xl text-slate-600 italic">
                Oven is empty!
              </p>
            )}
          </div>
        </div>

        {/* READY COLUMN */}
        <div className="rounded-3xl border border-green-900/50 bg-green-900/20 p-8">
          <h2 className="mb-8 flex items-center gap-4 text-4xl font-bold text-green-400">
            <span>✅</span> READY FOR PICKUP
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {ready.map((order) => (
              <div
                key={order.id}
                className="animate-bounce-subtle flex items-center justify-between rounded-2xl bg-green-600 p-6 shadow-lg"
              >
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-bold text-green-700">
                    {order.displayId}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">
                      {order.customerSnapshot.name}
                    </h3>
                    <p className="text-lg text-green-100">Ready now!</p>
                  </div>
                </div>
              </div>
            ))}
            {ready.length === 0 && (
              <p className="text-center text-2xl text-slate-600 italic">
                No orders ready yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
