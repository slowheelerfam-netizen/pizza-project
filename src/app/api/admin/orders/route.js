import { NextResponse } from 'next/server'
import { PrismaOrderRepository } from '../../../../infrastructure/repositories/PrismaOrderRepository'

const repo = new PrismaOrderRepository()

// GET = polling endpoint
export async function GET() {
  try {
    const orders = await repo.getAll()
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('GET /api/orders failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST = placeholder (safe to keep)
export async function POST() {
  return NextResponse.json({ ok: true })
}

