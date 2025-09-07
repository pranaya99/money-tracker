'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useAnimationControls } from 'framer-motion';

const API = process.env.NEXT_PUBLIC_API_BASE ?? "";

function toNumber(v: string) {
  const n = parseFloat((v || '').replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? NaN : n;
}

export default function Welcome() {
  const router = useRouter();

  // 3 required steps: checking → rent → payroll
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [checking, setChecking] = useState('');
  const [rent, setRent] = useState('');
  const [payroll, setPayroll] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // pretty blobs
  const controls = useAnimationControls();
  useEffect(() => {
    controls.start(i => ({
      y: [0, -12, 0],
      transition: { duration: 6 + i, repeat: Infinity, ease: 'easeInOut' }
    }));
  }, [controls]);

  function next() {
    setErr(null);
    if (step === 1) {
      const n = toNumber(checking);
      if (!isFinite(n) || n <= 0) return setErr('Please enter a valid checking balance (> 0).');
      setStep(2);
    } else if (step === 2) {
      const n = toNumber(rent);
      if (!isFinite(n) || n <= 0) return setErr('Please enter a valid monthly rent (> 0).');
      setStep(3);
    }
  }

  async function saveAndGo() {
    setErr(null);
    const c = toNumber(checking);
    const r = toNumber(rent);
    const p = toNumber(payroll);
    if (![c, r, p].every(x => isFinite(x) && x > 0)) {
      return setErr('Please fill all values with amounts greater than 0.');
    }

    // Persist for tracker
    localStorage.setItem('initialChecking', String(c));
    localStorage.setItem('monthlyRent', String(r));
    localStorage.setItem('payrollAmount', String(p));

    // optional: best-effort API seeds (safe if not implemented)
    setSaving(true);
    try {
      await fetch(`${API}/api/setup/checking`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: c })
      }).catch(() => {});
      await fetch(`${API}/api/setup/rent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: r })
      }).catch(() => {});
      await fetch(`${API}/api/setup/payroll`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: p })
      }).catch(() => {});
    } finally {
      setSaving(false);
      router.push('/tracker');
    }
  }

  return (
    <main style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'linear-gradient(180deg,#f7f7ff 0%,#ffffff 100%)', overflow:'hidden', padding:16 }}>
      {[0,1,2,3].map((i) => (
        <motion.div key={i} custom={i} animate={controls}
          style={{
            position:'absolute', width:220 - i*30, height:220 - i*30, borderRadius:'50%',
            background: i%2 ? 'rgba(99,102,241,0.16)' : 'rgba(34,197,94,0.14)',
            filter:'blur(10px)', top: i%2 ? 80 : 'unset', bottom: i%2 ? 'unset' : 80,
            left: i<2 ? 80 : 'unset', right: i<2 ? 'unset' : 80, zIndex:0
          }}
        />
      ))}

      <section style={{ width:'min(880px,92vw)', background:'#fff', border:'1px solid #eee', borderRadius:16, padding:28, boxShadow:'0 10px 30px rgba(0,0,0,0.05)', position:'relative', zIndex:1 }}>
        <h1 style={{ fontSize:34, fontWeight:800, marginBottom:8, lineHeight:1.2 }}>
          Welcome, <span style={{ background:'linear-gradient(90deg,#6366F1,#22C55E)', WebkitBackgroundClip:'text', color:'transparent' }}>Pranaya</span> — to your personal budget tracker ✨
        </h1>
        <p style={{ opacity:.75, marginBottom:18 }}>Tell us a few numbers and we’ll personalize your tracker.</p>

        {/* stepper */}
        <div style={{ display:'flex', gap:10, marginBottom:18 }}>
          {['Checking balance','Monthly rent','Payroll amount'].map((label, i) => {
            const n = (i+1) as 1|2|3;
            const active = step >= n;
            const colors = ['#6366F1','#22C55E','#F59E0B'];
            return (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:26, height:26, borderRadius:999, background: active ? colors[i] : '#e5e7eb', color:'#fff', display:'grid', placeItems:'center', fontSize:13, fontWeight:700 }}>{n}</div>
                <div style={{ fontSize:13, opacity: active ? 1 : .6 }}>{label}</div>
                {i<2 && <div style={{ height:2, background:'#eee', width:36, marginInline:8 }} />}
              </div>
            );
          })}
        </div>

        {err && <div style={{ margin:'6px 0 12px', padding:'8px 10px', border:'1px solid #fee2e2', background:'#fff1f2', color:'#b91c1c', borderRadius:8 }}>{err}</div>}

        {/* Step content */}
        {step === 1 && (
          <div style={{ border:'1px solid #eee', borderRadius:12, padding:18, marginBottom:12 }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>How much money is in your checking account?</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ opacity:.7 }}>$</span>
              <input value={checking} inputMode="decimal" onChange={e=>setChecking(e.target.value)} placeholder="e.g., 3280"
                style={{ padding:'10px 12px', border:'1px solid #ddd', borderRadius:10, width:220 }} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ border:'1px solid #eee', borderRadius:12, padding:18, marginBottom:12 }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>What’s your monthly rent?</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ opacity:.7 }}>$</span>
              <input value={rent} inputMode="decimal" onChange={e=>setRent(e.target.value)} placeholder="e.g., 1200"
                style={{ padding:'10px 12px', border:'1px solid #ddd', borderRadius:10, width:220 }} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ border:'1px solid #eee', borderRadius:12, padding:18, marginBottom:12 }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>What’s your typical payroll deposit?</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ opacity:.7 }}>$</span>
              <input value={payroll} inputMode="decimal" onChange={e=>setPayroll(e.target.value)} placeholder="e.g., 1500"
                style={{ padding:'10px 12px', border:'1px solid #ddd', borderRadius:10, width:220 }} />
            </div>
          </div>
        )}

        {/* actions */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
          <button onClick={()=> setStep(Math.max(1, (step-1) as 1|2|3))}
            style={{ padding:'10px 14px', border:'1px solid #ddd', borderRadius:10, background:'#fff' }}>
            Back
          </button>

          {step < 3 ? (
            <button onClick={next}
              style={{ padding:'10px 14px', border:'1px solid #ddd', borderRadius:10, background:'#f7f7ff' }}>
              Next
            </button>
          ) : (
            <button onClick={saveAndGo} disabled={saving}
              style={{ padding:'10px 14px', border:'1px solid #ddd', borderRadius:10, background:'#e8f5e9', opacity: saving? .7 : 1 }}>
              {saving ? 'Saving…' : 'Save & go to tracker'}
            </button>
          )}
        </div>

        <div style={{ marginTop:16, textAlign:'center' }}>
          Already set up? <a href="/tracker" style={{ textDecoration:'underline' }}>Go to your tracker</a>
        </div>
      </section>
    </main>
  );
}
