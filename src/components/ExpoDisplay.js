'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ExpoDisplay({ initialOrders, updateStatusAction }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    setOrders(initialOrders)
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
    await updateStatusAction(orderId, 'READY')
    router.refresh()
  }

  // CHUNK 2: Expo displays OVEN orders only
  const ovenOrders = orders
    .filter((o) => o.status === 'OVEN')
    .sort((a, b) =>
      (a.customerSnapshot.name || '').localeCompare(
        b.customerSnapshot.name || ''
      )
    )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex items-center justify-between border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-black tracking-tight text-gray-900">
          🔥 EXPO: OVEN STATION
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
                  <span>
                    {new Date(selectedOrder.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full bg-gray-100 p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 max-h-[50vh] space-y-4 overflow-y-auto">
              {selectedOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    {item.name}
                  </h3>
                  <p className="text-gray-600">
                    {item.size} • {item.crust}
                  </p>
                  {item.toppings.length > 0 && (
                    <p className="mt-2 text-gray-800">
                      {item.toppings.join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <div className="mt-2 font-bold text-amber-600">
                      NOTE: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleMarkReady(selectedOrder.id)}
              className="w-full rounded-xl bg-green-600 py-4 text-xl font-bold text-white shadow-lg transition-all hover:bg-green-500 active:scale-95"
            >
              MARK READY ✅
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
