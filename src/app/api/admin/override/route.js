import { NextResponse } from 'next/server'
import { createRepositories } from '@/lib/repositoryFactory'

export const runtime = 'nodejs' // REQUIRED — Edge runtime breaks file-based repos

export async function POST(req) {
  const { orderId, status, reason } = await req.json()

  const repos = createRepositories()
  const orderRepo = repos.order
  const adminActionRepo = repos.adminAction

  if (!orderId || !status) {
    return NextResponse.json(
      { success: false, message: 'Missing orderId or status' },
      { status: 400 }
    )
  }

  await orderRepo.updateStatus(orderId, status)

  await adminActionRepo.log({
    type: 'ADMIN_OVERRIDE',
    orderId,
    reason: reason || 'Manual override',
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
