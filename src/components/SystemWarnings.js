'use client'

import { useState } from 'react'
import { addWarningAction } from '../app/actions'

export default function SystemWarnings({ warnings }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [newReason, setNewReason] = useState('Prank Caller')
  const [customReason, setCustomReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newPhone) return

    const reasonToSubmit = newReason === 'Other' ? customReason : newReason
    if (!reasonToSubmit) return

    setIsSubmitting(true)
    await addWarningAction(newPhone, reasonToSubmit)
    setIsSubmitting(false)
    setIsAdding(false)
    setNewPhone('')
    setNewReason('Prank Caller')
    setCustomReason('')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
          warnings.length > 0
            ? 'bg-red-100 text-red-800 hover:bg-red-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <span
          className={`mr-1.5 h-2 w-2 rounded-full ${
            warnings.length > 0 ? 'animate-pulse bg-red-500' : 'bg-gray-400'
          }`}
        ></span>
        System Warnings ({warnings.length})
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-red-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6 text-red-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.401 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                    clipRule="evenodd"
                  />
                </svg>
                System Warnings
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-red-400 hover:bg-red-100 hover:text-red-600"
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
              <div className="mb-6 flex justify-end">
                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className="text-sm font-semibold text-red-600 underline hover:text-red-800"
                >
                  {isAdding ? 'Cancel Adding' : '+ Add Blacklist Number'}
                </button>
              </div>

              {isAdding && (
                <form
                  onSubmit={handleAdd}
                  className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4"
                >
                  <h4 className="mb-3 text-sm font-bold text-red-900">
                    Add Number to Blacklist
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-red-800">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="e.g. 555-0199"
                        className="mt-1 w-full rounded border border-red-200 p-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-red-800">
                        Reason
                      </label>
                      <select
                        value={newReason}
                        onChange={(e) => setNewReason(e.target.value)}
                        className="mt-1 w-full rounded border border-red-200 p-2 text-sm text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                      >
                        <option value="Prank Caller">Prank Caller</option>
                        <option value="Non-Payment">Non-Payment</option>
                        <option value="Abusive Staff">Abusive Staff</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {newReason === 'Other' && (
                      <div>
                        <label className="block text-xs font-medium text-red-800">
                          Specify Reason
                        </label>
                        <input
                          type="text"
                          required
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="Enter reason..."
                          className="mt-1 w-full rounded border border-red-200 p-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-2 w-full rounded bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Warning'}
                    </button>
                  </div>
                </form>
              )}

              {mergedWarnings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-gray-500 italic">
                    No active system warnings
                  </p>
                  <p className="text-xs text-gray-400">
                    Blacklisted numbers will appear here
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {mergedWarnings.map((w) => (
                    <li
                      key={w.id}
                      className="flex flex-col gap-1 rounded-lg border border-red-100 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-sm font-semibold text-red-900">
                          {w.reason}
                        </strong>
                        <span className="text-[10px] text-gray-400">
                          {new Date(w.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-medium">Phone:</span>
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-800">
                          {w.customerIdentifier?.phone || 'N/A'}
                        </code>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
