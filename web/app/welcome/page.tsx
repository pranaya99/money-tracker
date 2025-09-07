'use client';

export const dynamic = 'force-dynamic';


import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

// ---------- Currency helpers ----------
function formatCurrencyInput(raw: string) {
  let s = raw.replace(/[^\d.]/g, '');
  const dot = s.indexOf('.');
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
  if (!s.startsWith('0.') && s !== '') s = String(Number(s));
  const [intPart, decPart] = s.split('.');
  const grouped = intPart === '' ? '' : Number(intPart).toLocaleString('en-US');
  return decPart !== undefined ? `${grouped}.${decPart}` : grouped;
}
function parseCurrencyToNumber(s: string) {
  if (!s) return 0;
  return Number(s.replace(/,/g, ''));
}

type CurrencyInputProps = {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

// Single bordered wrapper prevents weird double rounding
function CurrencyInput({ label, value, onChange, placeholder }: CurrencyInputProps) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>{label}</span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid #ddd',
          borderRadius: 12,
          padding: '8px 10px',
          background: '#fff',
        }}
      >
        <span style={{ color: '#6b7280', fontSize: 14, marginRight: 6 }}>$</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder ?? '2,500'}
          onChange={(e) => onChange(formatCurrencyInput(e.target.value))}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '6px 4px',
            fontSize: 14,
            background: 'transparent',
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
          }}
        />
      </div>
    </label>
  );
}

export default function Welcome() {
  const router = useRouter();

  const [checkingStr, setCheckingStr] = useState('');
  const [rentStr, setRentStr] = useState('');
  const [payrollStr, setPayrollStr] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  const checkingNum = useMemo(() => parseCurrencyToNumber(checkingStr), [checkingStr]);
  const rentNum = useMemo(() => parseCurrencyToNumber(rentStr), [rentStr]);
  const payrollNum = useMemo(() => parseCurrencyToNumber(payrollStr), [payrollStr]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();

    // Reset then set prefs/balances
    await fetch('/api/reset', { method: 'POST' }).catch(() => {});
    await fetch('/api/setup/checking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance: checkingNum }),
    });
    await fetch('/api/setup/rent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: rentNum }),
    });
    await fetch('/api/setup/payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: payrollNum }),
    });

    router.push('/tracker');
  }

  return (
    <main
      style={{
        fontFamily: 'ui-sans-serif, system-ui',
        padding: '48px 24px',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
          gap: 32,
          alignItems: 'start',
        }}
      >
        {/* Left hero */}
        <div>
          <span
            style={{
              fontSize: 12,
              padding: '6px 10px',
              borderRadius: 999,
              background: '#EEF2FF',
              color: '#4F46E5',
            }}
          >
            ✨ Welcome, Pranaya
          </span>

          <h1
            style={{
              fontWeight: 800,
              fontSize: 52,
              lineHeight: 1.05,
              margin: '16px 0 12px',
            }}
          >
            Your personal <span style={{ color: '#4f46e5' }}>budget</span>{' '}
            <span style={{ color: '#4f46e5' }}>tracker</span>,
            <br />
            built to be friendly and simple.
          </h1>

          <p style={{ opacity: 0.8, maxWidth: 620, marginBottom: 18 }}>
            Set your <b>checking balance</b>, <b>monthly rent</b>, and{' '}
            <b>monthly payroll</b>. Then track spending with charts and alerts
          </p>

          {/* small soft shapes near text */}
          <div style={{ position: 'relative', height: 120 }}>
            <div
              style={{
                position: 'absolute',
                left: 10,
                top: 20,
                width: 120,
                height: 120,
                borderRadius: 24,
                background: 'rgba(99,102,241,0.38)',
                filter: 'blur(16px)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 200,
                top: -10,
                width: 170,
                height: 190,
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.28)',
                filter: 'blur(18px)',
              }}
            />
          </div>

          <p style={{ opacity: 0.6, fontSize: 13, marginTop: 6 }}>
            No bank connection needed, values are stored locally and on the
            serverless runtime for this demo.
          </p>
        </div>

        {/* Right: Setup card */}
        <form
          onSubmit={onSave}
          style={{
            marginTop: 28,
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: 14,
            padding: 20,
            boxShadow: '0 10px 28px rgba(0,0,0,.06)',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 22 }}>Quick setup</div>
          <p style={{ fontSize: 14, opacity: 0.75, marginBottom: 14 }}>
            Enter your information. You can always reset later from the tracker.
          </p>

          <CurrencyInput
            label="Checking Balance"
            value={checkingStr}
            onChange={setCheckingStr}
            placeholder="2,500"
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginTop: 12,
            }}
          >
            <CurrencyInput
              label="Monthly Rent"
              value={rentStr}
              onChange={setRentStr}
              placeholder="1,200"
            />
            <CurrencyInput
              label="Monthly Payroll"
              value={payrollStr}
              onChange={setPayrollStr}
              placeholder="1,500"
            />
          </div>

          <button
            disabled={!ready}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: '#EDE9FE',
              color: '#4f46e5',
              fontWeight: 700,
            }}
          >
            Save & Go to Tracker
          </button>

          <p style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            Tip: You can trigger autopay events (Rent/Payroll) from the Tracker page.
          </p>
        </form>
      </div>
    </main>
  );
}
