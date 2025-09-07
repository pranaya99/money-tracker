import { NextResponse } from 'next/server';
import { db } from '../../../../lib/store';

export async function POST(req: Request) {
  const { amount } = await req.json();
  db.prefs.payroll = Number(amount) || 0;
  return NextResponse.json({ ok: true, payroll: db.prefs.payroll });
}
