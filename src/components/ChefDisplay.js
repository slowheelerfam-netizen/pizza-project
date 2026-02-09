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
  const [isAssignmentEnabled, setIsAssignmentEnabled] = useState(true)
  const [shouldPrint, setShouldPrint] = useState(false)

  // Sync with server props when they change (due to polling)
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
        // If not on server, trust local
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
    // Merge server employees with local storage employees
    const localEmployees = demoStorage.getEmployees()
    const employeeMap = new Map()
    employees.forEach((e) => employeeMap.set(e.id, e))
    localEmployees.forEach((e) => employeeMap.set(e.id, e))

    setTimeout(() => {
      setOrders(Array.from(orderMap.values()))
      setMergedEmployees(Array.from(employeeMap.values()))
    }, 0)
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

    // TRIGGER PRINT IF CHECKED
    if (shouldPrint) {
      const orderToPrint = orders.find((o) => o.id === orderId)
      if (orderToPrint) {
        console.log('\n--- [PHYSICAL LABEL PRINT START] ---')
        console.log(generateLabelText(orderToPrint))
        console.log('--- [PHYSICAL LABEL PRINT END] ---\n')
      }
    }

    const result = await updateStatusAction(orderId, newStatus, assignedTo)

    // ALWAYS update Local Storage to keep it in sync as a mirror
    demoStorage.updateOrderStatus(orderId, newStatus, assignedTo)

    if (!result || result.success) {
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

  // Column Sizing (Fixed Grid)
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
        <div className="flex flex-col gap-1">
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
          {order.customerSnapshot.isWalkIn && (
            <span className="self-start rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-purple-700 uppercase">
              Walk In
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col p-6">
      {/* Header Controls */}
      <div className="mb-4 flex items-center justify-start">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white/20">
          <input
            type="checkbox"
            checked={isAssignmentEnabled}
            onChange={(e) => setIsAssignmentEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Enable Staff Assignment
        </label>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-6">
        {/* COLUMN 1: NEW */}
        <div className="col-span-3 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md transition-all duration-500">
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
              <div className="py-12 text-center text-gray-400">
                No new orders
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: PREP */}
        <div className="col-span-3 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md transition-all duration-500">
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
              <div className="py-12 text-center text-gray-400">
                Prep is clear
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: OVEN */}
        <div className="col-span-3 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md transition-all duration-500">
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
              <div className="py-12 text-center text-gray-400">
                Oven is empty
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 4: READY */}
        <div className="col-span-3 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md transition-all duration-500">
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
              {/* Employee Assignment Selector (Only for NEW orders AND if Enabled) */}
              {['NEW', 'CONFIRMED'].includes(selectedOrder.status) &&
                isAssignmentEnabled && (
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
                          {item.size || 'Standard'} • {item.crust || 'Regular'}
                        </p>
                        {item.toppings && item.toppings.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-bold tracking-wide text-gray-500 uppercase">
                              Toppings
                            </span>
                            <p className="text-lg text-gray-800">
                              {item.toppings.join(', ')}
                            </p>
                          </div>
                        )}
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
              {/* Optional Print Checkbox */}
              <div className="mb-4 flex items-center justify-end">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={shouldPrint}
                    onChange={(e) => setShouldPrint(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Print Order Details
                </label>
              </div>

              {/* 2. Button Logic in Modal (Status-Driven) */}
              {(() => {
                // NEW: Assign & Start Prep
                if (['NEW', 'CONFIRMED'].includes(selectedOrder.status)) {
                  const isAssignable =
                    !isAssignmentEnabled || assignmentMap[selectedOrder.id]
                  return (
                    <button
                      onClick={() => {
                        if (!isAssignable) {
                          alert(
                            'Please select a staff member to assign this order.'
                          )
                          return
                        }
                        handleStatusUpdate(
                          selectedOrder.id,
                          'IN_PREP',
                          assignmentMap[selectedOrder.id]
                        )
                      }}
                      disabled={!isAssignable}
                      className={`w-full rounded-xl py-4 text-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                        isAssignable
                          ? 'bg-indigo-600 hover:bg-indigo-500'
                          : 'cursor-not-allowed bg-gray-400'
                      }`}
                    >
                      {assignmentMap[selectedOrder.id]
                        ? `ASSIGN TO ${assignmentMap[selectedOrder.id]} & START PREP`
                        : 'START PREP'}
                    </button>
                  )
                }

                // PREP or OVEN: Allow Advance to OVEN (if not there) or READY
                if (['IN_PREP', 'OVEN'].includes(selectedOrder.status)) {
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() =>
                          handleStatusUpdate(
                            selectedOrder.id,
                            'OVEN',
                            selectedOrder.assignedTo
                          )
                        }
                        disabled={selectedOrder.status === 'OVEN'}
                        className={`rounded-xl py-4 text-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                          selectedOrder.status === 'OVEN'
                            ? 'cursor-not-allowed bg-gray-300'
                            : 'bg-orange-500 hover:bg-orange-400'
                        }`}
                      >
                        ADVANCE TO OVEN 🔥
                      </button>

                      <button
                        onClick={() =>
                          handleStatusUpdate(
                            selectedOrder.id,
                            'READY',
                            selectedOrder.assignedTo
                          )
                        }
                        className="rounded-xl bg-green-600 py-4 text-xl font-bold text-white shadow-lg transition-all hover:bg-green-500 active:scale-95"
                      >
                        MARK READY ✅
                      </button>
                    </div>
                  )
                }

                // READY: No Actions allowed for Chef
                return (
                  <div className="text-center font-medium text-gray-500">
                    Order is Ready. No further actions.
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
