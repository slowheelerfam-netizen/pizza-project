'use client'

import { useState, useEffect } from 'react'

export default function DemoModeIndicator() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Only show on Vercel or if explicitly enabled
    // For now, we'll just show it always since this is a demo app
    setIsVisible(true)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {isExpanded && (
        <div className="w-72 animate-in slide-in-from-bottom-2 fade-in rounded-2xl border border-indigo-500/20 bg-gray-900/95 p-4 text-sm text-white shadow-2xl backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2 font-bold text-indigo-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
            Vercel / Demo Mode
          </div>
          <p className="mb-3 text-gray-300">
            This deployment uses <strong>Local Storage</strong>.
          </p>
          <ul className="mb-3 list-disc space-y-1 pl-4 text-xs text-gray-400">
            <li>Data is saved to <strong>your browser only</strong>.</li>
            <li>You cannot see orders from other devices.</li>
            <li>
              To test the full flow, open the <strong>Order Page</strong> and{' '}
              <strong>Kitchen View</strong> in separate tabs in this same browser.
            </li>
          </ul>
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-500"
          >
            Got it
          </button>
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center gap-2 rounded-full border border-indigo-500/30 bg-gray-900/80 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md transition-all hover:border-indigo-500 hover:bg-indigo-600"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
        </span>
        Demo Mode
      </button>
    </div>
  )
}
