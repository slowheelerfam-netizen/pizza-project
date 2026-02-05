'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { demoStorage } from '../lib/demoStorage'

export default function Oven({ initialOrders, updateStatusAction }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    // Merge server orders with local storage orders
    const localOrders = demoStorage.getOrders()
    const orderMap = new Map()

    // 1. Add server orders first
    initialOrders.forEach((o) => orderMap.set(o.id, o))

    // 2. Merge/Overwrite with local orders SMARTLY (Trust newer timestamp)
    localOrders.forEach((localOrder) => {
      const serverOrder = orderMap.get(localOrder.id)

      if (!serverOrder) {
        // If not on server, trust local (it might be a new offline order)
        orderMap.set(localOrder.id, localOrder)
      } else {
        // If on both, compare updated timestamps
        const serverTime = new Date(serverOrder.updatedAt || 0).getTime()
        const localTime = new Date(localOrder.updatedAt || 0).getTime()

        // Only overwrite if local is STRICTLY newer
        if (localTime > serverTime) {
          orderMap.set(localOrder.id, localOrder)
        }
      }
    })

    setTimeout(() => {
      setOrders(Array.from(orderMap.values()))
    }, 0)
  }, [initialOrders])

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 2000)
    return () => clearInterval(interval)
  }, [router])

  const handleMarkReady = async (orderId) => {
    // Optimistic
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
    setSelectedOrder(null)

    const result = await updateStatusAction(orderId, 'READY')

    // ALWAYS update Local Storage
    demoStorage.updateOrderStatus(orderId, 'READY')

    if (!result || result.success) {
      router.refresh()
    }
  }

  // CHUNK 2: Oven displays OVEN orders only
  const ovenOrders = orders
    .filter((o) => o.status === 'OVEN')
    .sort((a, b) =>
      (a.customerSnapshot.name || '').localeCompare(
        b.customerSnapshot.name || ''
      )
    )

  return (
    <div className="min-h-screen bg-transparent p-8">
      <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
        <h1 className="text-4xl font-black tracking-tight text-white">
          🔥 OVEN STATION
        </h1>
        <div className="rounded-full bg-orange-100 px-4 py-2 font-mono text-xl text-orange-800">
          {ovenOrders.length} In Oven
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ovenOrders.map((order) => (
          <div
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-orange-500 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h3 className="truncate text-2xl font-bold text-gray-900">
                {order.customerSnapshot.name}
              </h3>
              <span className="rounded bg-orange-100 px-3 py-1 text-sm font-bold text-orange-800">
                OVEN
              </span>
            </div>
          </div>
        ))}
        {ovenOrders.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400">
            Oven is empty
          </div>
        )}
      </div>

      {/* MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {selectedOrder.customerSnapshot.name}
                </h2>
                <div className="mt-2 flex items-center gap-4 text-gray-500">
                  <span className="font-bold text-orange-600">IN OVEN</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-orange-50 p-4">
                <h3 className="mb-2 text-sm font-bold tracking-wider text-orange-800 uppercase">
                  Current Status
                </h3>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-orange-500"></div>
                  <span className="text-lg font-medium text-orange-900">
                    Cooking in Oven
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => handleMarkReady(selectedOrder.id)}
                  className="w-full rounded-xl bg-orange-600 py-4 text-xl font-bold text-white shadow-lg transition-all hover:bg-orange-700 hover:shadow-xl active:scale-95"
                >
                  Mark as READY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEBUG INFO - Hidden for Production */}
      {false && (
      <div className="pointer-events-none fixed bottom-0 left-0 z-50 bg-black/80 p-2 text-xs text-white opacity-50">
        Debug: Total {orders.length} | Oven {ovenOrders.length} | Statuses:{' '}
        {orders.map((o) => o.status).join(', ')}
      </div>
      )}
    </div>
  )
}
