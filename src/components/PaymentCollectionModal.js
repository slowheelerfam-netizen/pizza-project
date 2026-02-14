'use client'

import { useState } from 'react'

export default function PaymentCollectionModal({
  order,
  isOpen,
  onClose,
  onConfirm,
}) {
  const [amountReceived, setAmountReceived] = useState('')

  if (!isOpen || !order) return null

  const totalDue = order.totalPrice || 0
  const received = parseFloat(amountReceived) || 0
  const changeDue = received - totalDue
  const isSufficient = received >= totalDue

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isSufficient) {
      if (!confirm('Amount received is less than total. Proceed anyway?')) {
        return
      }
    }
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-indigo-600 px-6 py-4 text-white">
          <h2 className="text-xl font-bold">Collect Payment</h2>
          <p className="text-sm font-medium text-indigo-100">
            Order #{order.displayId} • {order.customerSnapshot?.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <span className="text-lg font-bold text-gray-700">Total Due</span>
              <span className="text-3xl font-black text-gray-900">
                ${totalDue.toFixed(2)}
              </span>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700">
                Amount Received
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 font-bold text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  autoFocus
                  required
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 py-3 pr-4 pl-8 text-xl font-bold text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {received > 0 && (
              <div
                className={`flex items-center justify-between rounded-lg p-4 ${
                  changeDue >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <span
                  className={`text-lg font-bold ${
                    changeDue >= 0 ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {changeDue >= 0 ? 'Change Due' : 'Remaining'}
                </span>
                <span
                  className={`text-2xl font-black ${
                    changeDue >= 0 ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  ${Math.abs(changeDue).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 font-bold text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-bold text-white shadow-lg hover:bg-green-700"
            >
              Mark Paid & Complete
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
