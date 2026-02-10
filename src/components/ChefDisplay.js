'use client'

import React from 'react'
import { ORDER_STATUS } from '../types/models'
import OrderDetailsModal from './OrderDetailsModal'

export default function ChefDisplay({ orders }) {
  const [detailsOrder, setDetailsOrder] = React.useState(null)

  const chefOrders = orders
    .filter(
      (o) =>
        o.assumeChefRole === true &&
        [ORDER_STATUS.IN_PREP, ORDER_STATUS.OVEN, ORDER_STATUS.READY].includes(
          o.status
        )
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const renderOrder = (order) => (
    <div
      key={order.id}
      onDoubleClick={() => setDetailsOrder(order)}
      className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-3 shadow-md hover:bg-white/10"
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-white">
          {order.customerSnapshot?.name || 'Walk-in'}
        </span>
        <span className="text-xs text-white/60">{order.status}</span>
      </div>
    </div>
  )

  return (
    <>
      <div className="space-y-2">
        {chefOrders.map(renderOrder)}
      </div>

      <OrderDetailsModal
        isOpen={!!detailsOrder}
        order={detailsOrder}
        onClose={() => setDetailsOrder(null)}
      />
    </>
  )
}

