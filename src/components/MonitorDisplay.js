'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { demoStorage } from '../lib/demoStorage'
import OrderEditModal from './OrderEditModal'
import OrderDetailsModal from './OrderDetailsModal'

export default function MonitorDisplay({ initialOrders, updateStatusAction }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)

  // Interaction State
  const [editingOrder, setEditingOrder] = useState(null)
  const [detailsOrder, setDetailsOrder] = useState(null)

  useEffect(() => {
    // Merge server orders with local storage orders
    const localOrders = demoStorage.getOrders()
    // Create a map by ID to merge
    const orderMap = new Map()

    // Add server orders first
    initialOrders.forEach((o) => orderMap.set(o.id, o))

    // Merge/Overwrite with local orders SMARTLY (Trust newer timestamp)
    localOrders.forEach((localOrder) => {
      const serverOrder = orderMap.get(localOrder.id)

      if (!serverOrder) {
        orderMap.set(localOrder.id, localOrder)
      } else {
        const serverTime = new Date(serverOrder.updatedAt || 0).getTime()
        const localTime = new Date(localOrder.updatedAt || 0).getTime()

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
    setOrders((current) =>
      current.map((o) =>
        o.id === orderId
          ? { ...o, status: newStatus, assignedTo: assignedTo || o.assignedTo }
          : o
      )
    )

    // Close modals
    if (editingOrder?.id === orderId) {
      setEditingOrder(null)
    }

    if (updateStatusAction) {
      await updateStatusAction(orderId, newStatus, assignedTo)
    }

    // Always update local storage
    demoStorage.updateOrderStatus(orderId, newStatus, assignedTo)

    router.refresh()
  }

  // CHUNK 2: Monitor displays MONITOR orders only (passed from page)
  // We double check the status here just in case local storage brings in others
  const monitorOrders = orders
    .filter((o) => o.status === 'MONITOR')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  return (
    <div className="min-h-screen bg-slate-900 p-4 text-white md:p-8">
      <header className="mb-8 flex items-center justify-between border-b border-slate-700 pb-6">
        <h1 className="text-4xl font-black tracking-tight">
          🔪 MONITOR: PREP STATION
        </h1>
        <div className="rounded-full bg-slate-800 px-4 py-2 font-mono text-xl text-slate-400">
          {monitorOrders.length} Active
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {monitorOrders.map((order) => (
          <div
            key={order.id}
            onClick={() => setEditingOrder(order)}
            onDoubleClick={(e) => {
              e.stopPropagation()
              setEditingOrder(null)
              setDetailsOrder(order)
            }}
            className="cursor-pointer rounded-2xl border-2 border-slate-700 bg-slate-800 p-6 shadow-xl transition-all hover:border-slate-500 hover:shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between border-b-2 border-slate-700 pb-4">
              <h3 className="truncate text-3xl font-extrabold tracking-tight text-white">
                {order.customerSnapshot.name}
              </h3>
              <span className="rounded-lg bg-blue-900 px-3 py-1.5 text-sm font-black tracking-wider text-blue-200 uppercase">
                MONITOR
              </span>
            </div>

            <div className="space-y-6">
              {order.items.map((item, idx) => (
                <div key={idx} className="text-lg">
                  <div className="flex items-start justify-between">
                    <span className="text-xl font-bold text-slate-100">
                      {item.quantity || 1}x {item.name}
                    </span>
                    <span className="font-semibold whitespace-nowrap text-slate-400">
                      {item.size}
                    </span>
                  </div>

                  <div className="mt-1 pl-6 text-base text-slate-300">
                    <div className="font-medium">{item.crust}</div>
                    {item.toppings && item.toppings.length > 0 && (
                      <div className="mt-1 leading-relaxed text-slate-400">
                        {item.toppings.join(', ')}
                      </div>
                    )}
                  </div>

                  {item.notes && (
                    <div className="mt-3 rounded-lg border border-amber-900/50 bg-amber-900/40 px-3 py-2 text-base font-bold text-amber-400">
                      NOTE: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t-2 border-slate-700 pt-4 text-sm font-medium text-slate-400">
              <span className="font-mono text-base">
                {new Date(order.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {order.assignedTo && (
                <span className="flex items-center gap-2 rounded-full bg-slate-700/50 px-3 py-1 text-slate-300">
                  👨‍🍳 {order.assignedTo}
                </span>
              )}
            </div>
          </div>
        ))}

        {monitorOrders.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500">
            No orders in Monitor
          </div>
        )}
      </div>

      {/* EDIT MODAL (Single Click) */}
      <OrderEditModal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        order={editingOrder}
        viewContext="MONITOR"
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
