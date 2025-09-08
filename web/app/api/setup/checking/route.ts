import { NextResponse } from 'next/server';
import { db, setChecking } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const v = Number(body.value ?? body.balance ?? body.amount ?? 0) || 0;
  setChecking(v);
  db.prefs.checking = v;
  return NextResponse.json({ ok: true, accounts: db.accounts, prefs: db.prefs });
}
