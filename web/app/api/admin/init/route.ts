import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  await sql/*sql*/`
  CREATE TABLE IF NOT EXISTS accounts (
    id        text PRIMARY KEY,
    name      text NOT NULL,
    type      text NOT NULL,
    balance   numeric NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id         text PRIMARY KEY,
    account_id text NOT NULL,
    name       text NOT NULL,
    amount     numeric NOT NULL,
    date       date NOT NULL,
    category   text
  );
  CREATE TABLE IF NOT EXISTS expenses (
    id       text PRIMARY KEY,
    name     text NOT NULL,
    category text,
    amount   numeric NOT NULL,
    date     date NOT NULL
  );
  CREATE TABLE IF NOT EXISTS alerts (
    id         text PRIMARY KEY,
    kind       text NOT NULL,
    message    text NOT NULL,
    severity   text NOT NULL,
    amount     numeric,
    balance    numeric,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS prefs (
    id       int PRIMARY KEY DEFAULT 1,
    checking numeric NOT NULL DEFAULT 0,
    rent     numeric NOT NULL DEFAULT 0,
    payroll  numeric NOT NULL DEFAULT 0
  );

  INSERT INTO accounts (id, name, type, balance)
  VALUES ('acc_checking','Checking','depository',0)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO prefs (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;
  `;
  return NextResponse.json({ ok: true });
}
