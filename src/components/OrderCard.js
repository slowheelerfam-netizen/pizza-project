import React from 'react'

export default function OrderCard({ order, onClick, showIngredients = false, ...props }) {
  return (
    <div
      onClick={onClick}
      {...props}
      className={`mb-3 cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        order.status === 'NEW' ? 'border-l-4 border-l-blue-500' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="truncate text-lg font-bold text-gray-900">
              {order.customerSnapshot?.name || order.customerName || 'Walk-in'}
            </h4>
            <span className="rounded bg-gray-100 px-2 py-1 text-xs font-bold whitespace-nowrap text-gray-700">
              {order.status}
            </span>
          </div>

          <div className="mt-1 flex items-center text-sm text-gray-500">
            <span className="mr-3 font-mono font-bold text-gray-900">
              #{order.displayId}
            </span>
            <span>
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">
              {order.items?.length || 0} items
            </div>
            {order.assignedTo && (
              <span className="text-xs font-medium text-indigo-600">
                👨‍🍳 {order.assignedTo}
              </span>
            )}
          </div>

          {showIngredients && order.items && order.items.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="mb-2 text-sm">
                  <div className="font-bold text-gray-800">
                    {item.quantity}x {item.name} <span className="text-xs text-gray-500">({item.size})</span>
                  </div>
                  {/* Ingredients/Toppings */}
                  <div className="ml-4 text-xs text-gray-600">
                    {/* Combine base ingredients and toppings if available, or just list toppings */}
                    {item.toppings && item.toppings.length > 0 ? (
                       <span>+ {item.toppings.map(t => t.name).join(', ')}</span>
                    ) : (
                      <span className="italic text-gray-400">Standard</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
