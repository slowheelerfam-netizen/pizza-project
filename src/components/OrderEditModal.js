'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ORDER_STATUS } from '../types/models'

/**
 * CONTRACT (LOCKED)
 * -----------------
 * Status flow: NEW → PREP → OVEN → READY
 * - PREP does NOT exist (Wait, I should remove this line or say MONITOR does not exist)
 * - REGISTER can only advance NEW → PREP
 * - KITCHEN advances PREP → OVEN → READY
 */

export default function OrderEditModal({
  order,
  isOpen,
  onClose,
  viewContext = 'REGISTER',
  onStatusUpdate,
  onPriorityToggle,
  onPrint,
  employees = [],
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [assignment, setAssignment] = useState('')
  const [shouldPrint, setShouldPrint] = useState(false)
  const [isPriority, setIsPriority] = useState(false)
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false)

  useEffect(() => {
    if (!order || !isOpen) return
    setAssignment(order.assignedTo || '')
    setIsPriority(Boolean(order.isPriority))
  }, [order, isOpen])

  if (!isOpen || !order) return null

  const handleWorkflowAction = (nextStatus) => {
    if (!onStatusUpdate) return

    startTransition(async () => {
      if (shouldPrint && onPrint) onPrint(order)

      // IMPORTANT:
      // - REGISTER uses assignment
      // - KITCHEN must NOT pass assignment (was breaking PREP → OVEN)
      if (viewContext === 'REGISTER') {
        await onStatusUpdate(order.id, nextStatus, assignment || null)
      } else {
        await onStatusUpdate(order.id, nextStatus)
      }

      router.refresh()
      onClose()
    })
  }

  const renderWorkflowActions = () => {
    /** REGISTER */
    if (viewContext === 'REGISTER') {
      const available = employees.filter((e) => e.isOnDuty === true)

      return (
        <div className="space-y-6 rounded-xl bg-blue-50 p-4">
          <h3 className="text-sm font-bold text-blue-900 uppercase">
            Register Actions
          </h3>

          <label className="flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm">
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
                router.refresh()
              }}
            />
            <span className="text-lg font-black">High Priority</span>
          </label>

          <select
            value={assignment}
            onChange={(e) => setAssignment(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-300 p-2"
          >
            <option value="">Assign Staff (optional)</option>
            {available.map((e) => (
              <option key={e.id} value={e.name}>
                {e.name}
              </option>
            ))}
          </select>

          {order.status === ORDER_STATUS.NEW && (
            <button
              onClick={() => handleWorkflowAction(ORDER_STATUS.PREP)}
              disabled={isPending}
              className="w-full rounded-lg bg-green-600 py-3 font-bold text-white disabled:opacity-50"
            >
              Start Prep
            </button>
          )}
        </div>
      )
    }

    /** KITCHEN */
    if (viewContext === 'KITCHEN') {
      return (
        <div className="space-y-4 rounded-xl bg-indigo-50 p-4">
          {order.status === ORDER_STATUS.PREP && (
            <button
              onClick={() => handleWorkflowAction(ORDER_STATUS.OVEN)}
              disabled={isPending}
              className="w-full rounded-lg bg-orange-500 py-3 font-bold text-white disabled:opacity-50"
            >
              Send to OVEN
            </button>
          )}

          {order.status === ORDER_STATUS.OVEN && (
            <button
              onClick={() => handleWorkflowAction(ORDER_STATUS.READY)}
              disabled={isPending}
              className="w-full rounded-lg bg-green-600 py-3 font-bold text-white disabled:opacity-50"
            >
              Start BOXING
            </button>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP SECTION: Name, Phone, ID, Time */}
        <div className="mb-6 grid grid-cols-2 gap-4 border-b pb-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              {order.customerSnapshot?.name || 'Walk-in'}
            </h2>
            <p className="text-xl font-bold text-gray-600">
              {order.customerSnapshot?.phone || 'No Phone'}
            </p>
          </div>
          <div className="flex flex-col items-end justify-center">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-gray-500">
                {new Date(order.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="rounded-lg bg-gray-100 px-4 py-2 text-3xl font-black text-gray-800">
                #{order.displayId}
              </span>
              <button onClick={onClose} className="ml-4 text-2xl font-bold text-gray-400 hover:text-red-500">
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* BOTTOM SECTION: Ingredients & Instructions */}
          <div className="col-span-2">
            {order.specialInstructions && (
              <div className="mb-6 rounded-xl border-l-8 border-red-500 bg-red-50 p-4">
                <h4 className="mb-1 text-sm font-bold tracking-wider text-red-800 uppercase">
                  Special Instructions
                </h4>
                <p className="text-xl font-black text-red-600">
                  {order.specialInstructions}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-400 uppercase">Items</h3>
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between rounded-xl border-b-2 border-gray-100 p-4 last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-black text-gray-900">
                        {item.quantity}x
                      </span>
                      <span className="text-2xl font-bold text-gray-800">
                        {item.name}
                      </span>
                      <span className="text-lg font-medium text-gray-500">
                        ({item.size})
                      </span>
                    </div>

                    {item.toppings?.length > 0 && (
                      <div className="mt-2 pl-8">
                        <p className="text-xl leading-relaxed font-bold text-gray-600">
                          + {item.toppings.join(', ')}
                        </p>
                      </div>
                    )}

                    {item.notes && (
                      <div className="mt-2 pl-8">
                        <p className="text-lg font-bold text-blue-600 italic">
                          "{item.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Actions */}
          <div>{renderWorkflowActions()}</div>
        </div>
      </div>
    </div>
  )
}
