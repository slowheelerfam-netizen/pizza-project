import PublicOrderInterface from '../../components/PublicOrderInterface'

export const metadata = {
  title: 'Order Pizza | Don\'s Pizza Shop',
  description: 'Order the best pizza in town online.',
}

export default function OrderPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 py-6 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Don's Pizza Shop</h1>
          <p className="mt-2 text-indigo-100">Hot, fresh, and ready for you!</p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <PublicOrderInterface />
      </div>
    </main>
  )
}
