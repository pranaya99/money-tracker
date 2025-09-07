import { NextResponse } from 'next/server';
import { addAlert, addExpense, db } from '../../../../lib/store';

export async function POST(req: Request) {
  const { date, amount } = await req.json();
  const amt = Number(amount) || db.prefs.rent || 0;

  // Add expense (which mirrors a -txn under the hood)
  const exp = addExpense({ name: 'Rent', category: 'Rent', amount: Math.abs(amt), date });

  addAlert('rent_paid', `Rent paid -$${Math.abs(amt).toFixed(0)}`, 'medium', -Math.abs(amt));
  return NextResponse.json({ ok: true, exp });
}
