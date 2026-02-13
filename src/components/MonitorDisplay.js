'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MENU_ITEMS, TOPPINGS } from '../types/models'

export default function MonitorDisplay({ initialOrders }) {
  const router = useRouter()

  // Refresh every 5s to get latest orders (consistent with server prop updates)
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 5000)
    return () => clearInterval(interval)
  }, [router])

  // PREP orders only, sorted by creation time
  const displayOrders = initialOrders
    .filter((o) => o.status === 'PREP')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const getFullIngredients = (item) => {
    const menuItem = MENU_ITEMS.find((m) => m.name === item.name)
    const toppingLabels = new Set(Object.values(TOPPINGS).map((t) => t.label))

    const baseIngredients =
      menuItem?.ingredients?.filter((ing) => !toppingLabels.has(ing)) || []

    const selectedToppings = item.toppings || []

    return [...new Set([...baseIngredients, ...selectedToppings])]
  }

  const renderCard = (order) => (
    <div
      key={order.id}
      className="flex h-auto flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 grid grid-cols-2 gap-2 border-b border-gray-100 pb-2">
        <div>
          <h3 className="text-xl font-black text-gray-900">
            {order.customerSnapshot?.name || 'Guest'}
          </h3>
          <p className="text-sm font-bold text-gray-500">
            {order.customerSnapshot?.phone || 'No Phone'}
          </p>
        </div>
        <div className="text-right">
          <span className="block text-2xl font-black text-gray-800">
            #{order.displayId}
          </span>
          <span className="text-lg font-bold text-gray-400">
            {new Date(order.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {order.specialInstructions && (
          <div className="rounded-lg border-2 border-red-100 bg-red-50 p-3 text-lg font-black text-red-600">
            ⚠️ {order.specialInstructions}
          </div>
        )}

        <ul className="space-y-3">
          {order.items?.map((item, idx) => {
            const ingredients = getFullIngredients(item)
            return (
              <li
                key={idx}
                className="border-b border-gray-100 pb-2 last:border-0"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-gray-900">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-2xl font-black text-gray-800">
                    {item.size.split(' (')[0]}
                  </span>
                </div>

                {ingredients.length > 0 && (
                  <div className="mt-1 pl-4 text-lg font-bold text-gray-600">
                    {ingredients.join(', ')}
                  </div>
                )}

                {item.notes && (
                  <div className="mt-1 pl-4 text-lg font-bold text-indigo-600 italic">
                    "{item.notes}"
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-3 text-center">
        <span className="text-lg font-bold text-indigo-600">IN PREP</span>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <h1 className="text-3xl font-black text-indigo-900">
          📺 LIVE PREP QUEUE{' '}
          <span className="text-xl font-medium text-slate-400">
            | Kitchen Display
          </span>
        </h1>
        <div className="text-xl font-bold text-gray-900">
          Orders: {displayOrders.length}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {displayOrders.length === 0 ? (
          <div className="flex h-full items-center justify-center text-4xl font-black text-gray-300">
            NO ACTIVE ORDERS
          </div>
        ) : (
          <div className="grid grid-cols-5 items-start gap-6">
            {displayOrders.map((o) => renderCard(o))}
          </div>
        )}
      </div>
    </div>
  )
}
