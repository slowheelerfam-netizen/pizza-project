import { DEMO_MODE } from './appConfig'
import { NextResponse } from 'next/server'

export function blockIfDemo(message = 'Action disabled in demo mode') {
  if (DEMO_MODE) {
    return NextResponse.json(
      { ok: true, demo: true, message },
      { status: 200 }
    )
  }
  return null
}
