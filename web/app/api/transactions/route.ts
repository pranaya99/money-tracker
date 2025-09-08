import { NextResponse } from 'next/server';
import { db } from '@/lib/store';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ transactions: db.transactions });
}
