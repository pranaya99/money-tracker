'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

type Setup = { checking: number; rent: number; payroll: number };

function readDB() {
  try { return JSON.parse(localStorage.getItem('budgetDB') || 'null'); } catch { return null; }
}

export default function Welcome() {
  const r = useRouter();
  const existing = readDB();
  const [s, setS] = useState<Setup>({
    checking: existing?.base?.checking ?? 0,
    rent: existing?.prefs?.rent ?? 0,
    payroll: existing?.prefs?.payroll ?? 0,
  });
  const [err, setErr] = useState('');

  function saveAndGo(e: React.FormEvent) {
    e.preventDefault();
    const checking = Number(s.checking);
    const rent = Number(s.rent);
    const payroll = Number(s.payroll);
    if (!checking || !rent || !payroll) {
      setErr('Please enter all three amounts.');
      return;
    }
    // Overwrite DB => clean slate
    const db = {
      base: { checking },
      txns: [] as { id: string; name: string; amount: number; date: string; category?: string }[],
      expenses: [] as { id: string; name: string; category: string; amount: number; date: string }[],
      alerts: [] as { id: string; kind: string; message: string; created_at: string }[],
      categories: [] as string[],
      prefs: { rent, payroll },
      connected: false,
    };
    localStorage.setItem('budgetDB', JSON.stringify(db));
    r.push('/tracker');
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b1020', color: 'white' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: 'min(900px,92vw)',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: 22,
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 20 }}>
          {/* Left: hero copy */}
          <div style={{ paddingRight: 10 }}>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: 40, lineHeight: 1.1 }}>
              Welcome, <span style={{ color: '#a5b4fc' }}>Pranaya</span> ✨
            </h1>
            <p style={{ opacity: 0.9, marginTop: 12, lineHeight: 1.5, fontSize: 16 }}>
              Your personal budget tracker — crystal-clear charts, friendly alerts, and one-tap actions.
              Set your starting numbers once, then hop in and track.
            </p>
            <ul style={{ opacity: 0.85, lineHeight: 1.7, marginTop: 10 }}>
              <li>All client-side (no sign-in)</li>
              <li>Categories + donut chart instantly</li>
              <li>Quick actions: <strong>Rent paid</strong>, <strong>Payroll deposited</strong></li>
            </ul>
          </div>

          {/* Right: setup form */}
          <form onSubmit={saveAndGo} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Get set up</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <Field label="Checking (starting)">
                <input
                  type="number" inputMode="decimal" step="0.01" required
                  value={s.checking || ''} onChange={(e)=>setS({...s, checking: Number(e.target.value)})}
                  style={inputStyle}
                />
              </Field>
              <Field label="Monthly Rent">
                <input
                  type="number" inputMode="decimal" step="0.01" required
                  value={s.rent || ''} onChange={(e)=>setS({...s, rent: Number(e.target.value)})}
                  style={inputStyle}
                />
              </Field>
              <Field label="Typical Payroll">
                <input
                  type="number" inputMode="decimal" step="0.01" required
                  value={s.payroll || ''} onChange={(e)=>setS({...s, payroll: Number(e.target.value)})}
                  style={inputStyle}
                />
              </Field>

              {err && <div style={{ color: '#fecaca', fontSize: 13 }}>{err}</div>}

              <button type="submit"
                style={{ marginTop: 4, padding: '11px 14px', width: '100%', borderRadius: 10, border: '1px solid #475569', background: '#a5b4fc', color: '#0b1020', fontWeight: 800 }}>
                Save & Continue →
              </button>

              {existing && (
                <button type="button" onClick={()=>r.push('/tracker')}
                  style={{ padding: '9px 14px', width: '100%', borderRadius: 10, border: '1px solid #475569', background: 'transparent', color: 'white' }}>
                  Continue to tracker (keep current)
                </button>
              )}
            </div>
          </form>
        </div>
        <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>
          Tip: Saving here overwrites the current data and starts fresh.
        </div>
      </motion.div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 12, opacity: 0.85 }}>{label}</div>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 10,
  borderRadius: 8,
  border: '1px solid #3b3f59',
  background: '#0e1430',
  color: 'white',
};
