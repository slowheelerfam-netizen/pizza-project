'use client'

import { useState, useEffect } from 'react'

export default function DemoModeIndicator() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    setIsVisible(
      process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    )
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {isExpanded && (
        <div className="w-72 rounded-2xl border border-indigo-500/20 bg-gray-900/95 p-4 text-sm text-white shadow-2xl backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2 font-bold text-indigo-400">
            Demo Mode Active
          </div>

          <ul className="mb-3 list-disc space-y-1 pl-4 text-xs text-gray-400">
            <li>Orders are marked as DEMO</li>
            <li>Customer name & phone are masked</li>
            <li>No real customer data is stored</li>
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
        DEMO
      </button>
    </div>
  )
}

