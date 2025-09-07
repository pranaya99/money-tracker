import { NextResponse } from "next/server";
import { setChecking } from "../../../../lib/store";
export async function POST(req: Request) {
  const { balance } = await req.json();
  const bal = Number(balance) || 0;
  setChecking(bal);
  return NextResponse.json({ ok: true, balance: bal });
}
