'use client'

import { useState } from 'react'
import { MENU_ITEMS } from '../types/models'
import PizzaBuilderModal from './PizzaBuilderModal'

export default function CustomerOrderInterface({ createOrderAction }) {
  const [cart, setCart] = useState([])
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [selectedPizzaForBuilder, setSelectedPizzaForBuilder] = useState(
    MENU_ITEMS[0]
  )

  // Checkout State
  const [isCheckoutMode, setIsCheckoutMode] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [address, setAddress] = useState('')
  const [orderType, setOrderType] = useState('PICKUP')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState(null)

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)

  const handleAddToCart = (item) => {
    setCart([...cart, item])
    setIsBuilderOpen(false)
  }

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('customerName', customerName)
    formData.append('customerPhone', customerPhone)
    formData.append('type', orderType)
    formData.append('address', address)
    formData.append('items', JSON.stringify(cart))
    formData.append('totalPrice', cartTotal.toString())
    formData.append('specialInstructions', specialInstructions)

    let result = { success: false, message: 'Failed' }
    if (createOrderAction) {
      result = await createOrderAction(null, formData)
    }

    setOrderResult(result)
    setIsSubmitting(false)

    if (result.success) {
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setAddress('')
      setOrderType('PICKUP')
      setSpecialInstructions('')
      setIsCheckoutMode(false)
      setTimeout(() => setOrderResult(null), 3000)
    }
  }

  // --- CHECKOUT MODAL ---
  if (isCheckoutMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-indigo-600 px-6 py-4 text-white">
            <h2 className="text-xl font-bold">Checkout</h2>
            <button
              onClick={() => setIsCheckoutMode(false)}
              className="rounded-lg bg-white/20 px-3 py-1 text-xs font-bold text-white hover:bg-white/30"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleCheckoutSubmit} className="p-6">
            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-extrabold text-black">
                  Customer Name
                </label>
                <input
                  required
                  type="text"
                  className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 p-2 font-bold text-black shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-extrabold text-black">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 p-2 font-bold text-black shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-extrabold text-black">
                  Order Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 font-bold text-black">
                    <input
                      type="radio"
                      name="type"
                      value="PICKUP"
                      checked={orderType === 'PICKUP'}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Pickup</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold text-black">
                    <input
                      type="radio"
                      name="type"
                      value="DINE_IN"
                      checked={orderType === 'DINE_IN'}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Dine-in</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-100 p-4">
              <h3 className="mb-2 font-black text-black">Order Summary</h3>
              <ul className="space-y-1 text-sm font-bold text-gray-800">
                {cart.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {item.quantity || 1}x {item.name}
                    </span>
                    <span>${item.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-gray-300 pt-2 text-lg font-black text-black">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsCheckoutMode(false)}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 font-bold text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // --- MAIN CUSTOMER MENU ---
  return (
    <div className="min-h-screen pb-32">
      {/* Hero Section */}
      <div className="relative mb-12 overflow-hidden rounded-3xl bg-indigo-900 px-6 py-16 text-center text-white shadow-2xl sm:px-12 sm:py-24">
        <div className="relative z-10 mx-auto max-w-4xl">
          <h1 className="mb-6 text-5xl font-black tracking-tight sm:text-7xl">
            Pizza Planet
          </h1>
          <p className="mx-auto max-w-2xl text-xl font-medium text-indigo-100 sm:text-2xl">
            Hand-tossed, stone-baked, and made with love. Order now and taste
            the difference.
          </p>
        </div>
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-pink-500/20 blur-3xl" />
      </div>

      {/* Menu Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-3xl font-black text-gray-900">Our Menu</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {MENU_ITEMS.map((pizza) => (
            <div
              key={pizza.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-square w-full overflow-hidden bg-gray-200">
                <img
                  src={pizza.image}
                  alt={pizza.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-black text-gray-900">
                    {pizza.name}
                  </h3>
                  <p className="mb-4 text-sm text-gray-500">
                    {pizza.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-indigo-600">
                    From ${pizza.basePrice}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPizzaForBuilder(pizza)
                      setIsBuilderOpen(true)
                    }}
                    className="rounded-full bg-gray-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-800"
                  >
                    Add +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Builder Modal */}
      <PizzaBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onAdd={handleAddToCart}
        initialPizza={selectedPizzaForBuilder}
      />

      {/* Floating Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed right-0 bottom-0 left-0 z-40 border-t bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl font-black text-indigo-600">
                {cart.length}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-500">Total</div>
                <div className="text-2xl font-black text-gray-900">
                  ${cartTotal.toFixed(2)}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsCheckoutMode(true)}
              className="rounded-xl bg-green-600 px-8 py-3 text-lg font-bold text-white shadow-lg hover:bg-green-700"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {orderResult && (
        <div className="fixed top-24 left-1/2 z-50 -translate-x-1/2 animate-bounce rounded-full bg-green-600 px-8 py-3 font-bold text-white shadow-2xl">
          {orderResult.message || 'Order Placed!'}
        </div>
      )}
    </div>
  )
}
