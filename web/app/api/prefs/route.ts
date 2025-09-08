// web/app/api/prefs/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Return the prefs from in-memory store
  return NextResponse.json({ prefs: db.prefs || {} });
}
