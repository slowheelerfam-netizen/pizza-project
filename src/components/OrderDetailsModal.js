'use client'

import React from 'react'

export default function OrderDetailsModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null

  const total = order.items.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">
                Order #{order.id.slice(0, 8)}
              </h2>
              <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-700">
                READ ONLY
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Status Banner */}
          <div className="mb-6 flex items-center justify-between rounded-xl bg-gray-50 p-4">
            <div>
              <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                Status
              </p>
              <p className="text-xl font-bold text-indigo-600">
                {order.status}
              </p>
            </div>
            {order.assumeChefRole && (
              <span className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                Chef Role Active
              </span>
            )}
          </div>

          {/* Customer Info */}
          <div className="mb-8 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">
                Customer
              </p>
              <p className="text-lg font-medium text-gray-900">
                {order.customerSnapshot?.name}
              </p>
              <p className="text-gray-600">{order.customerSnapshot?.phone}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Type</p>
              <p className="text-lg font-medium text-gray-900">
                {order.customerSnapshot?.type}
              </p>
              {order.customerSnapshot?.type === 'DELIVERY' && (
                <p className="text-gray-600">
                  {order.customerSnapshot?.address}
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-gray-900">Items</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between rounded-lg border border-gray-100 p-4"
                >
                  <div>
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.details}</p>
                    {item.toppings?.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        + {item.toppings.join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="mt-2 text-xs font-bold text-amber-600">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                  <p className="font-medium text-gray-900">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Double-click view (Informational Only)
            </p>
            <div className="text-right">
              <span className="text-xs tracking-wider text-gray-500 uppercase">
                Total
              </span>
              <p className="text-2xl font-bold text-gray-900">
                ${total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
