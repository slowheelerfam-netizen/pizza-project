'use client'

import { useState, useEffect } from 'react'
import { createOrderAction } from '../app/actions'
import { demoStorage } from '../lib/demoStorage'
import { MENU_ITEMS } from '../types/models'
import PizzaBuilderModal from './PizzaBuilderModal'

export default function PublicOrderInterface() {
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState(null)
  const [isTextAuthorized, setIsTextAuthorized] = useState(false)
  const [isDemoSkipValidation, setIsDemoSkipValidation] = useState(false)

  // First Item Popup
  const [showFirstItemPopup, setShowFirstItemPopup] = useState(false)

  // Auto-return to menu after success
  useEffect(() => {
    if (orderResult?.success) {
      const timer = setTimeout(() => {
        setOrderResult(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [orderResult])

  const handleOpenBuilder = (pizza) => {
    setSelectedPizzaForBuilder(pizza)
    setIsBuilderOpen(true)
  }

  const handleaddToCart = (item) => {
    if (cart.length === 0) {
      setShowFirstItemPopup(true)
    }
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

    // FALLBACK: If server action fails (e.g. Vercel with no DB), save to local storage
    if (!result.success && !result.message?.includes('Validation')) {
      console.log('Server action failed, saving to local storage (Demo Mode)')
      demoStorage.saveOrder({
        customerSnapshot: {
          name: customerName,
          phone: customerPhone,
          type: orderType,
          address,
        },
        items: cart,
        totalPrice: cartTotal,
      })

      // Simulate success
      setOrderResult({
        success: true,
        message: 'Order created (Demo Mode - Saved to this device only)',
      })
      setIsSubmitting(false)

      // Clear form
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setAddress('')
      setOrderType('PICKUP')
      setIsCheckoutMode(false)
      return
    }

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

  return (
    <div className="relative grid gap-8 lg:grid-cols-12">
      {/* First Item Popup */}
      {showFirstItemPopup && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm duration-300">
          <div className="animate-in zoom-in-95 w-full max-w-md scale-100 transform rounded-3xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl transition-all duration-300">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Delicious Choice! 🍕
            </h2>
            <p className="mb-8 text-lg text-slate-300">
              Would you like to add more pizzas to your order or proceed to
              checkout?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowFirstItemPopup(false)}
                className="w-full rounded-xl bg-indigo-600 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-indigo-500 active:scale-95"
              >
                Add Another Pizza
              </button>
              <button
                onClick={() => {
                  setShowFirstItemPopup(false)
                  setIsCheckoutMode(true)
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 font-bold text-white transition-all hover:bg-white/10 active:scale-95"
              >
                Go to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal Overlay */}
      {orderResult?.success && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm duration-300">
          <div className="animate-in zoom-in-95 w-full max-w-md scale-100 transform rounded-3xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl transition-all duration-300">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-400">
              <svg
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-3xl font-bold text-white">
              Order Placed!
            </h2>
            <p className="text-slate-300">
              We&apos;re firing up the oven. Your pizza will be ready soon.
            </p>
            <p className="mt-6 text-sm font-medium tracking-widest text-slate-500 uppercase">
              Redirecting...
            </p>
          </div>
        </div>
      )}

      {/* LEFT COLUMN: MENU */}
      <div
        className={`lg:col-span-8 ${isCheckoutMode ? 'hidden blur-sm lg:pointer-events-none lg:block lg:opacity-30' : ''}`}
      >
        {/* DEMO INSTRUCTIONS */}
        <div className="mb-8 rounded-3xl border border-indigo-500/30 bg-indigo-900/20 p-6 backdrop-blur-md">
          <h3 className="mb-4 text-xl font-bold text-white">
            🍕 How to Use This Demo
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                  1
                </span>
                <span className="font-bold text-indigo-200">
                  Register an Order
                </span>
              </div>
              <p className="text-sm text-slate-300">
                Add items to your cart and checkout. This simulates a customer
                placing an order online or at a kiosk.
              </p>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                  2
                </span>
                <span className="font-bold text-indigo-200">
                  Follow Production
                </span>
              </div>
              <p className="text-sm text-slate-300">
                Use the navigation links above to see the order move through the
                system.
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-indigo-500/30 pt-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span className="font-bold text-slate-300">
                Order Progression:
              </span>
              <span className="rounded bg-slate-500/20 px-2 py-1 text-slate-200">
                Register
              </span>
              <span>→</span>
              <span className="rounded bg-blue-500/20 px-2 py-1 text-blue-200">
                Kitchen
              </span>
              <span>→</span>
              <span className="rounded bg-orange-500/20 px-2 py-1 text-orange-200">
                Oven
              </span>
              <span>→</span>
              <span className="rounded bg-green-500/20 px-2 py-1 text-green-200">
                Ready
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              * Note: The{' '}
              <span className="font-bold text-slate-400">Monitor</span> page is
              designed for the Preparer station.
            </p>
          </div>
        </div>

        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-white drop-shadow-lg">
              Our Menu
            </h2>
            <p className="mt-2 text-lg font-medium text-slate-300">
              Hand-tossed, stone-baked, perfection.
            </p>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-2">
          {MENU_ITEMS.map((pizza) => (
            <div
              key={pizza.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:bg-black/50 hover:shadow-indigo-500/20"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={pizza.image}
                  alt={pizza.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-3xl font-black text-white drop-shadow-md">
                    {pizza.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pizza.ingredients.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-grow flex-col p-6 pt-4">
                <p className="mb-6 text-base leading-relaxed text-slate-300">
                  {pizza.description}
                </p>

                <div className="mt-auto flex items-center justify-between gap-4">
                  <span className="text-2xl font-bold text-white">
                    ${pizza.basePrice}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPizzaForBuilder(pizza)
                      setIsBuilderOpen(true)
                    }}
                    className="group/btn relative flex-1 overflow-hidden rounded-xl bg-indigo-600 px-6 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-indigo-500 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span>Customize</span>
                      <svg
                        className="h-4 w-4 transition-transform group-hover/btn:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: CART & CHECKOUT */}
      <div className="lg:col-span-4">
        <div className="sticky top-28 overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-xl">
          {!isCheckoutMode ? (
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold text-white">Your Order</h2>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
                  {cart.length}
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <div className="mb-4 rounded-full bg-white/5 p-4">
                    <span className="text-4xl">🛒</span>
                  </div>
                  <p className="font-medium">Your cart is empty.</p>
                  <p className="text-sm opacity-60">Deliciousness awaits!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <ul className="custom-scrollbar max-h-[50vh] space-y-4 overflow-y-auto pr-2">
                    {cart.map((item, idx) => (
                      <li
                        key={idx}
                        className="group relative flex justify-between rounded-xl bg-white/5 p-4 transition-all hover:bg-white/10"
                      >
                        <div>
                          <p className="text-lg font-bold text-white">
                            {item.name}
                          </p>
                          <p className="text-sm font-medium text-slate-400">
                            {item.size} | {item.crust}
                          </p>
                          {item.toppings.length > 0 && (
                            <p className="mt-1 line-clamp-2 max-w-[200px] text-xs text-slate-500">
                              {item.toppings.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-bold text-white">
                            ${item.price.toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeFromCart(idx)}
                            className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 transition-colors hover:bg-red-500 hover:text-white"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between text-xl font-bold text-white">
                      <span>Total</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsCheckoutMode(true)}
                    className="mt-4 w-full rounded-xl bg-green-600 py-4 font-black text-white shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02] hover:bg-green-500 active:scale-[0.98]"
                  >
                    PROCEED TO CHECKOUT
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleCheckoutSubmit}
              className="animate-in slide-in-from-right-4 p-6"
            >
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold text-white">Checkout</h2>
                <button
                  type="button"
                  onClick={() => setIsCheckoutMode(false)}
                  className="text-sm font-bold text-indigo-400 hover:text-indigo-300"
                >
                  ← Back
                </button>
              </div>

              {/* Express Checkout */}
              <div className="mb-6 space-y-3">
                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Express Checkout
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-xl bg-white py-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="font-bold text-black">Pay</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-xl bg-white py-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="font-bold text-black">
                      <span className="text-blue-500">G</span>
                      <span className="text-red-500">P</span>
                      <span className="text-yellow-500">a</span>
                      <span className="text-green-500">y</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-xl bg-[#0070BA] py-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="font-bold text-white italic">PayPal</span>
                  </button>
                </div>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="mx-4 text-xs text-slate-500">
                    OR CONTINUE BELOW
                  </span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Your Name
                  </label>
                  <input
                    required
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-black/60 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Phone Number
                  </label>
                  <input
                    required
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(805) 555-0123"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-black/60 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Order Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label
                      className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-3 font-bold transition-all ${orderType === 'PICKUP' ? 'border-indigo-500 bg-indigo-500/20 text-white' : 'border-white/10 bg-black/20 text-slate-400 hover:bg-white/5'}`}
                    >
                      <input
                        type="radio"
                        name="orderType"
                        checked={orderType === 'PICKUP'}
                        onChange={() => setOrderType('PICKUP')}
                        className="hidden"
                      />
                      Pickup
                    </label>
                    <label
                      className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-3 font-bold transition-all ${orderType === 'DELIVERY' ? 'border-indigo-500 bg-indigo-500/20 text-white' : 'border-white/10 bg-black/20 text-slate-400 hover:bg-white/5'}`}
                    >
                      <input
                        type="radio"
                        name="orderType"
                        checked={orderType === 'DELIVERY'}
                        onChange={() => setOrderType('DELIVERY')}
                        className="hidden"
                      />
                      Delivery
                    </label>
                  </div>
                </div>

                {orderType === 'DELIVERY' && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="mb-2 block text-sm font-bold text-slate-300">
                      Delivery Address
                    </label>
                    <input
                      required
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-black/60 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      placeholder="123 Pizza Lane"
                    />
                  </div>
                )}

                {/* Text Authorization Checkbox */}
                <div className="rounded-xl bg-white/5 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isTextAuthorized}
                      onChange={(e) => setIsTextAuthorized(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-slate-600 bg-black/40 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-300">
                      I authorize text communication regarding my order status.
                    </span>
                  </label>
                </div>

                {/* Demo Skip Validation Checkbox */}
                <div className="px-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isDemoSkipValidation}
                      onChange={(e) =>
                        setIsDemoSkipValidation(e.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-600 bg-black/40 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-500">
                      Skip Phone Validation (Demo Mode)
                    </span>
                  </label>
                </div>

                <div className="border-t border-white/10 pt-4">
                  {orderResult?.success === false && orderResult?.message && (
                    <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                      {orderResult.message}
                    </div>
                  )}
                  <div className="mb-4 flex justify-between text-base text-slate-400">
                    <span>Items ({cart.length})</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      (!isTextAuthorized && !isDemoSkipValidation)
                    }
                    className="w-full rounded-xl bg-green-600 py-4 font-black text-white shadow-lg shadow-green-900/20 transition-all hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                  >
                    {isSubmitting
                      ? 'Placing Order...'
                      : `PAY $${cartTotal.toFixed(2)}`}
                  </button>
                </div>
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
