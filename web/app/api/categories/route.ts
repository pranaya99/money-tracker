import { NextResponse } from 'next/server';
import { db } from '@/lib/store';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ categories: db.categories.slice().sort() });
}
export async function POST(req: Request) {
  const { name } = await req.json();
  if (name && !db.categories.includes(name)) db.categories.push(name);
  return NextResponse.json({ ok: true });
}
