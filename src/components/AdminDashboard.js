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

  // Poll for updates every 10 seconds to keep dashboard live
  React.useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 10000)
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

  return (
    <div className="space-y-8">
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

      {/* ===== Orders Queue ===== */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Active Orders</h2>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            {showLogs ? 'Hide Logs' : 'Show Logs & Warnings'}
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No active orders
            </div>
          ) : (
            orders.map((order) => {
              const isExpanded = expandedOrderIds.has(order.id)
              return (
                <div
                  key={order.id}
                  className="bg-white transition-colors hover:bg-gray-50"
                >
                  {/* Summary Row */}
                  <div
                    className="flex cursor-pointer items-center justify-between p-4"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-white ${
                          order.status === 'NEW'
                            ? 'bg-blue-500'
                            : order.status === 'CONFIRMED'
                              ? 'bg-yellow-500'
                              : order.status === 'IN_PREP'
                                ? 'bg-orange-500'
                                : 'bg-green-500'
                        }`}
                      >
                        {order.displayId}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {order.customerSnapshot.name || 'Walk-in'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {order.type} • {order.items.length} items
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          order.status === 'NEW'
                            ? 'bg-blue-100 text-blue-700'
                            : order.status === 'CONFIRMED'
                              ? 'bg-yellow-100 text-yellow-700'
                              : order.status === 'IN_PREP'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {order.status}
                      </span>
                      <svg
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-4 pl-16">
                      <div className="mb-4 space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex gap-2 text-sm text-gray-800"
                          >
                            <span className="font-bold">1x</span>
                            <span>
                              {item.name} ({item.size}) - {item.crust}{' '}
                              {item.toppings.length > 0 &&
                                `with ${item.toppings.join(', ')}`}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingOrder(order)
                          }}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Edit Order
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOverrideOrder(order)
                          }}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                        >
                          Delete Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {showLogs && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500">
          System Logs & Warnings are currently hidden to simplify the view.
        </div>
      )}
    </div>
  )
}
