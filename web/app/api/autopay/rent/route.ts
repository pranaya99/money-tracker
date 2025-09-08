// web/app/api/autopay/rent/route.ts
import { NextResponse } from 'next/server';
import { addAlert, addExpense, db } from '../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let date = new Date().toISOString().slice(0, 10);
  let amt = 0;

  try {
    const body = await req.json().catch(() => ({} as any));
    if (body?.date) date = body.date;

    const input = Number(body?.amount ?? body?.value ?? db.prefs.rent ?? 0);
    if (Number.isFinite(input)) amt = Math.abs(input);
  } catch {}

  // ✅ Add expense (also mirrors a -txn under the hood)
  addExpense({ name: 'Rent', category: 'Rent', amount: amt, date });

  const checkingBal = db.accounts.find(a => a.id === 'acc_checking')?.balance;
  addAlert('rent_paid', `Rent paid -$${amt.toFixed(0)}`, 'medium', -amt, checkingBal);

  return NextResponse.json({ ok: true, accounts: db.accounts, prefs: db.prefs });
}
