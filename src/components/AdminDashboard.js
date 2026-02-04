'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ORDER_STATUS } from '../types/models'
import { OVERRIDE_REASONS } from '../types/adminOverrideReasons'
import OrderEditModal from './OrderEditModal'
import React from 'react'

export default function AdminDashboard({ orders }) {
  const router = useRouter()
  const [loading, setLoading] = useState(null)
  const [overrideOrder, setOverrideOrder] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  // Support multiple expanded rows
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set())
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')

  // Toggle visibility for Logs
  const [showLogs, setShowLogs] = useState(false)

  // Auto-expand/collapse logic removed for default collapsed view
  // const prevStatusesRef = React.useRef(new Map())

  // React.useEffect(() => {
  //   // Logic removed to keep orders collapsed by default
  // }, [orders])

  const toggleExpand = (orderId) => {
    const nextIds = new Set(expandedOrderIds)
    if (nextIds.has(orderId)) {
      nextIds.delete(orderId)
    } else {
      nextIds.add(orderId)
    }
    setExpandedOrderIds(nextIds)
  }

  // Poll for updates every 2 seconds to keep dashboard live
  React.useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 2000)
    return () => clearInterval(interval)
  }, [router])

  async function handleOverride(orderId, status, reason, comment) {
    setLoading(orderId)
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
    setLoading(null)
    setOverrideOrder(null)
    setReason('')
    setComment('')
  }

  // --- Sorting & Grouping Logic ---
  // COLUMN 1: NEW (Sort: Time Entered - Oldest First)
  const newOrders = orders
    .filter((o) => ['NEW', 'CONFIRMED'].includes(o.status))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  // COLUMN 2: PREP (Sort: Time Entered - Oldest First)
  const prepOrders = orders
    .filter((o) => o.status === 'IN_PREP')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  // COLUMN 3: OVEN (Sort: Name - A to Z)
  const ovenOrders = orders
    .filter((o) => o.status === 'OVEN')
    .sort((a, b) =>
      (a.customerSnapshot.name || '').localeCompare(
        b.customerSnapshot.name || ''
      )
    )

  // COLUMN 4: READY (Sort: Name - A to Z)
  // Also including COMPLETED/CANCELLED for Admin visibility
  const readyOrders = orders
    .filter((o) => ['READY', 'COMPLETED', 'CANCELLED'].includes(o.status))
    .sort((a, b) =>
      (a.customerSnapshot.name || '').localeCompare(
        b.customerSnapshot.name || ''
      )
    )

  // Calculate dynamic flex basis (ensure at least 1)
  const newFlex = Math.max(1, newOrders.length)
  const prepFlex = Math.max(1, prepOrders.length)
  const ovenFlex = Math.max(1, ovenOrders.length)
  const readyFlex = Math.max(1, readyOrders.length)

  // Helper to render an order card (Minimal: Name + Status)
  const renderOrderCard = (order) => {
    let statusColor = 'bg-gray-100 text-gray-800'
    let statusLabel = 'NEW'

    if (order.status === 'IN_PREP') {
      statusColor = 'bg-blue-100 text-blue-800'
      statusLabel = 'PREP'
    } else if (order.status === 'OVEN') {
      statusColor = 'bg-orange-100 text-orange-800'
      statusLabel = 'OVEN'
    } else if (order.status === 'READY') {
      statusColor = 'bg-green-100 text-green-800'
      statusLabel = 'READY'
    }

    return (
      <div
        key={order.id}
        onClick={() => setSelectedOrder(order)}
        className={`mb-2 cursor-pointer rounded-lg border p-3 shadow-sm transition-all hover:shadow-md ${
          selectedOrder?.id === order.id
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="truncate font-bold text-gray-900">
            {order.customerSnapshot.name || 'Walk-in'}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col space-y-4">
      {/* ===== Detail Modal (Chunk 4) ===== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedOrder.customerSnapshot.name}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    {new Date(selectedOrder.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span>•</span>
                  <span className="font-bold">{selectedOrder.status}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-6 max-h-[60vh] space-y-4 overflow-y-auto">
              {selectedOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.size} • {item.crust}
                      </p>
                      {item.toppings.length > 0 && (
                        <p className="mt-1 text-sm text-gray-800">
                          {item.toppings.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
              <button
                onClick={() => {
                  setSelectedOrder(null)
                  setEditingOrder(selectedOrder)
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setSelectedOrder(null)
                  setOverrideOrder(selectedOrder)
                }}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Edit Order Modal ===== */}
      <OrderEditModal
        order={editingOrder}
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
      />

      {/* ===== Delete / Override Modal ===== */}
      {overrideOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-red-600">
              Delete Order #{overrideOrder.id.slice(0, 8)}
            </h3>
            <p className="mb-6 text-sm font-medium text-gray-900">
              Are you sure you want to delete this order? This action cannot be
              undone. The order status will be set to{' '}
              <strong className="text-red-600">CANCELLED</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-900">
                  Reason for Deletion
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 p-2.5 font-medium text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="">Select reason</option>
                  {Object.values(OVERRIDE_REASONS).map((r) => (
                    <option key={r} value={r}>
                      {r.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-900">
                  Comment {reason === 'OTHER' && '(required)'}
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 p-2.5 font-medium text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add details..."
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                disabled={
                  !reason ||
                  (reason === 'OTHER' && !comment) ||
                  loading === overrideOrder.id
                }
                onClick={() =>
                  handleOverride(
                    overrideOrder.id,
                    ORDER_STATUS.CANCELLED,
                    reason,
                    comment
                  )
                }
              >
                {loading === overrideOrder.id
                  ? 'Deleting...'
                  : 'Confirm Delete'}
              </button>

              <button
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setOverrideOrder(null)
                  setReason('')
                  setComment('')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 4-COLUMN DYNAMIC LAYOUT ===== */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* COLUMN 1: NEW */}
        <div
          className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-500"
          style={{ flex: newFlex }}
        >
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">New</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {newOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No new orders</div>
            ) : (
              newOrders.map(renderOrderCard)
            )}
          </div>
        </div>

        {/* COLUMN 2: PREP */}
        <div
          className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-500"
          style={{ flex: prepFlex }}
        >
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">Prep</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {prepOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Prep is clear</div>
            ) : (
              prepOrders.map(renderOrderCard)
            )}
          </div>
        </div>

        {/* COLUMN 3: OVEN */}
        <div
          className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-500"
          style={{ flex: ovenFlex }}
        >
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">Oven</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {ovenOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Oven is empty</div>
            ) : (
              ovenOrders.map(renderOrderCard)
            )}
          </div>
        </div>

        {/* COLUMN 4: READY */}
        <div
          className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-500"
          style={{ flex: readyFlex }}
        >
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">Ready & Done</h2>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              {showLogs ? 'Hide Logs' : 'Show Logs'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {readyOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No active/past orders
              </div>
            ) : (
              readyOrders.map(renderOrderCard)
            )}
          </div>
        </div>
      </div>

      {showLogs && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500">
          System Logs & Warnings are currently hidden.
        </div>
      )}
    </div>
  )
}
