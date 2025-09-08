// web/app/api/autopay/payroll/route.ts
import { NextResponse } from 'next/server';
import { addAlert, addTxn, db } from '../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let date = new Date().toISOString().slice(0, 10);
  let amt = 0;

  try {
    const body = await req.json().catch(() => ({} as any));
    if (body?.date) date = body.date;

    const input = Number(body?.amount ?? body?.value ?? db.prefs.payroll ?? 0);
    if (Number.isFinite(input)) amt = Math.abs(input);
  } catch {}

  const txn = addTxn({
    name: 'Payroll',
    amount: amt,
    date,
    category: 'Income',
  });

  const checkingBal = db.accounts.find(a => a.id === 'acc_checking')?.balance;
  addAlert('payroll_posted', `Payroll posted +$${amt.toFixed(0)}`, 'low', amt, checkingBal);

  return NextResponse.json({ ok: true, txn, accounts: db.accounts, prefs: db.prefs });
}
