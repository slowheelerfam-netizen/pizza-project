'use client'

import { useState, useEffect, useOptimistic, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import OrderEditModal from './OrderEditModal'
import OrderDetailsModal from './OrderDetailsModal'
import OrderCard from './OrderCard'

export default function Oven({ initialOrders, updateStatusAction }) {
  const router = useRouter()

  // Optimistic UI
  const [optimisticOrders, addOptimisticOrder] = useOptimistic(
    initialOrders,
    (state, updatedOrder) => {
      return state.map((o) =>
        o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
      )
    }
  )

  // Interaction State
  const [editingOrder, setEditingOrder] = useState(null)
  const [detailsOrder, setDetailsOrder] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 5000) // Poll every 5s
    return () => clearInterval(interval)
  }, [router])

  const handleStatusUpdate = async (orderId, newStatus, assignedTo) => {
    startTransition(() => {
      addOptimisticOrder({ id: orderId, status: newStatus, assignedTo })
    })

    if (editingOrder?.id === orderId) {
      setEditingOrder(null)
    }

    if (updateStatusAction) {
      await updateStatusAction(orderId, newStatus, assignedTo)
    }
  }

  const ovenOrders = optimisticOrders
    .filter((o) => o.status === 'OVEN')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const readyOrders = optimisticOrders
    .filter((o) => o.status === 'READY')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <header className="z-10 flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <h1 className="text-xl font-black tracking-tight text-indigo-900">
          🔥 OVEN STATION
        </h1>
      </header>

      <div className="flex-1 overflow-hidden p-6">
        <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-2">
          {/* OVEN */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="rounded-t-2xl border-b border-gray-100 bg-orange-50 p-4">
              <h2 className="flex items-center justify-between text-lg font-black text-orange-900">
                <span>🔥 Oven</span>
                <span className="rounded-full bg-orange-200 px-2 py-0.5 text-sm">
                  {ovenOrders.length}
                </span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
              {ovenOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => setEditingOrder(order)}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    setEditingOrder(null)
                    setDetailsOrder(order)
                  }}
                />
              ))}
              {ovenOrders.length === 0 && (
                <div className="py-10 text-center text-gray-400">
                  Oven is empty
                </div>
              )}
            </div>
          </div>

          {/* READY */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="rounded-t-2xl border-b border-gray-100 bg-green-50 p-4">
              <h2 className="flex items-center justify-between text-lg font-black text-green-900">
                <span>✅ Ready</span>
                <span className="rounded-full bg-green-200 px-2 py-0.5 text-sm">
                  {readyOrders.length}
                </span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
              {readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => setEditingOrder(order)}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    setEditingOrder(null)
                    setDetailsOrder(order)
                  }}
                />
              ))}
              {readyOrders.length === 0 && (
                <div className="py-10 text-center text-gray-400">
                  Ready shelf is empty
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <OrderEditModal
        isOpen={!!editingOrder}
        order={editingOrder}
        viewContext="OVEN"
        employees={[]}
        onStatusUpdate={handleStatusUpdate}
        onClose={() => setEditingOrder(null)}
      />

      <OrderDetailsModal
        isOpen={!!detailsOrder}
        order={detailsOrder}
        onClose={() => setDetailsOrder(null)}
      />
    </div>
  )
}
