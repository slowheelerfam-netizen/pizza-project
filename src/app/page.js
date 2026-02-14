export const dynamic = 'force-dynamic'

import Link from 'next/link'
import CustomerOrderInterface from '../components/CustomerOrderInterface'
import { createOrderAction } from './actions'

export const metadata = {
  title: "Order Pizza | Don's Pizza Shop",
  description: 'Order the best pizza in town online.',
}

export default async function Home() {
  return (
    <main className="relative min-h-screen">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10">
        {/* Dev Navigation */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-slate-500/20 px-6 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-slate-500/30 active:scale-95"
            >
              Register
            </Link>
            <Link
              href="/kitchen"
              className="rounded-full bg-blue-500/20 px-6 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-blue-500/30 active:scale-95"
            >
              Kitchen
            </Link>
            <Link
              href="/oven"
              className="rounded-full bg-orange-500/20 px-6 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-orange-500/30 active:scale-95"
            >
              Oven
            </Link>
            <Link
              href="/monitor"
              className="rounded-full bg-green-500/20 px-6 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-green-500/30 active:scale-95"
            >
              Live Prep Queue
            </Link>
          </div>
        </header>

        <CustomerOrderInterface createOrderAction={createOrderAction} />
      </div>
    </main>
  )
}
