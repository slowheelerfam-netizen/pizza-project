import { NextResponse } from 'next/server'
import { createServerServices } from '@/server/services'

export const runtime = 'nodejs' // REQUIRED — Edge runtime breaks file-based repos

export async function POST(req) {
  let payload

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON payload' },
      { status: 400 }
    )
  }

  const { orderId, status, reason, comment, explicitOverride } = payload
  const { orderService } = createServerServices()

  // 🚨 HARD GUARD: override must be explicit
  if (explicitOverride !== true) {
    return NextResponse.json(
      {
        success: false,
        message: 'Admin override requires explicitOverride=true'
      },
      { status: 400 }
    )
  }

  if (!orderId || !status) {
    return NextResponse.json(
      { success: false, message: 'Missing orderId or status' },
      { status: 400 }
    )
  }

  try {
    await orderService.adminOverrideStatus(
      'admin-api',
      orderId,
      status,
      reason || 'Manual override',
      comment || null
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADMIN_OVERRIDE_FAILED]', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

