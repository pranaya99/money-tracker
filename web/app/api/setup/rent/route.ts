import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const amt = Number(body.amount ?? body.value ?? 0) || 0;
  db.prefs.rent = amt;
  return NextResponse.json({ ok: true, prefs: db.prefs });
}
