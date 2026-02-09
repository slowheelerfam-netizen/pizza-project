'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { demoStorage } from '../lib/demoStorage'
import { ORDER_STATUS } from '../types/models'
import { updateOrderDetailsAction } from '../app/actions'
import OrderEditModal from './OrderEditModal'
import React from 'react'

export default function AdminDashboard({ orders: initialOrders }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)

  const [loading, setLoading] = useState(null)
  const [overrideOrder, setOverrideOrder] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set())
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')

  const handleMakePriority = async (orderId) => {
    setLoading(orderId)
    // Make it 24 hours older to ensure it's at the top of the list
    const priorityTime = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString()

    const result = await updateOrderDetailsAction(orderId, {
      createdAt: priorityTime,
    })

    if (result && result.success) {
      // Update local storage
      const order = orders.find((o) => o.id === orderId)
      if (order) {
        demoStorage.saveOrder({ ...order, createdAt: priorityTime })
      }
      router.refresh()
    }

    setLoading(null)
    setSelectedOrder(null)
  }

  // ... (rest of the component)

  const toggleExpand = (orderId) => {
    const nextIds = new Set(expandedOrderIds)
    nextIds.has(orderId) ? nextIds.delete(orderId) : nextIds.add(orderId)
    setExpandedOrderIds(nextIds)
  }

  React.useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 2000)
    return () => clearInterval(interval)
  }, [router])

  useEffect(() => {
    const localOrders = demoStorage.getOrders()
    const orderMap = new Map()

    initialOrders.forEach((o) => orderMap.set(o.id, o))

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

  async function handleOverride(orderId, status, reason, comment) {
    setLoading(orderId)

    const orderToUpdate = orders.find((o) => o.id === orderId)

    await fetch('/api/admin/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        newStatus: status,
        reason,
        comment,
      }),
    })

    if (orderToUpdate) {
      demoStorage.saveOrder({
        ...orderToUpdate,
        status,
        updatedAt: new Date().toISOString(),
      })
    }

    setOrders((currentOrders) =>
      currentOrders.map((o) =>
        o.id === orderId
          ? { ...o, status, updatedAt: new Date().toISOString() }
          : o
      )
    )

    router.refresh()

    setLoading(null)
    setOverrideOrder(null)
    setReason('')
    setComment('')
  }

  const newOrders = orders
    .filter((o) => ['NEW', 'CONFIRMED'].includes(o.status))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const prepOrders = orders
    .filter((o) => o.status === 'IN_PREP')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const ovenOrders = orders
    .filter((o) => o.status === 'OVEN')
    .sort((a, b) =>
      (a.customerSnapshot.name || '').localeCompare(
        b.customerSnapshot.name || ''
      )
    )

  const readyOrders = orders
    .filter((o) => o.status === 'READY')
    .sort((a, b) =>
      (a.customerSnapshot.name || '').localeCompare(
        b.customerSnapshot.name || ''
      )
    )

  const renderOrderCard = (order) => {
    let statusColor = 'bg-white/10 text-white/70'
    let statusLabel = 'NEW'

    if (order.status === 'IN_PREP') {
      statusColor = 'bg-blue-500/20 text-blue-200'
      statusLabel = 'PREP'
    } else if (order.status === 'OVEN') {
      statusColor = 'bg-orange-500/20 text-orange-200'
      statusLabel = 'OVEN'
    } else if (order.status === 'READY') {
      statusColor = 'bg-green-500/20 text-green-200'
      statusLabel = 'READY'
    } else if (order.status === 'COMPLETED') {
      statusColor = 'bg-gray-500/20 text-gray-200'
      statusLabel = 'DONE'
    }

    return (
      <div
        key={order.id}
        onClick={() => {
          setSelectedOrder(order)
          setComment('')
        }}
        className={`mb-1.5 cursor-pointer rounded-lg border p-2 shadow-lg backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-xl ${
          selectedOrder?.id === order.id
            ? 'border-indigo-500 bg-indigo-500/20 ring-1 ring-indigo-500/50'
            : 'border-white/10 bg-white/5 hover:bg-white/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="truncate font-bold text-white">
            {order.customerSnapshot.name || 'Walk-in'}
          </span>

          <div className="flex items-center gap-2">
            {order.isDemo && (
              <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                DEMO
              </span>
            )}
            <span
              className={`rounded-lg px-2 py-0.5 text-xs font-bold ${statusColor}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col space-y-4">
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-4">
        {/* New Orders */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-md">
          <div className="border-b border-white/10 bg-white/5 p-3">
            <h3 className="flex items-center gap-2 font-bold text-white">
              <span>🔔</span> New
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-200">
                {newOrders.length}
              </span>
            </h3>
          </div>
          <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 flex-1 overflow-y-auto p-3">
            {newOrders.map(renderOrderCard)}
          </div>
        </div>

        {/* Prep */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-md">
          <div className="border-b border-white/10 bg-white/5 p-3">
            <h3 className="flex items-center gap-2 font-bold text-white">
              <span>👨‍🍳</span> Prep
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-200">
                {prepOrders.length}
              </span>
            </h3>
          </div>
          <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 flex-1 overflow-y-auto p-3">
            {prepOrders.map(renderOrderCard)}
          </div>
        </div>

        {/* Oven */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-md">
          <div className="border-b border-white/10 bg-white/5 p-3">
            <h3 className="flex items-center gap-2 font-bold text-white">
              <span>🔥</span> Oven
              <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-200">
                {ovenOrders.length}
              </span>
            </h3>
          </div>
          <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 flex-1 overflow-y-auto p-3">
            {ovenOrders.map(renderOrderCard)}
          </div>
        </div>

        {/* Ready */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-md">
          <div className="border-b border-white/10 bg-white/5 p-3">
            <h3 className="flex items-center gap-2 font-bold text-white">
              <span>✅</span> Ready
              <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-200">
                {readyOrders.length}
              </span>
            </h3>
          </div>
          <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 flex-1 overflow-y-auto p-3">
            {readyOrders.map(renderOrderCard)}
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedOrder.customerSnapshot.name}
                </h2>
                <p className="text-gray-500">
                  Order #{selectedOrder.displayId}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between rounded-lg bg-gray-50 p-4"
                  >
                    <div>
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.size} • {item.crust}
                      </p>
                      {item.toppings?.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {item.toppings.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="font-bold text-gray-900">Register Actions</h3>

                {/* Actions for NEW orders */}
                {['NEW', 'CONFIRMED'].includes(selectedOrder.status) ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-100"
                    >
                      ✏️ Edit Order
                    </button>

                    <button
                      onClick={() => handleMakePriority(selectedOrder.id)}
                      disabled={loading === selectedOrder.id}
                      className="rounded-lg bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-600 hover:bg-yellow-100"
                    >
                      ⭐ Make Priority
                    </button>

                    <button
                      onClick={() =>
                        handleOverride(
                          selectedOrder.id,
                          'IN_PREP',
                          'Standard Progression',
                          'Register Action'
                        )
                      }
                      disabled={loading === selectedOrder.id}
                      className="col-span-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700"
                    >
                      Move to PREP
                    </button>
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 p-4 text-center text-gray-500">
                    Order is in {selectedOrder.status}. No actions available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <OrderEditModal
        isOpen={isEditModalOpen}
        order={selectedOrder}
        onClose={() => setIsEditModalOpen(false)}
        onSave={() => {
          setIsEditModalOpen(false)
          router.refresh()
        }}
        onDelete={() => {
          setIsEditModalOpen(false)
          setSelectedOrder(null)
          router.refresh()
        }}
      />
    </div>
  )
}
