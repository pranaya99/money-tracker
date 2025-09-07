export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { addAlert, addTxn, db } from "../../../../lib/store";
export async function POST(req: Request) {
  const { date, amount } = await req.json();
  const amt = Number(amount) || db.prefs.payroll || 0;
  const txn = addTxn({ name: "Payroll", amount: Math.abs(amt), date, category: "Income" });
  addAlert("payroll_posted", `Payroll posted +$${Math.abs(amt).toFixed(0)}`, "low", Math.abs(amt));
  return NextResponse.json({ ok: true, txn });
}
