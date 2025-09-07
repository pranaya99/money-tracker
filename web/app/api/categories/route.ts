export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { db } from "../../../lib/store";

export async function GET() {
  return NextResponse.json({ categories: db.categories });
}
export async function POST(req: Request) {
  const { name } = await req.json();
  if (name && !db.categories.includes(name)) db.categories.push(name);
  return NextResponse.json({ ok: true, categories: db.categories });
}
