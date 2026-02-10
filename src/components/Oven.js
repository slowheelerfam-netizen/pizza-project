'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { demoStorage } from '../lib/demoStorage'
import OrderEditModal from './OrderEditModal'
import OrderDetailsModal from './OrderDetailsModal'
import { generateLabelText } from '../utils/receiptPrinter'

export default function Oven({ initialOrders, updateStatusAction }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  
  // Interaction State
  const [editingOrder, setEditingOrder] = useState(null)
  const [detailsOrder, setDetailsOrder] = useState(null)
  const [shouldPrint, setShouldPrint] = useState(false)

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

  const handleStatusUpdate = async (orderId, newStatus, assignedTo) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )

    // Close modals
    if (editingOrder?.id === orderId) {
      setEditingOrder(null)
    }

    // Call server action
    await updateStatusAction(orderId, newStatus, assignedTo)

    // Also update local storage
    demoStorage.updateOrderStatus(orderId, newStatus, assignedTo)

    router.refresh()
  }

  // CHUNK 2: Oven displays MONITOR (Waiting) and OVEN (Cooking) orders
  const ovenOrders = orders
    .filter((o) => ['MONITOR', 'OVEN'].includes(o.status))
    .sort((a, b) => {
      // Prioritize OVEN (Cooking) over MONITOR (Waiting)
      if (a.status === 'OVEN' && b.status !== 'OVEN') return -1
      if (a.status !== 'OVEN' && b.status === 'OVEN') return 1
      return (a.customerSnapshot.name || '').localeCompare(
        b.customerSnapshot.name || ''
      )
    })

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
            onClick={() => setEditingOrder(order)}
            onDoubleClick={(e) => {
              e.stopPropagation()
              setEditingOrder(null)
              setDetailsOrder(order)
            }}
            className={`cursor-pointer rounded-xl border p-6 shadow-sm transition-all hover:shadow-md ${
              order.status === 'OVEN'
                ? 'border-orange-500 bg-white hover:border-orange-600'
                : 'border-blue-200 bg-blue-50 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="truncate text-2xl font-bold text-gray-900">
                {order.customerSnapshot.name}
              </h3>
              <span
                className={`rounded px-3 py-1 text-sm font-bold ${
                  order.status === 'OVEN'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {order.status === 'OVEN' ? 'OVEN' : 'WAITING'}
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

      {/* EDIT MODAL (Single Click) */}
      <OrderEditModal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        order={editingOrder}
        viewContext="OVEN"
        onStatusUpdate={handleStatusUpdate}
      />

      {/* DETAILS MODAL (Double Click) */}
      <OrderDetailsModal
        isOpen={!!detailsOrder}
        onClose={() => setDetailsOrder(null)}
        order={detailsOrder}
      />
    </div>
  )
}
