'use client'

import { useState, useEffect } from 'react'
import { updateOrderDetailsAction } from '../app/actions'
import { MENU_ITEMS, PIZZA_SIZES, CRUST_TYPES, TOPPINGS } from '../types/models'

const generateId = () => Date.now()

export default function OrderEditModal({
  order,
  isOpen,
  onClose,
  viewContext = 'REGISTER', // 'REGISTER' | 'KITCHEN' | 'OVEN' | 'MONITOR'
  onStatusUpdate,
  onPriorityToggle,
  onPrint,
  employees = [],
}) {
  // Cart state
  const [items, setItems] = useState([])

  // Item Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)

  // Customer State
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderType, setOrderType] = useState('PICKUP')
  const [address, setAddress] = useState('')

  // Workflow State
  const [assignment, setAssignment] = useState('')
  const [shouldPrint, setShouldPrint] = useState(false)

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
      setTimeout(() => {
        setItems(order.items || [])
        setCustomerName(order.customerSnapshot?.name || '')
        setCustomerPhone(order.customerSnapshot?.phone || '')
        setOrderType(order.customerSnapshot?.type || 'PICKUP')
        setAddress(order.customerSnapshot?.address || '')
        setAssignment(order.assignedTo || '')
        setIsPriority(order.isPriority || false) // Sync local priority state
        setError(null)
      }, 0)
    }
  }, [order, isOpen])

  // Local state for priority to handle immediate UI feedback
  const [isPriority, setIsPriority] = useState(false)
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false)

  if (!isOpen || !order) return null

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
      id: generateId(),
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

  // --- WORKFLOW ACTION HANDLERS ---

  const handleWorkflowAction = async (newStatus, assignedToOverride = null) => {
    if (onStatusUpdate) {
      // If printing is requested and supported
      if (shouldPrint && onPrint) {
        onPrint(order)
      }
      await onStatusUpdate(
        order.id,
        newStatus,
        assignedToOverride || assignment
      )
      onClose()
    }
  }

  const renderWorkflowActions = () => {
    // REGISTER CONTEXT
    if (viewContext === 'REGISTER') {
      if (['NEW', 'CONFIRMED'].includes(order.status)) {
        return (
          <div className="space-y-4 rounded-xl bg-blue-50 p-4">
            <h3 className="text-sm font-bold text-blue-900 uppercase">
              Register Actions
            </h3>

            {/* Priority Toggle - Always visible in Register view */}
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 shadow-sm transition-all ${
                isPriority
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-white hover:border-yellow-200'
              }`}
            >
              <input
                type="checkbox"
                checked={isPriority}
                disabled={isUpdatingPriority}
                onChange={async (e) => {
                  const newValue = e.target.checked
                  setIsPriority(newValue) // Update local state immediately
                  setIsUpdatingPriority(true)
                  if (onPriorityToggle) {
                    await onPriorityToggle(order.id, newValue)
                  }
                  setIsUpdatingPriority(false)
                }}
                className="h-5 w-5 rounded border-yellow-400 text-yellow-600 focus:ring-yellow-500 disabled:opacity-50"
              />
              <span
                className={`font-bold ${isPriority ? 'text-yellow-800' : 'text-gray-700'}`}
              >
                {isUpdatingPriority ? 'Saving...' : 'High Priority Order'}
              </span>
            </label>

            <button
              onClick={() =>
                handleWorkflowAction(
                  order.assumeChefRole ? 'MONITOR' : 'IN_PREP'
                )
              }
              disabled={isUpdatingPriority}
              className={`w-full rounded-lg py-3 text-lg font-bold text-white shadow-lg transition-all active:scale-95 ${
                isUpdatingPriority
                  ? 'cursor-wait bg-gray-400'
                  : order.assumeChefRole
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {order.assumeChefRole ? 'Send to Monitor 📺' : 'Send to Prep 👨‍🍳'}
            </button>
          </div>
        )
      }
      return (
        <div className="rounded-xl bg-gray-50 p-4 text-center text-gray-500">
          Order is {order.status}. No workflow actions.
        </div>
      )
    }

    // KITCHEN CONTEXT
    if (viewContext === 'KITCHEN') {
      // NEW Orders -> Assign & Prep
      if (['NEW', 'CONFIRMED'].includes(order.status)) {
        const availableStaff = employees.filter((e) => Boolean(e.isOnDuty))
        const isAssignable = assignment !== ''

        return (
          <div className="space-y-4 rounded-xl bg-indigo-50 p-4">
            <h3 className="text-sm font-bold text-indigo-900 uppercase">
              Kitchen Actions
            </h3>

            <div className="rounded-lg bg-white p-2 shadow-sm">
              <label className="mb-1 block text-xs font-bold text-gray-500">
                Assign To:
              </label>
              <select
                value={assignment}
                onChange={(e) => setAssignment(e.target.value)}
                className="w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select Staff --</option>
                {availableStaff.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleWorkflowAction('IN_PREP', assignment)}
              disabled={!isAssignable}
              className={`w-full rounded-lg py-3 text-lg font-bold text-white shadow-lg transition-all active:scale-95 ${
                isAssignable
                  ? 'bg-indigo-600 hover:bg-indigo-500'
                  : 'cursor-not-allowed bg-gray-400'
              }`}
            >
              START PREP 🔪
            </button>
          </div>
        )
      }

      // PREP/OVEN -> Monitor/Ready
      if (['IN_PREP', 'OVEN'].includes(order.status)) {
        return (
          <div className="space-y-4 rounded-xl bg-indigo-50 p-4">
            <h3 className="text-sm font-bold text-indigo-900 uppercase">
              Kitchen Actions
            </h3>

            <div className="flex items-center justify-end">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={shouldPrint}
                  onChange={(e) => setShouldPrint(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Print Label
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleWorkflowAction('MONITOR')}
                disabled={order.status === 'OVEN'}
                className={`rounded-lg py-3 text-sm font-bold text-white shadow-md transition-all active:scale-95 ${
                  order.status === 'OVEN'
                    ? 'cursor-not-allowed bg-gray-300'
                    : 'bg-green-500 hover:bg-green-400'
                }`}
              >
                TO MONITOR 📺
              </button>

              <button
                onClick={() => handleWorkflowAction('READY')}
                className="rounded-lg bg-green-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-green-500 active:scale-95"
              >
                MARK READY ✅
              </button>
            </div>
          </div>
        )
      }

      return (
        <div className="rounded-xl bg-gray-50 p-4 text-center text-gray-500">
          Order is {order.status}. No actions.
        </div>
      )
    }

    // OVEN CONTEXT
    if (viewContext === 'OVEN') {
      if (['MONITOR', 'OVEN'].includes(order.status)) {
        return (
          <div className="space-y-4 rounded-xl bg-orange-50 p-4">
            <h3 className="text-sm font-bold text-orange-900 uppercase">
              Oven Actions
            </h3>

            <div className="flex items-center justify-end">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={shouldPrint}
                  onChange={(e) => setShouldPrint(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Print Label
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleWorkflowAction('OVEN')}
                disabled={order.status === 'OVEN'}
                className={`rounded-lg py-3 text-sm font-bold text-white shadow-md ${
                  order.status === 'OVEN'
                    ? 'cursor-not-allowed bg-gray-300'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                IN OVEN 🔥
              </button>
              <button
                onClick={() => handleWorkflowAction('READY')}
                disabled={order.status === 'MONITOR'}
                className={`rounded-lg py-3 text-sm font-bold text-white shadow-md transition-all active:scale-95 ${
                  order.status === 'MONITOR'
                    ? 'cursor-not-allowed bg-gray-300'
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                READY ✅
              </button>
            </div>
          </div>
        )
      }
    }

    return null
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Order #{order?.id.slice(0, 8)}
                </h2>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Modify details or advance workflow
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
            <div className="grid gap-8 lg:grid-cols-3">
              {/* LEFT COLUMN: EDIT FORM (2 cols wide) */}
              <div className="space-y-8 lg:col-span-2">
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

              {/* RIGHT COLUMN: WORKFLOW ACTIONS (1 col wide) */}
              <div className="lg:col-span-1">
                {renderWorkflowActions()}

                {/* Total and Save Actions */}
                <div className="mt-8 rounded-xl bg-gray-50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500 uppercase">
                      Total
                    </span>
                    <span className="text-2xl font-black text-gray-900">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-black disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                    </button>

                    <button
                      onClick={onClose}
                      className="w-full rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NESTED BUILDER MODAL */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="flex h-full max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex flex-none items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
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

            <div className="flex-1 overflow-y-auto p-6">
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
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    placeholder="Any special instructions for this item?"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs tracking-wider text-gray-500 uppercase">
                    Item Price
                  </span>
                  <div className="text-xl font-bold text-gray-900">
                    ${currentItemPrice.toFixed(2)}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsBuilderOpen(false)}
                    className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addItemToOrder}
                    className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-700"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
