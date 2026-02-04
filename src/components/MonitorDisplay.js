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
    }, 2000)
    return () => clearInterval(interval)
  }, [router])

  // CHUNK 2: Monitor displays PREP orders only
  const prepOrders = orders
    .filter((o) => o.status === 'IN_PREP')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 text-white">
      <header className="mb-8 flex items-center justify-between border-b border-slate-700 pb-6">
        <h1 className="text-4xl font-black tracking-tight">
          🔪 MONITOR: PREP STATION
        </h1>
        <div className="rounded-full bg-slate-800 px-4 py-2 font-mono text-xl text-slate-400">
          {prepOrders.length} Active
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
        {prepOrders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border-2 border-slate-700 bg-slate-800 p-6 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between border-b-2 border-slate-700 pb-4">
              <h3 className="truncate text-3xl font-extrabold text-white tracking-tight">
                {order.customerSnapshot.name}
              </h3>
              <span className="rounded-lg bg-blue-900 px-3 py-1.5 text-sm font-black text-blue-200 uppercase tracking-wider">
                PREP
              </span>
            </div>
            
            <div className="space-y-6">
              {order.items.map((item, idx) => (
                <div key={idx} className="text-lg">
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-slate-100 text-xl">
                      {item.quantity || 1}x {item.name}
                    </span>
                    <span className="whitespace-nowrap font-semibold text-slate-400">
                      {item.size}
                    </span>
                  </div>
                  
                  <div className="pl-6 mt-1 text-base text-slate-300">
                    <div className="font-medium">{item.crust}</div>
                    {item.toppings && item.toppings.length > 0 && (
                      <div className="mt-1 leading-relaxed text-slate-400">
                        {item.toppings.join(', ')}
                      </div>
                    )}
                  </div>

                  {item.notes && (
                    <div className="mt-3 rounded-lg bg-amber-900/40 px-3 py-2 text-base font-bold text-amber-400 border border-amber-900/50">
                      NOTE: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t-2 border-slate-700 pt-4 text-sm text-slate-400 font-medium">
              <span className="font-mono text-base">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {order.assignedTo && (
                <span className="flex items-center gap-2 text-slate-300 bg-slate-700/50 px-3 py-1 rounded-full">
                  👨‍🍳 {order.assignedTo}
                </span>
              )}
            </div>
          </div>
        ))}
        
        {prepOrders.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500">
            No orders in Prep
          </div>
        )}
      </div>
    </div>
  )
}
