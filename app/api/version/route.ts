import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { 'X-App-Version': process.env.NEXT_PUBLIC_APP_VERSION ?? '' },
    },
  )
}
