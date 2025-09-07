'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Welcome() {
  const router = useRouter();

  const [checking, setChecking] = useState('');
  const [rent, setRent] = useState('');
  const [payroll, setPayroll] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function saveAndGo(e: React.FormEvent) {
    e.preventDefault(); // IMPORTANT: stop browser from reloading /welcome
    setErr(null);

    const c = Number(checking);
    const r = Number(rent);
    const p = Number(payroll);

    if (!Number.isFinite(c) || c <= 0) {
      setErr('Please enter a valid positive number for Checking.');
      return;
    }
    if (!Number.isFinite(r) || r <= 0) {
      setErr('Please enter a valid positive number for Rent.');
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      setErr('Please enter a valid positive number for Monthly Payroll.');
      return;
    }

    setBusy(true);
    try {
      // Store base prefs in your in-memory store via API routes
      await Promise.all([
        fetch('/api/setup/checking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ balance: c }),
        }),
        fetch('/api/setup/rent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ amount: r }),
        }),
        fetch('/api/setup/payroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ amount: p }),
        }),
      ]);

      // Client navigation (fast)
      router.replace('/tracker');

      // Hard fallback for SSR/router edge cases on Vercel
      setTimeout(() => {
        if (window.location.pathname !== '/tracker') {
          window.location.assign('/tracker');
        }
      }, 150);
    } catch (e: any) {
      console.error(e);
      setErr('Failed to save. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(1200px 600px at 10% -10%, #EEF2FF 10%, transparent), radial-gradient(800px 400px at 90% 110%, #ECFDF5 10%, transparent)',
        padding: 24,
        fontFamily: 'ui-sans-serif, system-ui',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 720,
          background: '#fff',
          border: '1px solid #eee',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Welcome, Pranaya ✨</h1>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Your personal budget tracker</span>
        </header>

        <p style={{ marginTop: 10, opacity: 0.85 }}>
          Set your starting values and we’ll personalize your tracker. You can always reset later.
        </p>

        <form onSubmit={saveAndGo} style={{ display: 'grid', gap: 14, marginTop: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ fontWeight: 600 }}>
              How much money is in your <span style={{ color: '#4f46e5' }}>Checking</span> account?
            </label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              required
              placeholder="e.g., 2500"
              value={checking}
              onChange={(e) => setChecking(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #ddd',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ fontWeight: 600 }}>
              What’s your monthly <span style={{ color: '#ef4444' }}>Rent</span>?
            </label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              required
              placeholder="e.g., 1200"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #ddd',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ fontWeight: 600 }}>
              What’s your monthly <span style={{ color: '#22c55e' }}>Payroll</span> (take-home)?
            </label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              required
              placeholder="e.g., 3000"
              value={payroll}
              onChange={(e) => setPayroll(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #ddd',
                outline: 'none',
              }}
            />
          </div>

          {err && (
            <div
              style={{
                marginTop: 4,
                color: '#b91c1c',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: 10,
                padding: '8px 12px',
              }}
            >
              {err}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ddd',
                background: busy ? '#e5e7eb' : '#eef2ff',
                cursor: busy ? 'not-allowed' : 'pointer',
                fontWeight: 700,
              }}
            >
              {busy ? 'Saving…' : 'Go to my tracker →'}
            </button>
            <button
              type="button"
              onClick={() => {
                setChecking('');
                setRent('');
                setPayroll('');
                setErr(null);
              }}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ddd',
                background: '#fff',
              }}
            >
              Clear
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
            💡 We’ll use these values to set your Checking balance and remind you about rent & payroll.
          </div>
        </form>
      </motion.div>
    </main>
  );
}
