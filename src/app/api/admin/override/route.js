import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { orderService } from '../../../../lib/services'

export async function POST(request) {
  try {
    const body = await request.json()
    const { orderId, reason, comment } = body
    // Support both 'status' and 'newStatus' from client
    const status = body.status || body.newStatus

    if (!orderId || !status) {
      return NextResponse.json(
        { message: 'Missing orderId or status' },
        { status: 400 }
      )
    }

    // Admin override ignores state transitions validation usually,
    // but our service enforces it. For now, we use the standard update.
    const updatedOrder = await orderService.updateStatus(orderId, status)

    // Revalidate all relevant paths
    revalidatePath('/')
    revalidatePath('/kitchen')
    revalidatePath('/monitor')

    return NextResponse.json(
      { message: 'Order status updated successfully', order: updatedOrder },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API_ADMIN_OVERRIDE_POST_FAILED]', error)
    return NextResponse.json(
      { message: error.message || 'Failed to update order status' },
      { status: 500 }
    )
  }
}
