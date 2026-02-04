'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ChefDisplay({
  initialOrders,
  employees = [],
  updateStatusAction,
}) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [assignmentMap, setAssignmentMap] = useState({}) // Local state for assignments in modal

  // Sync with server props when they change (due to polling)
  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 10000)
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

    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null)
    }

    await updateStatusAction(orderId, newStatus, assignedTo)
    router.refresh()
  }

  const allOrders = orders
    .filter((o) =>
      ['NEW', 'CONFIRMED', 'IN_PREP', 'OVEN', 'READY'].includes(o.status)
    )
    .sort((a, b) => {
      // Sort by status priority then by time
      const statusPriority = {
        NEW: 1,
        CONFIRMED: 1,
        IN_PREP: 2,
        OVEN: 3,
        READY: 4,
        COMPLETED: 5,
      }
      if (statusPriority[a.status] !== statusPriority[b.status]) {
        return statusPriority[a.status] - statusPriority[b.status]
      }
      return new Date(a.createdAt) - new Date(b.createdAt)
    })

  // Filter only on-duty employees for assignment, or show all?
  // Better to show all but maybe group them. For now, just all employees.
  // Actually, user said "assign duties to the employees... assignments: Front Counter, Chef, Cook".
  // Probably only Chefs and Cooks should be assigned to orders?
  // Let's just show all for flexibility.
  const availableStaff = employees.filter((e) => Boolean(e.isOnDuty))

  // Dashboard View
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* FULL WIDTH LIST */}
      <div className="w-full overflow-y-auto bg-white">
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white p-4">
          <h2 className="text-xl font-bold text-gray-900">
            Active Orders ({allOrders.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {allOrders.map((order) => {
            let statusColor = 'bg-gray-100 text-gray-800'
            let statusLabel = 'NEW'
            let nextAction = 'START PREP 🔪'
            let nextStatus = 'IN_PREP'

            if (order.status === 'IN_PREP') {
              statusColor = 'bg-blue-100 text-blue-800'
              statusLabel = 'PREP'
              nextAction = 'ADVANCE TO OVEN 🔥'
              nextStatus = 'OVEN'
            } else if (order.status === 'OVEN') {
              statusColor = 'bg-orange-100 text-orange-800'
              statusLabel = 'OVEN'
              nextAction = 'MARK READY ✅'
              nextStatus = 'READY'
            } else if (order.status === 'READY') {
              statusColor = 'bg-green-100 text-green-800'
              statusLabel = 'READY'
              nextAction = 'CLOSE OUT 🏁'
              nextStatus = 'COMPLETED'
            }

            return (
              <div
                key={order.id}
                className={`p-4 transition-colors hover:bg-gray-50 ${
                  selectedOrder?.id === order.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                    {order.displayId}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-gray-900">
                      {order.customerSnapshot.name || 'Walk-in'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                      <p className="text-sm text-gray-500">
                        {order.items.length} items •{' '}
                        {Math.floor(
                          (new Date() - new Date(order.createdAt)) / 60000
                        )}
                        m ago
                      </p>
                      {order.assignedTo && (
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                          👤 {order.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order)
                        setAssignmentMap((prev) => ({
                          ...prev,
                          [order.id]: order.assignedTo || '',
                        }))
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      View Details
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStatusUpdate(order.id, nextStatus)
                      }}
                      className={`min-w-[180px] rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition-all active:scale-95 ${
                        nextStatus === 'IN_PREP'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : nextStatus === 'OVEN'
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : nextStatus === 'READY'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-gray-800 hover:bg-gray-900'
                      }`}
                    >
                      {nextAction}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {allOrders.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No active orders
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                  {selectedOrder.displayId}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedOrder.customerSnapshot.name}
                  </h2>
                  <p className="text-gray-500">{selectedOrder.type}</p>
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

            <div className="flex-1 overflow-y-auto p-6">
              {/* Employee Assignment Selector */}
              <div className="mb-6 rounded-lg bg-indigo-50 p-4">
                <label className="mb-2 block text-sm font-bold text-indigo-900">
                  Assign Chef / Cook
                </label>
                <select
                  value={assignmentMap[selectedOrder.id] || ''}
                  onChange={(e) => {
                    const newAssignee = e.target.value
                    setAssignmentMap((prev) => ({
                      ...prev,
                      [selectedOrder.id]: newAssignee,
                    }))
                  }}
                  className="w-full rounded-lg border border-indigo-200 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="">-- Select Staff --</option>
                  {availableStaff.length === 0 && (
                    <option disabled>No staff currently on duty</option>
                  )}
                  {availableStaff.map((emp) => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-6">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {item.name}
                        </h3>
                        <p className="text-sm font-medium text-gray-600">
                          {item.size} • {item.crust}
                        </p>
                        <div className="mt-2">
                          <span className="text-xs font-bold tracking-wide text-gray-500 uppercase">
                            Toppings
                          </span>
                          <p className="text-lg text-gray-800">
                            {item.toppings}
                          </p>
                        </div>
                      </div>
                    </div>
                    {item.notes && (
                      <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-700">
                        NOTE: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 p-6">
              <button
                onClick={() =>
                  handleStatusUpdate(
                    selectedOrder.id,
                    'IN_PREP',
                    assignmentMap[selectedOrder.id]
                  )
                }
                className="w-full rounded-xl bg-indigo-600 py-4 text-xl font-bold text-white shadow-lg transition-all hover:bg-indigo-500 active:scale-95"
              >
                ADVANCE TO OVEN 🔥
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
