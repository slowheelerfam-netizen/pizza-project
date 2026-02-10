'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { demoStorage } from '../lib/demoStorage'
import { updateOrderDetailsAction } from '../app/actions'
import OrderEditModal from './OrderEditModal'
import OrderDetailsModal from './OrderDetailsModal'
import React from 'react'

export default function AdminDashboard({ orders: initialOrders }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)

  const [loading, setLoading] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)
  const [detailsOrder, setDetailsOrder] = useState(null)
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set())
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')

  const handlePriorityToggle = async (orderId, isPriority) => {
    setLoading(orderId)

    const newCreatedAt = isPriority
      ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      : new Date().toISOString()

    const result = await updateOrderDetailsAction(orderId, {
      createdAt: newCreatedAt,
      isPriority,
    })

    if (result && result.success) {
      const order = orders.find((o) => o.id === orderId)
      if (order) {
        demoStorage.saveOrder({
          ...order,
          createdAt: newCreatedAt,
          isPriority,
        })
      }
      router.refresh()
    }

    setLoading(null)
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

    setOrders(Array.from(orderMap.values()))
  }, [initialOrders])

  async function handleOverride(orderId, status, reason, comment) {
    setLoading(orderId)

    const orderToUpdate = orders.find((o) => o.id === orderId)

    await fetch('/api/admin/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        status,
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
    setReason('')
    setComment('')
  }

  const handleStatusUpdateAdapter = (orderId, newStatus) => {
    return handleOverride(
      orderId,
      newStatus,
      'Standard Progression',
      'Register Action'
    )
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

  const handleSingleClick = (order) => {
    if (order.assumeChefRole) {
      setEditingOrder(order)
    } else {
      setDetailsOrder(order)
    }
  }

  const handleDoubleClick = (e, order) => {
    e.stopPropagation()
    setEditingOrder(null)
    setDetailsOrder(order)
  }

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
        onClick={() => handleSingleClick(order)}
        onDoubleClick={(e) => handleDoubleClick(e, order)}
        className={`mb-1.5 cursor-pointer rounded-lg border p-2 shadow-lg backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-xl ${
          editingOrder?.id === order.id
            ? 'border-indigo-500 bg-indigo-500/20 ring-1 ring-indigo-500/50'
            : 'border-white/10 bg-white/5 hover:bg-white/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="truncate font-bold text-white">
            {order.customerSnapshot.name || 'Walk-in'}
          </span>

          <span
            className={`rounded-lg px-2 py-0.5 text-xs font-bold ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col space-y-4">
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-4">
        <Column title="🔔 New" count={newOrders.length}>
          {newOrders.map(renderOrderCard)}
        </Column>

        <Column title="👨‍🍳 Prep" count={prepOrders.length}>
          {prepOrders.map(renderOrderCard)}
        </Column>

        <Column title="🔥 Oven" count={ovenOrders.length}>
          {ovenOrders.map(renderOrderCard)}
        </Column>

        <Column title="✅ Ready" count={readyOrders.length}>
          {readyOrders.map(renderOrderCard)}
        </Column>
      </div>

      <OrderEditModal
        isOpen={!!editingOrder}
        order={editingOrder}
        viewContext="REGISTER"
        onStatusUpdate={handleStatusUpdateAdapter}
        onPriorityToggle={handlePriorityToggle}
        onClose={() => setEditingOrder(null)}
        onSave={() => {
          setEditingOrder(null)
          router.refresh()
        }}
        onDelete={() => {
          setEditingOrder(null)
          router.refresh()
        }}
      />

      <OrderDetailsModal
        isOpen={!!detailsOrder}
        order={detailsOrder}
        onClose={() => setDetailsOrder(null)}
      />
    </div>
  )
}

function Column({ title, count, children }) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-md">
      <div className="border-b border-white/10 bg-white/5 p-3">
        <h3 className="flex items-center gap-2 font-bold text-white">
          <span>{title}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
            {count}
          </span>
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3">{children}</div>
    </div>
  )
}
