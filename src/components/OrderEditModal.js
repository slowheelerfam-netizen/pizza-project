'use client'

import { useState, useEffect } from 'react'
import { updateOrderDetailsAction } from '../app/actions'
import { MENU_ITEMS, PIZZA_SIZES, CRUST_TYPES } from '../types/models'

const generateId = () => Date.now()

export default function OrderEditModal({
  order,
  isOpen,
  onClose,
  viewContext = 'REGISTER', // 'REGISTER' | 'KITCHEN' | 'OVEN' | 'MONITOR'
  onStatusUpdate,
  onPriorityToggle,
  onPrint,
  employees = [],
}) {
  // ---- CORE STATE ----
  const [items, setItems] = useState([])
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderType, setOrderType] = useState('PICKUP')
  const [address, setAddress] = useState('')

  const [assignment, setAssignment] = useState('')
  const [shouldPrint, setShouldPrint] = useState(false)

  // ---- BUILDER STATE ----
  const [selectedPizza, setSelectedPizza] = useState(MENU_ITEMS[0])
  const [selectedSize, setSelectedSize] = useState(PIZZA_SIZES.MEDIUM)
  const [selectedCrust, setSelectedCrust] = useState(CRUST_TYPES.ORIGINAL)

  // ---- UI / SUBMISSION ----
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // ---- PRIORITY ----
  const [isPriority, setIsPriority] = useState(false)
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false)

  // ---- SYNC FROM ORDER ----
  useEffect(() => {
    if (!order || !isOpen) return

    setItems(Array.isArray(order.items) ? order.items : [])
    setCustomerName(order.customerSnapshot?.name || '')
    setCustomerPhone(order.customerSnapshot?.phone || '')
    setOrderType(order.customerSnapshot?.type || 'PICKUP')
    setAddress(order.customerSnapshot?.address || '')
    setAssignment(order.assignedTo || '')
    setIsPriority(Boolean(order.isPriority))
    setError(null)
  }, [order, isOpen])

  if (!isOpen) return null

  const cartTotal = items.reduce((sum, item) => sum + (item.price || 0), 0)

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append('customerName', customerName)
    formData.append('customerPhone', customerPhone)
    formData.append('type', orderType)
    formData.append('address', address)
    formData.append('items', JSON.stringify(items))
    formData.append('totalPrice', cartTotal.toString())

    const result = await updateOrderDetailsAction(order.id, formData)

    setIsSubmitting(false)

    if (result.success) onClose()
    else setError(result.message)
  }

  const handleWorkflowAction = async (newStatus, assignedToOverride = null) => {
    if (!onStatusUpdate) return
    if (shouldPrint && onPrint) onPrint(order)

    await onStatusUpdate(order.id, newStatus, assignedToOverride || assignment)
    onClose()
  }

  // ---------------- WORKFLOW ACTIONS ----------------
  const renderWorkflowActions = () => {
    // REGISTER
    if (viewContext === 'REGISTER') {
      if (['NEW', 'CONFIRMED'].includes(order.status)) {
        return (
          <div className="space-y-4 rounded-xl bg-blue-50 p-4">
            <h3 className="text-sm font-bold text-blue-900 uppercase">
              Register Actions
            </h3>

            <label className="flex items-center gap-3 rounded-lg border bg-white p-3">
              <input
                type="checkbox"
                checked={isPriority}
                disabled={isUpdatingPriority}
                onChange={async (e) => {
                  const v = e.target.checked
                  setIsPriority(v)
                  setIsUpdatingPriority(true)
                  await onPriorityToggle?.(order.id, v)
                  setIsUpdatingPriority(false)
                }}
                className="h-5 w-5 rounded border-red-500 text-red-600 focus:ring-red-500"
              />
              <span
                className={`text-lg font-black ${isPriority ? 'text-red-600' : 'text-gray-800'}`}
              >
                {isUpdatingPriority ? 'Saving...' : 'High Priority Order'}
              </span>
            </label>

            <button
              onClick={() => handleWorkflowAction('IN_PREP')}
              className="w-full rounded-lg bg-indigo-600 py-3 font-bold text-white"
            >
              Add to Prep 👨‍🍳
            </button>
          </div>
        )
      }

      return (
        <div className="rounded-xl bg-gray-50 p-4 text-center text-gray-500">
          Order is {order.status}. No actions.
        </div>
      )
    }

    // KITCHEN
    if (viewContext === 'KITCHEN') {
      if (['NEW', 'CONFIRMED'].includes(order.status)) {
        const available = employees.filter((e) => e.isOnDuty)

        return (
          <div className="space-y-4 rounded-xl bg-indigo-50 p-4">
            <select
              value={assignment}
              onChange={(e) => setAssignment(e.target.value)}
              className="w-full rounded"
            >
              <option value="">Assign staff</option>
              {available.map((e) => (
                <option key={e.id} value={e.name}>
                  {e.name}
                </option>
              ))}
            </select>

            <button
              disabled={!assignment}
              onClick={() => handleWorkflowAction('IN_PREP', assignment)}
              className="w-full rounded bg-indigo-600 py-3 text-white"
            >
              Start Prep
            </button>
          </div>
        )
      }

      if (['IN_PREP', 'OVEN'].includes(order.status)) {
        return (
          <div className="space-y-4 rounded-xl bg-indigo-50 p-4">
            <button
              onClick={() => handleWorkflowAction('MONITOR')}
              className="w-full rounded bg-green-600 py-3 text-white"
            >
              To Monitor
            </button>

            <button
              onClick={() => handleWorkflowAction('READY')}
              className="w-full rounded bg-green-700 py-3 text-white"
            >
              Ready
            </button>
          </div>
        )
      }
    }

    // OVEN
    if (viewContext === 'OVEN') {
      if (['MONITOR', 'OVEN'].includes(order.status)) {
        return (
          <div className="space-y-4 rounded-xl bg-orange-50 p-4">
            <button
              onClick={() => handleWorkflowAction('OVEN')}
              className="w-full rounded bg-orange-600 py-3 text-white"
            >
              In Oven
            </button>

            <button
              onClick={() => handleWorkflowAction('READY')}
              className="w-full rounded bg-green-600 py-3 text-white"
            >
              Ready
            </button>
          </div>
        )
      }
    }

    return null
  }

  // ---------------- RENDER ----------------
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="w-full max-w-5xl rounded-2xl bg-white p-6">
          <div className="mb-6 flex justify-between">
            <h2 className="text-xl font-black text-black">
              Edit Order: {order.customerSnapshot?.name || 'Walk-in'}
            </h2>
            <button
              onClick={onClose}
              className="text-2xl font-bold text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="w-full rounded border border-gray-300 p-2 text-black shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone"
                className="w-full rounded border border-gray-300 p-2 text-black shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />

              {/* Order Details Display */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-2 font-bold text-gray-700">Order Items</h3>
                {items.length === 0 ? (
                  <p className="text-sm text-gray-500">No items in order.</p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex flex-col border-b border-gray-200 pb-3 last:border-0"
                      >
                        <div className="flex justify-between">
                          <span className="text-lg font-bold text-gray-900">
                            {item.name} ({item.size} - {item.crust})
                          </span>
                          <span className="font-black text-gray-900">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>

                        {/* Toppings & Details */}
                        <div className="mt-1 pl-2 text-sm text-gray-700">
                          {item.toppings && item.toppings.length > 0 && (
                            <p className="font-medium">
                              <span className="text-gray-500">Toppings:</span>{' '}
                              {item.toppings.join(', ')}
                            </p>
                          )}
                          {item.notes && (
                            <p className="mt-1 inline-block rounded bg-red-50 px-1 font-medium text-red-600">
                              <span className="font-bold">Note:</span>{' '}
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex justify-end border-t border-gray-200 pt-2">
                  <span className="text-lg font-bold text-gray-900">
                    Total: ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div>{renderWorkflowActions()}</div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose}>Close</button>
            <button onClick={handleSubmit} disabled={isSubmitting}>
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
