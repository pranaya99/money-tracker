import { NextResponse } from 'next/server';
import { addExpense, db } from '@/lib/store';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ expenses: db.expenses });
}
export async function POST(req: Request) {
  const body = await req.json();
  const { name, category, amount, date } = body;
  addExpense({ name, category, amount: Number(amount)||0, date });
  return NextResponse.json({ ok: true });
}
