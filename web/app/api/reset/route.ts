// web/app/api/reset/route.ts
import { NextResponse } from 'next/server';
import { resetAll } from '../../../lib/store'; // ✅ correct depth from app/api/reset/route.ts

export async function POST() {
  resetAll();
  return NextResponse.json({ ok: true });
}
