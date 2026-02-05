'use client'

import { useState } from 'react'
import { createOrderAction, checkCustomerWarning } from '../app/actions'
import { demoStorage } from '../lib/demoStorage'
import { MENU_ITEMS } from '../types/models'
import PizzaBuilderModal from './PizzaBuilderModal'

export default function OrderCreationForm() {
  // Cart state
  const [items, setItems] = useState([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Customer State
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('(805)')
  const [orderType, setOrderType] = useState('PICKUP') // PICKUP or DELIVERY
  const [address, setAddress] = useState('')

  // Warning State
  const [warning, setWarning] = useState(null)
  const [overrideWarning, setOverrideWarning] = useState(false)

  // Validation State
  const [validationError, setValidationError] = useState(null)

  // Form Submission State
  const [lastResult, setLastResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper to check validation
  const getValidationResult = () => {
    if (!customerName)
      return { valid: false, message: 'Please enter the customer name.' }
    if (!customerPhone)
      return { valid: false, message: 'Please enter a phone number.' }

    const digitsOnly = customerPhone.replace(/\D/g, '')
    if (digitsOnly.length < 10)
      return {
        valid: false,
        message: 'Phone number must be at least 10 digits.',
      }

    if (orderType === 'DELIVERY' && !address)
      return { valid: false, message: 'Please enter a delivery address.' }
    if (warning && !overrideWarning)
      return {
        valid: false,
        message: `Cannot proceed: ${warning.reason}. Please override warning.`,
      }

    return { valid: true, message: null }
  }

  const handleOpenMenu = () => {
    const { valid, message } = getValidationResult()
    if (valid) {
      setValidationError(null)
      setIsModalOpen(true)
    } else {
      setValidationError(message)
      alert(message)
    }
  }

  const handlePhoneBlur = async () => {
    if (!customerPhone || customerPhone.length < 3) return

    setWarning(null)
    setOverrideWarning(false)

    const result = await checkCustomerWarning(customerPhone)
    if (result.hasWarning) {
      setWarning(result.warning)
    }
  }

  const handleAddItem = (item) => {
    setItems([...items, item])
    setIsModalOpen(false)
  }

  const removeItem = (indexToRemove) => {
    setItems(items.filter((_, idx) => idx !== indexToRemove))
  }

  const cartTotal = items.reduce((sum, item) => sum + item.price, 0)

  async function handleSubmit() {
    if (!customerName || !customerName.trim()) {
      alert('CRITICAL: Customer Name is missing! Please enter a name.')
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('customerName', customerName)
    formData.append('customerPhone', customerPhone)
    formData.append('type', orderType)
    formData.append('address', address)
    formData.append('items', JSON.stringify(items))
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
        items,
        totalPrice: cartTotal,
      })
      // Simulate success
      setLastResult({ success: true, message: 'Order created (Local Storage)' })

      // Reset everything
      setItems([])
      setCustomerName('')
      setCustomerPhone('(805)')
      setAddress('')
      setOrderType('PICKUP')
      setIsSubmitting(false)
      return
    }

    setLastResult(result)
    setIsSubmitting(false)

    if (result.success) {
      // Reset everything
      setItems([])
      setCustomerName('')
      setCustomerPhone('(805)')
      setAddress('')
      setOrderType('PICKUP')
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white/50 px-6 py-5">
        <h2 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-xl font-bold text-transparent">
          Create New Order
        </h2>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Start with customer details, then add items
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-8">
          {/* Customer Details Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Customer Name
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                type="text"
                className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-inner ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Phone Number
              </label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                onBlur={handlePhoneBlur}
                type="tel"
                placeholder="e.g. (805) 555-0199"
                className={`w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-inner ring-1 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:outline-none ${
                  warning
                    ? 'ring-red-200 focus:ring-red-500/30'
                    : 'ring-gray-200 focus:ring-indigo-500/30'
                }`}
              />
              {warning && (
                <div className="animate-in fade-in slide-in-from-top-2 mt-3 rounded-xl border border-red-100 bg-red-50/80 p-3 shadow-sm">
                  <div className="flex gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5 flex-shrink-0 text-red-600"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <h4 className="text-sm font-bold text-red-800">
                        Warning: {warning.reason}
                      </h4>
                      <p className="mt-1 text-xs text-red-700">
                        Flagged on{' '}
                        {new Date(warning.createdAt).toLocaleDateString()}
                      </p>
                      <label className="mt-3 flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={overrideWarning}
                          onChange={(e) => setOverrideWarning(e.target.checked)}
                          className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-xs font-bold text-red-800 hover:text-red-900">
                          Override Warning
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Toggle */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-6">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="orderType"
                    checked={orderType === 'PICKUP'}
                    onChange={() => setOrderType('PICKUP')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Pickup
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="orderType"
                    checked={orderType === 'DELIVERY'}
                    onChange={() => setOrderType('DELIVERY')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Delivery
                  </span>
                </label>
              </div>
            </div>

            {/* Address Field - Conditional */}
            {orderType === 'DELIVERY' && (
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Delivery Address
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  placeholder="Street address, Apt, City..."
                />
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Action Buttons: Open Menu */}
          <div>
            <button
              type="button"
              onClick={handleOpenMenu}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 py-4 text-indigo-700 transition-all hover:border-indigo-500 hover:bg-indigo-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              <span className="font-semibold">Add Items from Menu</span>
            </button>
            {validationError && (
              <p className="mt-2 text-center text-sm font-medium text-red-600">
                {validationError}
              </p>
            )}
          </div>

          {/* Cart / Order Summary */}
          {items.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wide text-gray-900 uppercase">
                  Current Order
                </h3>
                <span className="rounded-md bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                  Total: ${cartTotal.toFixed(2)}
                </span>
              </div>
              <ul className="space-y-3">
                {items.map((item, idx) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between rounded-lg bg-white p-3 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          (${item.price.toFixed(2)})
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {item.details}
                      </p>
                      <p className="max-w-[200px] truncate text-xs text-gray-500">
                        {item.toppings?.join(', ')}
                      </p>
                      {item.notes && (
                        <p className="mt-1 text-xs font-medium text-amber-600 italic">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-gray-400 transition-colors hover:text-red-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (items.length === 0) {
                  alert(
                    'Please add at least one item to the order before placing it.'
                  )
                  return
                }
                handleSubmit()
              }}
              disabled={isSubmitting}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-4 text-base font-bold text-white shadow-lg transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? 'Processing Order...'
                : `Place Order ($${cartTotal.toFixed(2)})`}
            </button>
          </div>
        </div>
      </div>

      {lastResult && (
        <div
          className={`border-t px-6 py-4 ${
            lastResult.success ? 'bg-green-50/50' : 'bg-red-50/50'
          }`}
        >
          <div className="flex gap-3">
            <div
              className={`flex-shrink-0 ${lastResult.success ? 'text-green-500' : 'text-red-500'}`}
            >
              {lastResult.success ? (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div>
              <h3
                className={`text-sm font-bold ${lastResult.success ? 'text-green-800' : 'text-red-800'}`}
              >
                {lastResult.success ? 'Success!' : 'Order Failed'}
              </h3>
              <p
                className={`mt-1 text-sm ${lastResult.success ? 'text-green-700' : 'text-red-700'}`}
              >
                {lastResult.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REPLACED WITH COMPONENT */}
      {isModalOpen && (
        <PizzaBuilderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCancel={() => window.location.reload()}
          onAdd={handleAddItem}
          initialPizza={MENU_ITEMS[0]}
        />
      )}
    </div>
  )
}
