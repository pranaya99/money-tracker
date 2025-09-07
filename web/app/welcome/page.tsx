// web/app/welcome/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initState, loadState } from '../../lib/store';

export default function Welcome() {
  const router = useRouter();
  const existing = typeof window !== 'undefined' ? loadState() : null;

  const [checking, setChecking] = useState<string>(existing && existing.checking ? String(existing.checking) : '');
  const [rent, setRent] = useState<string>(existing && existing.rent ? String(existing.rent) : '');
  const [payroll, setPayroll] = useState<string>(existing && existing.payroll ? String(existing.payroll) : '');
  const [ready, setReady] = useState(false);

  useEffect(()=> setReady(true), []);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    const c = Number(checking || 0);
    const r = Number(rent || 0);
    const p = Number(payroll || 0);
    initState(c, r, p);
    router.push('/tracker');
  }

  return (
    <main style={{ fontFamily:'ui-sans-serif, system-ui', minHeight:'100dvh', display:'grid', placeItems:'center', padding:'48px 20px' }}>
      <div style={{ width:'100%', maxWidth:1100 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:28, alignItems:'center' }}>
          {/* LEFT: Hero */}
          <div style={{ position:'relative' }}>
            {/* Blurry shapes behind text */}
            <div style={{ position:'absolute', top:-20, left:-18, width:120, height:120, borderRadius:18, background:'rgba(99,102,241,.28)', filter:'blur(10px)', zIndex:0 }} />
            <div style={{ position:'absolute', top:40, left:120, width:160, height:160, borderRadius:'50%', background:'rgba(16,185,129,.22)', filter:'blur(12px)', zIndex:0 }} />

            <span style={{ position:'relative', zIndex:1, fontSize:12, padding:'6px 10px', borderRadius:999, background:'#f3f4ff', color:'#4f46e5' }}>
              ✨ Welcome, Pranaya
            </span>
            <h1 style={{ position:'relative', zIndex:1, fontWeight:800, fontSize:42, lineHeight:1.1, margin:'14px 0 10px' }}>
              Your personal <span style={{ color:'#4f46e5' }}>budget tracker</span>,<br/> friendly & simple.
            </h1>
            <p style={{ position:'relative', zIndex:1, opacity:.85, maxWidth:600 }}>
              Set your <b>checking</b>, <b>rent</b>, and <b>payroll</b>. Then add expenses & track where your money goes.
            </p>
            <p style={{ position:'relative', zIndex:1, opacity:.6, fontSize:13, marginTop:6 }}>
              No bank connection needed — values are stored locally for this demo.
            </p>
          </div>

          {/* RIGHT: Quick setup card */}
          <form onSubmit={onSave}
            style={{
              background:'#fff', border:'1px solid #eee', borderRadius:14, padding:18,
              boxShadow:'0 8px 24px rgba(0,0,0,.06)'
            }}>
            <div style={{ fontWeight:800, fontSize:18, marginBottom:4 }}>Quick setup</div>
            <p style={{ fontSize:13, opacity:.75, marginBottom:12 }}>
              Enter your starting numbers. You can reset later from the tracker.
            </p>

            <label style={{ display:'grid', gap:6, marginTop:8 }}>
              <span style={{ fontSize:12, opacity:.8 }}>Checking Balance</span>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:10, top: '50%', transform:'translateY(-50%)', opacity:.7 }}>$</span>
                <input
                  value={checking}
                  onChange={e=>setChecking(e.target.value)}
                  inputMode="decimal" type="text" placeholder="e.g., 2500"
                  style={{ width:'100%', padding:'10px 12px 10px 22px', border:'1px solid #ddd', borderRadius:10 }}
                  required
                />
              </div>
            </label>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10 }}>
              <label style={{ display:'grid', gap:6 }}>
                <span style={{ fontSize:12, opacity:.8 }}>Monthly Rent</span>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', opacity:.7 }}>$</span>
                  <input
                    value={rent}
                    onChange={e=>setRent(e.target.value)}
                    inputMode="decimal" type="text" placeholder="e.g., 1200"
                    style={{ width:'100%', padding:'10px 12px 10px 22px', border:'1px solid #ddd', borderRadius:10 }}
                    required
                  />
                </div>
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <span style={{ fontSize:12, opacity:.8 }}>Monthly Payroll</span>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', opacity:.7 }}>$</span>
                  <input
                    value={payroll}
                    onChange={e=>setPayroll(e.target.value)}
                    inputMode="decimal" type="text" placeholder="e.g., 1500"
                    style={{ width:'100%', padding:'10px 12px 10px 22px', border:'1px solid #ddd', borderRadius:10 }}
                    required
                  />
                </div>
              </label>
            </div>

            <button disabled={!ready}
              style={{
                marginTop:14, width:'100%', padding:'10px 14px', borderRadius:10,
                border:'1px solid #e5e7eb', background:'#ede9fe', color:'#4f46e5', fontWeight:700
              }}>
              Save & Go to Tracker
            </button>

            <p style={{ marginTop:10, fontSize:12, opacity:.7 }}>
              Tip: You can trigger autopay events (Rent/Payroll) on the Tracker page.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
