export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { db } from "../../../../lib/store";
export async function POST(req: Request) {
  const { amount } = await req.json();
  db.prefs.rent = Number(amount) || 0;
  return NextResponse.json({ ok: true, rent: db.prefs.rent });
}
