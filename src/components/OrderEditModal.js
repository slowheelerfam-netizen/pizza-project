'use client'

import { useState, useEffect } from 'react'
import { updateOrderDetailsAction } from '../app/actions'
import { MENU_ITEMS, PIZZA_SIZES, CRUST_TYPES, TOPPINGS } from '../types/models'

export default function OrderEditModal({ order, isOpen, onClose }) {
  // Cart state
  const [items, setItems] = useState([])

  // Item Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)

  // Customer State
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderType, setOrderType] = useState('PICKUP')
  const [address, setAddress] = useState('')

  // Current Item Builder State
  const [selectedPizza, setSelectedPizza] = useState(MENU_ITEMS[0])
  const [selectedSize, setSelectedSize] = useState(PIZZA_SIZES.MEDIUM)
  const [selectedCrust, setSelectedCrust] = useState(CRUST_TYPES.ORIGINAL)
  const [selectedToppings, setSelectedToppings] = useState(
    new Set(MENU_ITEMS[0].defaultToppings)
  )
  const [itemNotes, setItemNotes] = useState('')

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Initialize state from order prop
  useEffect(() => {
    if (order && isOpen) {
      setItems(order.items || [])
      setCustomerName(order.customerSnapshot?.name || '')
      setCustomerPhone(order.customerSnapshot?.phone || '')
      setOrderType(order.customerSnapshot?.type || 'PICKUP')
      setAddress(order.customerSnapshot?.address || '')
      setError(null)
    }
  }, [order, isOpen])

  if (!isOpen) return null

  // Helper to check if we can open the menu
  const isCustomerInfoValid = () => {
    if (!customerName || !customerPhone) return false
    if (orderType === 'DELIVERY' && !address) return false
    return true
  }

  // Calculate price for the current item being built
  const calculateItemPrice = (pizza, size, crust, toppingsSet) => {
    let price = pizza.basePrice

    toppingsSet.forEach((toppingId) => {
      const topping = Object.values(TOPPINGS).find((t) => t.id === toppingId)
      if (topping && !pizza.defaultToppings.includes(toppingId)) {
        price += topping.price
      }
    })

    price += crust.price
    price *= size.priceMultiplier

    return parseFloat(price.toFixed(2))
  }

  const currentItemPrice = calculateItemPrice(
    selectedPizza,
    selectedSize,
    selectedCrust,
    selectedToppings
  )

  const toggleTopping = (toppingId) => {
    const newToppings = new Set(selectedToppings)
    if (newToppings.has(toppingId)) {
      newToppings.delete(toppingId)
    } else {
      newToppings.add(toppingId)
    }
    setSelectedToppings(newToppings)
  }

  const handlePizzaChange = (pizza) => {
    setSelectedPizza(pizza)
    setSelectedToppings(new Set(pizza.defaultToppings))
  }

  const openBuilder = () => {
    // Reset builder state
    setSelectedPizza(MENU_ITEMS[0])
    setSelectedSize(PIZZA_SIZES.MEDIUM)
    setSelectedCrust(CRUST_TYPES.ORIGINAL)
    setSelectedToppings(new Set(MENU_ITEMS[0].defaultToppings))
    setItemNotes('')
    setIsBuilderOpen(true)
  }

  const addItemToOrder = () => {
    const item = {
      id: Date.now(),
      name: selectedPizza.name,
      size: selectedSize.label,
      crust: selectedCrust.label,
      toppings: Array.from(selectedToppings).map(
        (id) => Object.values(TOPPINGS).find((t) => t.id === id)?.label
      ),
      price: currentItemPrice,
      notes: itemNotes,
      details: `${selectedSize.label} | ${selectedCrust.label}`,
    }
    setItems([...items, item])
    setIsBuilderOpen(false)
  }

  const removeItem = (indexToRemove) => {
    setItems(items.filter((_, idx) => idx !== indexToRemove))
  }

  const cartTotal = items.reduce((sum, item) => sum + item.price, 0)

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

    if (result.success) {
      onClose()
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Edit Order #{order?.id.slice(0, 8)}
            </h2>
            <p className="text-sm text-gray-500">
              Modify customer details or update items
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
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
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Phone Number
                </label>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  type="tel"
                  className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-inner ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                />
              </div>

              {/* Delivery Toggle */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-6">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="editOrderType"
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
                      name="editOrderType"
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
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Delivery Address
                  </label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    type="text"
                    className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-inner ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Items Section */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Order Items
                </h3>
                <button
                  type="button"
                  onClick={openBuilder}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + Add Item
                </button>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No items in this order.
                </p>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <ul className="space-y-3">
                    {items.map((item, idx) => (
                      <li
                        key={item.id || idx}
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
                          <p className="max-w-[300px] truncate text-xs text-gray-500">
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
                          className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-4">
            <div className="mr-4 text-right">
              <span className="text-xs tracking-wider text-gray-500 uppercase">
                Total
              </span>
              <div className="text-xl font-bold text-gray-900">
                ${cartTotal.toFixed(2)}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* NESTED BUILDER MODAL */}
        {isBuilderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
                <h2 className="text-xl font-bold text-gray-900">Add Item</h2>
                <button
                  onClick={() => setIsBuilderOpen(false)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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

              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-700">
                      Select Pizza
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {MENU_ITEMS.map((pizza) => (
                        <button
                          key={pizza.id}
                          type="button"
                          onClick={() => handlePizzaChange(pizza)}
                          className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                            selectedPizza.id === pizza.id
                              ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                          }`}
                        >
                          <span
                            className={`text-sm font-semibold ${selectedPizza.id === pizza.id ? 'text-indigo-900' : 'text-gray-900'}`}
                          >
                            {pizza.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ${pizza.basePrice}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-sm font-medium text-gray-700">
                        Size
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Object.values(PIZZA_SIZES).map((size) => (
                          <button
                            key={size.id}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                              selectedSize.id === size.id
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {size.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-3 block text-sm font-medium text-gray-700">
                        Crust
                      </label>
                      <select
                        value={selectedCrust.id}
                        onChange={(e) =>
                          setSelectedCrust(
                            Object.values(CRUST_TYPES).find(
                              (c) => c.id === e.target.value
                            )
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                      >
                        {Object.values(CRUST_TYPES).map((crust) => (
                          <option key={crust.id} value={crust.id}>
                            {crust.label}{' '}
                            {crust.price > 0 && `(+$${crust.price})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-700">
                      Toppings
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        (Selected: {selectedToppings.size})
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {Object.values(TOPPINGS).map((topping) => {
                        const isSelected = selectedToppings.has(topping.id)
                        return (
                          <button
                            key={topping.id}
                            type="button"
                            onClick={() => toggleTopping(topping.id)}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all ${
                              isSelected
                                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span>{topping.label}</span>
                            {isSelected && (
                              <svg
                                className="h-4 w-4 text-indigo-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Important Notes / Special Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-inner ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                      placeholder="e.g. Extra crispy, No onions, Cut in squares..."
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={addItemToOrder}
                      className="w-full rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40"
                    >
                      Add to Order (${currentItemPrice.toFixed(2)})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
