import { NextResponse } from 'next/server';
import { resetAll } from '@/lib/store';
export const dynamic = 'force-dynamic';

export async function POST() {
  resetAll();
  return NextResponse.json({ ok: true });
}
