import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Quick DB ping
    db.prepare('SELECT 1').get()

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      { status: 'error', db: 'disconnected', error: String(err) },
      { status: 503 }
    )
  }
}
