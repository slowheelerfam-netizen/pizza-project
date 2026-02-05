'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { demoStorage } from '../lib/demoStorage'

import { generateLabelText } from '../utils/receiptPrinter'

export default function ChefDisplay({
  initialOrders,
  employees = [],
  updateStatusAction,
}) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [mergedEmployees, setMergedEmployees] = useState(employees)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [assignmentMap, setAssignmentMap] = useState({}) // Local state for assignments in modal

  // Sync with server props when they change (due to polling)
  useEffect(() => {
    // Merge server orders with local storage orders
    const localOrders = demoStorage.getOrders()
    const orderMap = new Map()
    initialOrders.forEach((o) => orderMap.set(o.id, o))
    localOrders.forEach((o) => orderMap.set(o.id, o))
    setOrders(Array.from(orderMap.values()))

    // Merge server employees with local storage employees
    const localEmployees = demoStorage.getEmployees()
    const employeeMap = new Map()
    employees.forEach((e) => employeeMap.set(e.id, e))
    localEmployees.forEach((e) => employeeMap.set(e.id, e))
    setMergedEmployees(Array.from(employeeMap.values()))
  }, [initialOrders, employees])

  // Poll for updates every 2 seconds
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

    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null)
    }

    // TRIGGER PRINT IF STATUS IS OVEN
    if (newStatus === 'OVEN') {
      const orderToPrint = orders.find((o) => o.id === orderId)
      if (orderToPrint) {
        console.log('\n--- [PHYSICAL LABEL PRINT START] ---')
        console.log(generateLabelText(orderToPrint))
        console.log('--- [PHYSICAL LABEL PRINT END] ---\n')
      }
    }

    const result = await updateStatusAction(orderId, newStatus, assignedTo)

    // Fallback: Update Local Storage if server action fails
    if (result && !result.success) {
      demoStorage.updateOrderStatus(orderId, newStatus, assignedTo)
    } else {
      router.refresh()
    }
  }

  // 1. Split and Sort Orders
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
  const readyOrders = orders
    .filter((o) => o.status === 'READY')
    .sort((a, b) =>
      (a.customerSnapshot.name || '').localeCompare(
        b.customerSnapshot.name || ''
      )
    )

  // Dynamic Column Sizing
  const newFlex = Math.max(1, newOrders.length)
  const prepFlex = Math.max(1, prepOrders.length)
  const ovenFlex = Math.max(1, ovenOrders.length)
  const readyFlex = Math.max(1, readyOrders.length)

  const availableStaff = mergedEmployees.filter((e) => Boolean(e.isOnDuty))

  // Helper to render an order card (Minimal: Name + Status)
  const renderOrderCard = (order) => {
    let statusColor = 'bg-gray-100 text-gray-800'
    let statusLabel = 'NEW'

    // 3. Color Logic
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
        onClick={() => {
          setSelectedOrder(order)
          setAssignmentMap((prev) => ({
            ...prev,
            [order.id]: order.assignedTo || '',
          }))
        }}
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
    <div className="flex h-[calc(100vh-64px)] gap-6 bg-transparent p-6 transition-all duration-500">
      {/* COLUMN 1: NEW */}
      <div
        className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md transition-all duration-500"
        style={{ flex: newFlex }}
      >
        <div className="border-b border-white/10 bg-white/5 p-4">
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <span>🔔</span> NEW
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-sm font-medium text-blue-800">
              {newOrders.length}
            </span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {newOrders.map(renderOrderCard)}
          {newOrders.length === 0 && (
            <div className="py-12 text-center text-gray-400">No new orders</div>
          )}
        </div>
      </div>

      {/* COLUMN 2: PREP */}
      <div
        className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md transition-all duration-500"
        style={{ flex: prepFlex }}
      >
        <div className="border-b border-white/10 bg-white/5 p-4">
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <span>🔪</span> PREP
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-sm font-medium text-indigo-800">
              {prepOrders.length}
            </span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {prepOrders.map(renderOrderCard)}
          {prepOrders.length === 0 && (
            <div className="py-12 text-center text-gray-400">Prep is clear</div>
          )}
        </div>
      </div>

      {/* COLUMN 3: OVEN */}
      <div
        className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md transition-all duration-500"
        style={{ flex: ovenFlex }}
      >
        <div className="border-b border-white/10 bg-white/5 p-4">
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <span>🔥</span> OVEN
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-sm font-medium text-orange-800">
              {ovenOrders.length}
            </span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {ovenOrders.map(renderOrderCard)}
          {ovenOrders.length === 0 && (
            <div className="py-12 text-center text-gray-400">Oven is empty</div>
          )}
        </div>
      </div>

      {/* COLUMN 4: READY */}
      <div
        className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md transition-all duration-500"
        style={{ flex: readyFlex }}
      >
        <div className="border-b border-white/10 bg-white/5 p-4">
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <span>✅</span> READY
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-sm font-medium text-green-800">
              {readyOrders.length}
            </span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {readyOrders.map(renderOrderCard)}
          {readyOrders.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              No ready orders
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
              {/* Employee Assignment Selector (Only for NEW orders) */}
              {['NEW', 'CONFIRMED'].includes(selectedOrder.status) && (
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
                    className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-inner ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
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
              )}

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
              {/* 2. Button Logic in Modal (Status-Driven) */}
              {(() => {
                // NEW: Assign & Start Prep
                if (['NEW', 'CONFIRMED'].includes(selectedOrder.status)) {
                  return (
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
                      {assignmentMap[selectedOrder.id]
                        ? `ASSIGN TO ${assignmentMap[selectedOrder.id]} & START PREP`
                        : 'START PREP'}
                    </button>
                  )
                }

                // PREP: Advance to Oven
                if (selectedOrder.status === 'IN_PREP') {
                  return (
                    <button
                      onClick={() =>
                        handleStatusUpdate(
                          selectedOrder.id,
                          'OVEN',
                          selectedOrder.assignedTo
                        )
                      }
                      className="w-full rounded-xl bg-orange-500 py-4 text-xl font-bold text-white shadow-lg transition-all hover:bg-orange-400 active:scale-95"
                    >
                      ADVANCE TO OVEN 🔥
                    </button>
                  )
                }

                // OVEN / READY: No Actions allowed for Chef
                return (
                  <div className="text-center font-medium text-gray-500">
                    {selectedOrder.status === 'OVEN'
                      ? 'Order is in Oven. Waiting for Expo to mark Ready.'
                      : 'Order is Ready. No further actions.'}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
