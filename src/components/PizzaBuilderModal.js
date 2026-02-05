'use client'

import { useState, useEffect } from 'react'
import { MENU_ITEMS, PIZZA_SIZES, CRUST_TYPES, TOPPINGS } from '../types/models'

export default function PizzaBuilderModal({
  isOpen,
  onClose,
  onCancel,
  onAdd,
  initialPizza = MENU_ITEMS[0],
}) {
  const [selectedPizza, setSelectedPizza] = useState(initialPizza)
  const [selectedSize, setSelectedSize] = useState(PIZZA_SIZES.MEDIUM)
  const [selectedCrust, setSelectedCrust] = useState(CRUST_TYPES.ORIGINAL)
  const [selectedToppings, setSelectedToppings] = useState(
    new Set(initialPizza.defaultToppings)
  )
  const [itemNotes, setItemNotes] = useState('')

  // Reset state when modal opens or initialPizza changes
  useEffect(() => {
    if (isOpen) {
      setSelectedPizza(initialPizza)
      setSelectedSize(PIZZA_SIZES.MEDIUM)
      setSelectedCrust(CRUST_TYPES.ORIGINAL)
      setSelectedToppings(new Set(initialPizza.defaultToppings))
      setItemNotes('')
    }
  }, [isOpen, initialPizza])

  const handlePizzaChange = (pizza) => {
    setSelectedPizza(pizza)
    setSelectedToppings(new Set(pizza.defaultToppings))
  }

  const toggleTopping = (toppingId) => {
    const newToppings = new Set(selectedToppings)
    if (newToppings.has(toppingId)) {
      newToppings.delete(toppingId)
    } else {
      newToppings.add(toppingId)
    }
    setSelectedToppings(newToppings)
  }

  const calculatePrice = () => {
    let price = selectedPizza.basePrice

    // Add topping prices
    selectedToppings.forEach((toppingId) => {
      const topping = Object.values(TOPPINGS).find((t) => t.id === toppingId)
      if (topping && !selectedPizza.defaultToppings.includes(toppingId)) {
        price += topping.price
      }
    })

    price += selectedCrust.price
    price *= selectedSize.priceMultiplier

    return parseFloat(price.toFixed(2))
  }

  const currentPrice = calculatePrice()

  const handleAddToOrder = () => {
    const item = {
      id: Date.now(),
      name: selectedPizza.name,
      size: selectedSize.label,
      crust: selectedCrust.label,
      toppings: Array.from(selectedToppings).map(
        (id) => Object.values(TOPPINGS).find((t) => t.id === id)?.label
      ),
      price: currentPrice,
      notes: itemNotes,
      details: `${selectedSize.label} | ${selectedCrust.label}`,
    }
    onAdd(item)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex-none border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Customize Your Pizza
            </h2>
            <button
              onClick={onClose}
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
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Pizza Selection */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700">
                Select Base Pizza
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
                      className={`text-sm font-semibold ${
                        selectedPizza.id === pizza.id
                          ? 'text-indigo-900'
                          : 'text-gray-900'
                      }`}
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

            {/* Size & Crust */}
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
                      {crust.label} {crust.price > 0 && `(+$${crust.price})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Toppings */}
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

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Special Instructions
              </label>
              <textarea
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="e.g. Extra crispy, no onions, ranch dressing on side..."
                className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-inner ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                rows={3}
              />
            </div>
          </div>
        </div>
        <div className="flex-none border-t border-gray-100 bg-gray-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500">Total Price</p>
              <p className="text-2xl font-bold text-gray-900">
                ${currentPrice.toFixed(2)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel || onClose}
                className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToOrder}
                className="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
