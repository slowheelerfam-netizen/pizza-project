'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OrderEditModal from './OrderEditModal'
import OrderDetailsModal from './OrderDetailsModal'
import { ORDER_STATUS } from '../types/models'
import OrderCard from './OrderCard'

export default function AdminDashboard({
  orders: initialOrders,
  employees = [],
  viewContext = 'ADMIN',
}) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)

  const [editingOrder, setEditingOrder] = useState(null)
  const [detailsOrder, setDetailsOrder] = useState(null)

  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  useEffect(() => {
    if (viewContext === 'REGISTER') return

    const interval = setInterval(() => {
      router.refresh()
    }, 2000)

    return () => clearInterval(interval)
  }, [router, viewContext])

  const handleStatusUpdateAdapter = async (orderId, newStatus, assignedTo) => {
    if (viewContext === 'REGISTER') return

    await fetch('/api/admin/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        status: newStatus,
        reason: 'Standard Progression',
        comment: 'Admin Action',
        assignedTo,
        explicitOverride: true,
      }),
    })

    router.refresh()
  }

  const newOrders = orders
    .filter((o) => o.status === ORDER_STATUS.NEW)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const monitorOrders = orders
    .filter((o) => o.status === ORDER_STATUS.MONITOR)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const ovenOrders = orders
    .filter((o) => o.status === ORDER_STATUS.OVEN)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const readyOrders = orders
    .filter((o) => o.status === ORDER_STATUS.READY)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col space-y-4 bg-slate-100 p-4">
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <Column
          title="👨‍🍳 Prep"
          count={newOrders.length + monitorOrders.length}
          headerColor="bg-yellow-50"
          titleColor="text-yellow-900"
        >
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

          {monitorOrders.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-black tracking-wider text-indigo-600 uppercase">
                In Prep ({monitorOrders.length})
              </h3>
              {monitorOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => setEditingOrder(order)}
                />
              ))}
            </div>
          )}

          {newOrders.length === 0 && monitorOrders.length === 0 && (
            <div className="py-10 text-center text-gray-400">
              No orders in Prep
            </div>
          )}
        </Column>

        <Column
          title="🔥 Oven"
          count={ovenOrders.length}
          headerColor="bg-orange-50"
          titleColor="text-orange-900"
        >
          {ovenOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => setEditingOrder(order)}
            />
          ))}
        </Column>

        <Column
          title="✅ Ready"
          count={readyOrders.length}
          headerColor="bg-green-50"
          titleColor="text-green-900"
        >
          {readyOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => setEditingOrder(order)}
            />
          ))}
        </Column>
      </div>

      {viewContext !== 'REGISTER' && (
        <OrderEditModal
          isOpen={!!editingOrder}
          order={editingOrder}
          viewContext={viewContext}
          employees={employees}
          onStatusUpdate={handleStatusUpdateAdapter}
          onClose={() => setEditingOrder(null)}
        />
      )}

      <OrderDetailsModal
        isOpen={!!detailsOrder}
        order={detailsOrder}
        onClose={() => setDetailsOrder(null)}
      />
    </div>
  )
}

function Column({
  title,
  count,
  children,
  headerColor = 'bg-white',
  titleColor = 'text-gray-900',
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div
        className={`border-b border-gray-100 p-4 ${headerColor} rounded-t-2xl`}
      >
        <h3
          className={`flex items-center gap-2 text-lg font-black ${titleColor}`}
        >
          <span>{title}</span>
          <span className="rounded-full bg-white/50 px-2 py-0.5 text-sm font-bold shadow-sm">
            {count}
          </span>
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">{children}</div>
    </div>
  )
}
