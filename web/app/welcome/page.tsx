'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Setup = { checking: number; rent: number; payroll: number };

export default function Welcome() {
  const r = useRouter();
  const [s, setS] = useState<Setup>({ checking: 0, rent: 0, payroll: 0 });
  const [err, setErr] = useState('');

  // If already configured, skip to tracker
  useEffect(() => {
    try {
      const db = JSON.parse(localStorage.getItem('budgetDB') || 'null');
      if (db && db.base && typeof db.base.checking === 'number') {
        r.replace('/tracker');
      }
    } catch {}
  }, [r]);

  function saveAndGo(e: React.FormEvent) {
    e.preventDefault();
    const checking = Number(s.checking);
    const rent = Number(s.rent);
    const payroll = Number(s.payroll);
    if (!checking || !rent || !payroll) {
      setErr('Please enter all three amounts (numbers only).');
      return;
    }

    // Initialize client DB
    const db = {
      base: { checking },                 // immutable base
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

  const label = { fontSize: 12, opacity: 0.8, marginBottom: 4 };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0b1020', color: 'white' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: 'min(720px,90vw)', background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 22, border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
          <div style={{ paddingRight: 10 }}>
            <h1 style={{ fontWeight: 900, margin: 0, fontSize: 36 }}>
              Welcome, <span style={{ color: '#a5b4fc' }}>Pranaya</span> ✨
            </h1>
            <p style={{ opacity: 0.85, marginTop: 10, lineHeight: 1.5 }}>
              Your personal budget tracker—friendly charts, quick alerts, and a clean workflow.
              Enter your starting amounts once, then go track 🚀
            </p>
            <ul style={{ opacity: 0.8, lineHeight: 1.7 }}>
              <li>Stays in your browser (no signup)</li>
              <li>Add expenses by category; see a donut instantly</li>
              <li>One-tap “Rent paid” and “Payroll deposited”</li>
            </ul>
          </div>

          <form onSubmit={saveAndGo} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Get set up</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <label>
                <div style={label}>Checking (starting)</div>
                <input type="number" inputMode="decimal" step="0.01"
                  value={s.checking || ''} onChange={(e) => setS({ ...s, checking: Number(e.target.value) })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #3b3f59', background: '#0e1430', color: 'white' }} required />
              </label>
              <label>
                <div style={label}>Monthly Rent</div>
                <input type="number" inputMode="decimal" step="0.01"
                  value={s.rent || ''} onChange={(e) => setS({ ...s, rent: Number(e.target.value) })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #3b3f59', background: '#0e1430', color: 'white' }} required />
              </label>
              <label>
                <div style={label}>Typical Payroll</div>
                <input type="number" inputMode="decimal" step="0.01"
                  value={s.payroll || ''} onChange={(e) => setS({ ...s, payroll: Number(e.target.value) })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #3b3f59', background: '#0e1430', color: 'white' }} required />
              </label>

              {err && <div style={{ color: '#fecaca', fontSize: 13 }}>{err}</div>}

              <button type="submit"
                style={{ marginTop: 6, padding: '10px 14px', width: '100%', borderRadius: 10, border: '1px solid #475569', background: '#a5b4fc', color: '#0b1020', fontWeight: 700 }}>
                Continue to your Tracker →
              </button>
            </div>
          </form>
        </div>
        <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>Tip: You can always change these later by re-starting from this page.</div>
      </motion.div>
    </main>
  );
}
