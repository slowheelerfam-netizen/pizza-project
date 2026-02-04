'use client'

import { useState } from 'react'
import { createOrderAction } from '../app/actions'
import { MENU_ITEMS } from '../types/models'
import PizzaBuilderModal from './PizzaBuilderModal'

export default function PublicOrderInterface() {
  const [cart, setCart] = useState([])
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [selectedPizzaForBuilder, setSelectedPizzaForBuilder] = useState(MENU_ITEMS[0])
  
  // Checkout State
  const [isCheckoutMode, setIsCheckoutMode] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [address, setAddress] = useState('')
  const [orderType, setOrderType] = useState('PICKUP')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState(null)

  const handleOpenBuilder = (pizza) => {
    setSelectedPizzaForBuilder(pizza)
    setIsBuilderOpen(true)
  }

  const handleaddToCart = (item) => {
    setCart([...cart, item])
    setIsBuilderOpen(false)
  }

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)

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

    const result = await createOrderAction(null, formData)
    setOrderResult(result)
    setIsSubmitting(false)
    
    if (result.success) {
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setAddress('')
      setOrderType('PICKUP')
      setIsCheckoutMode(false)
    }
  }

  if (orderResult?.success) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-green-100 p-6 text-green-600">
          <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-bold text-gray-900">Order Placed!</h2>
        <p className="mt-2 text-lg text-gray-600">We're firing up the oven. Your pizza will be ready soon.</p>
        <button 
          onClick={() => setOrderResult(null)}
          className="mt-8 rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Order Another
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* LEFT COLUMN: MENU */}
      <div className={`lg:col-span-2 ${isCheckoutMode ? 'hidden lg:block lg:opacity-50 lg:pointer-events-none' : ''}`}>
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Our Menu</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {MENU_ITEMS.map((pizza) => (
            <div 
              key={pizza.id}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="aspect-video w-full bg-gray-200 object-cover">
                {/* Placeholder for Pizza Image */}
                <div className="flex h-full w-full items-center justify-center bg-orange-100 text-4xl">
                  🍕
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{pizza.name}</h3>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700">
                    ${pizza.basePrice}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{pizza.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pizza.defaultToppings.map(t => (
                    <span key={t} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleOpenBuilder(pizza)}
                  className="mt-5 w-full rounded-lg bg-gray-900 py-3 font-bold text-white transition-colors hover:bg-gray-800"
                >
                  Customize & Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: CART & CHECKOUT */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-100">
          {!isCheckoutMode ? (
            <>
              <h2 className="mb-4 text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🛒</span> Your Order
              </h2>
              
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                  <p>Your cart is empty.</p>
                  <p className="text-sm">Add some pizzas to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ul className="divide-y divide-gray-100">
                    {cart.map((item, idx) => (
                      <li key={idx} className="py-3 flex justify-between group">
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.size} | {item.crust}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[150px]">
                            {item.toppings.join(', ')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-medium text-gray-900">${item.price.toFixed(2)}</span>
                          <button 
                            onClick={() => removeFromCart(idx)}
                            className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsCheckoutMode(true)}
                    className="mt-4 w-full rounded-lg bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleCheckoutSubmit} className="space-y-4 animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
                <button 
                  type="button" 
                  onClick={() => setIsCheckoutMode(false)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  ← Back to Menu
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  required
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  required
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(805) 555-0123"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Order Type</label>
                <div className="mt-1 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="orderType"
                      checked={orderType === 'PICKUP'}
                      onChange={() => setOrderType('PICKUP')}
                      className="text-indigo-600"
                    />
                    <span className="text-sm">Pickup</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="orderType"
                      checked={orderType === 'DELIVERY'}
                      onChange={() => setOrderType('DELIVERY')}
                      className="text-indigo-600"
                    />
                    <span className="text-sm">Delivery</span>
                  </label>
                </div>
              </div>

              {orderType === 'DELIVERY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                  <input
                    required
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 mt-6">
                <div className="flex justify-between mb-4 text-sm text-gray-500">
                  <span>Items ({cart.length})</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-green-600 py-3 font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 disabled:opacity-70"
                >
                  {isSubmitting ? 'Placing Order...' : `Pay $${cartTotal.toFixed(2)}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <PizzaBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onAdd={handleaddToCart}
        initialPizza={selectedPizzaForBuilder}
      />
    </div>
  )
}
