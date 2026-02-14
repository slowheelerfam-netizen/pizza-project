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
import PaymentCollectionModal from './PaymentCollectionModal'

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
  updateOrderDetailsAction,
  viewContext = 'KITCHEN',
}) {
  const [editingOrder, setEditingOrder] = useState(null)
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null)

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

  const readyOrders = optimisticOrders
    .filter((o) => o.status === ORDER_STATUS.READY)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const handleStatusUpdate = async (orderId, newStatus, assignedTo) => {
    startTransition(() => {
      addOptimisticOrder({ id: orderId, status: newStatus, assignedTo })
    })
    if (updateStatusAction) {
      await updateStatusAction(orderId, newStatus, assignedTo)
    }
  }

  const handleQuickAdvance = (order) => {
    let nextStatus = null
    if (order.status === ORDER_STATUS.NEW) nextStatus = ORDER_STATUS.PREP
    else if (order.status === ORDER_STATUS.PREP) nextStatus = ORDER_STATUS.OVEN
    else if (order.status === ORDER_STATUS.OVEN) nextStatus = ORDER_STATUS.READY
    else if (order.status === ORDER_STATUS.READY) {
      if (order.customerSnapshot?.type === 'DINE_IN' && !order.isPaid) {
        setSelectedPaymentOrder(order)
        return
      }
      nextStatus = ORDER_STATUS.COMPLETED
    }

    if (nextStatus) {
      handleStatusUpdate(order.id, nextStatus, order.assignedTo)
    }
  }

  const handlePaymentComplete = async () => {
    if (!selectedPaymentOrder) return
    const orderId = selectedPaymentOrder.id

    startTransition(() => {
      addOptimisticOrder({
        id: orderId,
        isPaid: true,
        status: ORDER_STATUS.COMPLETED,
      })
    })

    if (updateOrderDetailsAction) {
      await updateOrderDetailsAction(orderId, { isPaid: true })
    }
    if (updateStatusAction) {
      await updateStatusAction(
        orderId,
        ORDER_STATUS.COMPLETED,
        selectedPaymentOrder.assignedTo
      )
    }

    setSelectedPaymentOrder(null)
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
    <div className="flex h-screen flex-col bg-slate-900">
      <header className="flex items-center justify-between bg-slate-800 px-6 py-3 shadow-sm">
        <h1 className="text-3xl font-black text-indigo-400">
          👨‍🍳 KITCHEN{' '}
          <span className="text-xl font-medium text-slate-500">| Display</span>
        </h1>
        <div className="text-xl font-bold text-gray-100">
          Active: {activePrepOrders.length + ovenOrders.length}
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-6">
        <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-3">
          {/* COL 1: PREP */}
          <div className="flex flex-col rounded-2xl bg-slate-800 shadow-xl">
            <div className="rounded-t-2xl border-b border-slate-700 bg-indigo-900/20 p-4">
              <h2 className="flex items-center justify-between text-lg font-bold text-indigo-400">
                <span>🔪 Prep Station</span>
                <span className="rounded-full bg-indigo-900/40 px-2 py-0.5 text-sm text-indigo-200">
                  {activePrepOrders.length}
                </span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto bg-transparent p-4">
              {activePrepOrders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  onClick={() => setEditingOrder(o)}
                  onStatusClick={handleQuickAdvance}
                  showIngredients={true}
                />
              ))}
              {activePrepOrders.length === 0 && (
                <div className="py-10 text-center text-slate-500">
                  No orders to prep
                </div>
              )}
            </div>
          </div>

          {/* COL 2: OVEN */}
          <div className="flex flex-col rounded-2xl bg-slate-800 shadow-xl">
            <div className="rounded-t-2xl border-b border-slate-700 bg-orange-900/20 p-4">
              <h2 className="flex items-center justify-between text-lg font-bold text-orange-400">
                <span>🔥 Oven Station</span>
                <span className="rounded-full bg-orange-900/40 px-2 py-0.5 text-sm text-orange-200">
                  {ovenOrders.length}
                </span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto bg-transparent p-4">
              {ovenOrders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  onClick={() => setEditingOrder(o)}
                  onStatusClick={handleQuickAdvance}
                  showIngredients={true}
                />
              ))}
              {ovenOrders.length === 0 && (
                <div className="py-10 text-center text-slate-500">
                  Oven is empty
                </div>
              )}
            </div>
          </div>

          {/* COL 3: READY (Serving Station) */}
          <div className="flex flex-col rounded-2xl bg-slate-800 shadow-xl">
            <div className="rounded-t-2xl border-b border-slate-700 bg-green-900/20 p-4">
              <h2 className="flex items-center justify-between text-lg font-bold text-green-400">
                <span>✅ Serving Station</span>
                <span className="rounded-full bg-green-900/40 px-2 py-0.5 text-sm text-green-200">
                  {readyOrders.length}
                </span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto bg-transparent p-4">
              {readyOrders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  onClick={() => setEditingOrder(o)}
                  onStatusClick={handleQuickAdvance}
                  onPaymentClick={setSelectedPaymentOrder}
                  showIngredients={false}
                />
              ))}
              {readyOrders.length === 0 && (
                <div className="py-10 text-center text-slate-500">
                  No orders ready
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

      <PaymentCollectionModal
        isOpen={!!selectedPaymentOrder}
        order={selectedPaymentOrder}
        onClose={() => setSelectedPaymentOrder(null)}
        onConfirm={handlePaymentComplete}
      />
    </div>
  )
}
