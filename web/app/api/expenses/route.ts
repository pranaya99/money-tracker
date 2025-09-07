export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { db, addExpense } from "../../../lib/store";

export async function GET() {
  return NextResponse.json({ expenses: db.expenses });
}
export async function POST(req: Request) {
  const { name, category, amount, date } = await req.json();
  const ex = addExpense({ name, category: (category || "Other"), amount: Number(amount) || 0, date });
  return NextResponse.json({ ok: true, expense: ex });
}
