import { NextResponse } from 'next/server';
import { setChecking, db } from '../../../../lib/store';

export async function POST(req: Request) {
  const { balance } = await req.json();
  setChecking(Number(balance) || 0);
  return NextResponse.json({ ok: true, accounts: db.accounts });
}
