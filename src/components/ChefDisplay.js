'use client'

import React, {
  useState,
  useEffect,
  useOptimistic,
  startTransition,
} from 'react'
import { useRouter } from 'next/navigation'
import { ORDER_STATUS } from '../types/models'
import OrderEditModal from './OrderEditModal'
import OrderCard from './OrderCard'

/**
 * CONTRACT (LOCKED)
 * -----------------
 * Status flow: NEW → PREP → OVEN → READY
 *
 * KITCHEN VIEW:
 * - Responsible ONLY for: PREP → OVEN
 * - Does NOT operate on NEW or READY
 */

export default function ChefDisplay({
  orders = [],
  employees = [],
  updateStatusAction,
  viewContext = 'KITCHEN',
}) {
  const [editingOrder, setEditingOrder] = useState(null)

  // Optimistic UI for Orders
  const [optimisticOrders, addOptimisticOrder] = useOptimistic(
    orders,
    (state, updatedOrder) => {
      return state.map((o) =>
        o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
      )
    }
  )

  const newOrders = optimisticOrders
    .filter((o) => o.status === ORDER_STATUS.NEW)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const activePrepOrders = optimisticOrders
    .filter((o) => o.status === ORDER_STATUS.PREP)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const ovenOrders = optimisticOrders
    .filter((o) => o.status === ORDER_STATUS.OVEN)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const handleStatusUpdate = async (orderId, newStatus, assignedTo) => {
    startTransition(() => {
      addOptimisticOrder({ id: orderId, status: newStatus, assignedTo })
    })
    if (updateStatusAction) {
      await updateStatusAction(orderId, newStatus, assignedTo)
    }
  }

  // Refresh interval logic
  const router = useRouter()
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh()
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      {/* Header */}
      <header className="z-10 flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <h1 className="text-xl font-black tracking-tight text-indigo-900">
          👨‍🍳 Kitchen Station
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm font-bold text-gray-500">
            {employees.filter((e) => e.isOnDuty).length} Active Staff
          </div>
        </div>
      </header>

      {/* 2-Column Dashboard (Prep vs Oven) */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-2">
          {/* COL 1: PREP */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="rounded-t-2xl border-b border-gray-100 bg-yellow-50 p-4">
              <h2 className="flex items-center justify-between text-lg font-black text-yellow-900">
                <span>🔪 Prep Station</span>
                <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-sm">
                  {newOrders.length + activePrepOrders.length}
                </span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
              {newOrders.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-xs font-black tracking-wider text-blue-600 uppercase">
                    Incoming ({newOrders.length})
                  </h3>
                  {newOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onClick={() => setEditingOrder(order)}
                    />
                  ))}
                  <div className="my-4 border-t border-dashed border-gray-300"></div>
                </div>
              )}

              {activePrepOrders.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-xs font-black tracking-wider text-indigo-600 uppercase">
                    In Prep ({activePrepOrders.length})
                  </h3>
                  {activePrepOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onClick={() => setEditingOrder(order)}
                    />
                  ))}
                </div>
              )}

              {newOrders.length === 0 && activePrepOrders.length === 0 && (
                <div className="py-10 text-center text-gray-400">
                  No orders in Prep
                </div>
              )}
            </div>
          </div>

          {/* COL 2: OVEN */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="rounded-t-2xl border-b border-gray-100 bg-orange-50 p-4">
              <h2 className="flex items-center justify-between text-lg font-black text-orange-900">
                <span>🔥 Oven Station</span>
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
                />
              ))}
              {ovenOrders.length === 0 && (
                <div className="py-10 text-center text-gray-400">
                  Oven is empty
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <OrderEditModal
        isOpen={!!editingOrder}
        order={editingOrder}
        viewContext={viewContext}
        employees={employees}
        onStatusUpdate={handleStatusUpdate}
        onClose={() => setEditingOrder(null)}
      />
    </div>
  )
}
