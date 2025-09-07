'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// tiny confetti (same as tracker)
function confetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;
  const resize = () => { canvas.width = innerWidth*dpr; canvas.height = innerHeight*dpr; };
  resize(); addEventListener('resize', resize);

  const colors = ['#6366F1','#22C55E','#F59E0B','#EF4444','#06B6D4','#A855F7'];
  const N = 160;
  const parts = Array.from({length:N},(_,i)=>({
    x: Math.random()*canvas.width,
    y: -Math.random()*canvas.height*0.15,
    r: (6+Math.random()*6)*dpr,
    vx: (-1+Math.random()*2)*0.8*dpr,
    vy: (1+Math.random()*2)*dpr,
    color: colors[i%colors.length],
    a: 1
  }));
  const t0 = performance.now();
  const draw = (t:number)=>{
    const dt=(t-t0)/1200;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    parts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.04*dpr; p.a=Math.max(0,1-dt);
      ctx.globalAlpha=p.a; ctx.fillStyle=p.color;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
    if(dt<1){ requestAnimationFrame(draw); } else { removeEventListener('resize', resize); canvas.remove(); }
  };
  requestAnimationFrame(draw);
}

export default function Welcome() {
  const router = useRouter();
  const [checking, setChecking] = useState('');
  const [rent, setRent] = useState('');
  const [payroll, setPayroll] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const valid = () => {
    const c = Number(checking), r = Number(rent), p = Number(payroll);
    return Number.isFinite(c) && c >= 0 && Number.isFinite(r) && r > 0 && Number.isFinite(p) && p > 0;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!valid()) { setErr('Please enter valid amounts for all fields.'); return; }
    setBusy(true);
    try {
      // Persist via serverless API routes (same-origin on Vercel)
      await fetch('/api/setup/checking', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ balance: Number(checking) }) });
      await fetch('/api/setup/rent',     { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ amount:  Number(rent) }) });
      await fetch('/api/setup/payroll',  { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ amount:  Number(payroll) }) });
      confetti();
      router.push('/tracker');
    } catch (e:any) {
      setErr('Setup failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{
      minHeight:'100vh',
      background:'radial-gradient(1200px 600px at 20% -10%, #EEF2FF 0%, transparent 60%), radial-gradient(900px 600px at 100% 0%, #ECFEFF 0%, transparent 60%)',
      display:'grid',
      placeItems:'center',
      padding:'40px 24px',
      fontFamily:'ui-sans-serif, system-ui'
    }}>
      <div style={{ width:'min(1100px, 100%)', display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:28 }}>
        {/* Left: hero */}
        <div>
          <motion.div
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.55 }}
          >
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:999, background:'#F1F5FF', color:'#1F2937', fontSize:12, border:'1px solid #E5E7EB' }}>
              <span>✨</span> Welcome, Pranaya
            </div>
            <h1 style={{ marginTop:14, fontSize:42, lineHeight:1.15, fontWeight:800 }}>
              Your personal <span style={{ color:'#4F46E5' }}>budget tracker</span>,<br/>built to be friendly and simple.
            </h1>
            <p style={{ marginTop:10, maxWidth:560, color:'#374151', fontSize:16 }}>
              Set your <strong>checking balance</strong>, <strong>monthly rent</strong>, and <strong>monthly payroll</strong>. 
              Then track spending with charts, alerts, and light gamification.
            </p>
          </motion.div>

          {/* floating orbs */}
          <div style={{ position:'relative', height:180, marginTop:24 }}>
            <motion.div
              initial={{ opacity:0, y:16, scale:.95 }}
              animate={{ opacity:1, y:0, scale:1 }}
              transition={{ duration:.6, delay:.15 }}
              style={{
                position:'absolute', left:40, top:20, width:120, height:120,
                borderRadius:24,
                background:'linear-gradient(135deg, #6366F1, #A855F7)',
                filter:'blur(18px)', opacity:.25
              }}
            />
            <motion.div
              initial={{ opacity:0, y:24, scale:.95 }}
              animate={{ opacity:.9, y:0, scale:1 }}
              transition={{ duration:.7, delay:.25 }}
              style={{
                position:'absolute', left:160, top:60, width:160, height:160,
                borderRadius:999, background:'radial-gradient(circle, #22C55E, #10B981)',
                filter:'blur(14px)', opacity:.2
              }}
            />
          </div>

          <div style={{ marginTop:10, color:'#6B7280', fontSize:13 }}>
            No bank connection needed — values are stored locally and via serverless routes for the demo.
          </div>
        </div>

        {/* Right: setup card */}
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity:0, x:8 }}
          animate={{ opacity:1, x:0 }}
          transition={{ duration:0.5 }}
          style={{
            background:'#fff',
            border:'1px solid #E5E7EB',
            borderRadius:16,
            padding:'20px 18px',
            boxShadow:'0 6px 30px rgba(0,0,0,0.04)',
            display:'grid', gap:12, alignSelf:'start'
          }}
        >
          <div style={{ fontWeight:800, fontSize:18 }}>Quick setup</div>
          <div style={{ fontSize:13, color:'#6B7280', marginBottom:4 }}>
            Enter your starting numbers. You can always reset later from the tracker.
          </div>

          <label style={{ display:'grid', gap:6 }}>
            <span style={{ fontSize:13, color:'#374151' }}>Checking Balance</span>
            <input
              value={checking}
              onChange={(e)=>setChecking(e.target.value)}
              placeholder="e.g., 2500"
              type="number" inputMode="decimal" step="0.01"
              style={{ padding:'10px 12px', border:'1px solid #D1D5DB', borderRadius:10 }}
              required
            />
          </label>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <label style={{ display:'grid', gap:6 }}>
              <span style={{ fontSize:13, color:'#374151' }}>Monthly Rent</span>
              <input
                value={rent}
                onChange={(e)=>setRent(e.target.value)}
                placeholder="e.g., 1200"
                type="number" inputMode="decimal" step="0.01"
                style={{ padding:'10px 12px', border:'1px solid #D1D5DB', borderRadius:10 }}
                required
              />
            </label>
            <label style={{ display:'grid', gap:6 }}>
              <span style={{ fontSize:13, color:'#374151' }}>Monthly Payroll</span>
              <input
                value={payroll}
                onChange={(e)=>setPayroll(e.target.value)}
                placeholder="e.g., 1500"
                type="number" inputMode="decimal" step="0.01"
                style={{ padding:'10px 12px', border:'1px solid #D1D5DB', borderRadius:10 }}
                required
              />
            </label>
          </div>

          {err && <div style={{ color:'#B91C1C', fontSize:13 }}>{err}</div>}

          <button
            type="submit"
            disabled={busy || !valid()}
            style={{
              marginTop:6,
              padding:'10px 14px',
              borderRadius:10,
              border:'1px solid #4338CA',
              background: busy || !valid() ? '#EDE9FE' : 'linear-gradient(135deg, #4F46E5, #6366F1)',
              color:'#fff', fontWeight:700, cursor: busy || !valid() ? 'not-allowed' : 'pointer'
            }}
          >
            {busy ? 'Saving…' : 'Save & Go to Tracker'}
          </button>

          <div style={{ fontSize:12, color:'#6B7280' }}>
            Tip: You can trigger autopay events (Rent/Payroll) from the Tracker page.
          </div>
        </motion.form>
      </div>
    </main>
  );
}
