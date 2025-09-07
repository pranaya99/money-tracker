export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { addAlert, addTxn, db } from "../../../../lib/store";
export async function POST(req: Request) {
  const { date, amount } = await req.json();
  const amt = Number(amount) || db.prefs.rent || 0;
  const txn = addTxn({ name: "Rent", amount: -Math.abs(amt), date, category: "Rent" });
  addAlert("rent_paid", `Rent paid -$${Math.abs(amt).toFixed(0)}`, "medium", -Math.abs(amt));
  return NextResponse.json({ ok: true, txn });
}
