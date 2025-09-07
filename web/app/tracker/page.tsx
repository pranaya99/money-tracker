'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Txn = { id: string; name: string; amount: number; date: string; category?: string };
type Expense = { id: string; name: string; category: string; amount: number; date: string };
type Alert = { id: string; kind: string; message: string; created_at: string };
type DB = {
  base: { checking: number };
  txns: Txn[];
  expenses: Expense[];
  alerts: Alert[];
  categories: string[];
  prefs: { rent: number; payroll: number };
  connected: boolean;
};

const PALETTE = ['#6366F1','#22C55E','#F59E0B','#EF4444','#06B6D4','#A855F7','#F97316','#84CC16','#10B981','#3B82F6'];
const uid = (p='id') => `${p}_${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-4)}`;
const today = () => new Date().toISOString().slice(0,10);
const monthKey = (d: Date) => `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`;
const get = (): DB | null => { try { return JSON.parse(localStorage.getItem('budgetDB') || 'null'); } catch { return null; } };
const put = (db: DB) => localStorage.setItem('budgetDB', JSON.stringify(db));
const addAlert = (db: DB, kind: string, msg: string) => db.alerts.unshift({ id: uid('al'), kind, message: msg, created_at: new Date().toISOString() });

function hashColorIndex(s: string, n: number) { let h=0; for (let i=0;i<s.length;i++) h=((h<<5)-h)+s.charCodeAt(i); return Math.abs(h)%n; }
function label(s:string){ return s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }
function fireConfetti(){ const c=document.createElement('canvas'); c.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:9999'; document.body.appendChild(c);
  const x=c.getContext('2d')!,dpr=window.devicePixelRatio||1; const rs=()=>{c.width=innerWidth*dpr;c.height=innerHeight*dpr}; rs(); addEventListener('resize',rs);
  const N=140, parts=Array.from({length:N},(_,i)=>({x:Math.random()*c.width,y:-Math.random()*c.height*.2,r:(6+Math.random()*6)*dpr,vx:(-1+Math.random()*2)*.8*dpr,vy:(1+Math.random()*2)*dpr,color:PALETTE[i%PALETTE.length],a:1}));
  const t0=performance.now(); const draw=(t:number)=>{const dt=(t-t0)/1200; x.clearRect(0,0,c.width,c.height); parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.04*dpr;p.a=Math.max(0,1-dt);x.globalAlpha=p.a;x.fillStyle=p.color;x.beginPath();x.arc(p.x,p.y,p.r,0,6.283);x.fill();}); if(dt<1) requestAnimationFrame(draw); else {removeEventListener('resize',rs); c.remove();}}; requestAnimationFrame(draw); }

export default function Tracker() {
  const [db, setDB] = useState<DB | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', amount: '', date: today() });
  const [flash, setFlash] = useState('');

  // vibes
  const vibes = useRef(["you're building great money habits ✨","little steps today = big wins later 💪","track it to tame it 💸","proud of you for checking in 🌱"]);
  const [vibe, setVibe] = useState(vibes.current[0]);
  useEffect(()=>{ const id=setInterval(()=>setVibe(v=>vibes.current[(vibes.current.indexOf(v)+1)%vibes.current.length]),8000); return ()=>clearInterval(id); },[]);

  useEffect(() => {
    const loaded = get();
    if (!loaded) { window.location.href = '/welcome'; return; }
    setDB(loaded);
  }, []);

  // computed
  const checking = useMemo(() => {
    if (!db) return 0;
    const sum = db.txns.reduce((a,t)=>a+t.amount, 0);
    return db.base.checking + sum;
  }, [db]);

  const thisMonthSpend = useMemo(() => {
    if (!db) return 0;
    const key = monthKey(new Date());
    let s = 0;
    db.expenses.forEach(e => { if (monthKey(new Date(e.date)) === key) s += Math.abs(e.amount); });
    return s;
  }, [db]);

  const byCat = useMemo(() => {
    if (!db) return { total: 0, entries: [] as [string,number][] };
    const map = new Map<string, number>();
    db.expenses.forEach(e => map.set(e.category, (map.get(e.category)||0) + Math.abs(e.amount)));
    const total = Array.from(map.values()).reduce((a,b)=>a+b,0);
    const entries = Array.from(map.entries()).sort((a,b)=>b[1]-a[1]);
    return { total, entries };
  }, [db]);

  // actions
  function addExpenseLocal() {
    if (!db) return;
    const amt = Number(form.amount);
    const cat = (form.category||'').trim() || 'Other';
    if (!form.name || !(amt>0)) return;

    const nd = { ...db };
    const e: Expense = { id: uid('exp'), name: form.name, category: cat, amount: amt, date: form.date };
    nd.expenses.unshift(e);
    nd.txns.unshift({ id: uid('txn'), name: e.name, amount: -Math.abs(e.amount), date: e.date, category: e.category });
    if (!nd.categories.includes(cat)) nd.categories.push(cat);

    put(nd); setDB(nd);
    setOpen(false); setForm({ name:'', category:'', amount:'', date: today() });
    setFlash('Expense logged! 🎉'); setTimeout(()=>setFlash(''),1500);
    fireConfetti();
  }

  // *** RENT now adds an expense so it shows in the donut ***
  function rentPaid() {
    if (!db) return;
    const nd = { ...db };
    const amt = Math.abs(nd.prefs.rent || 0);
    const date = today();

    // 1) expense for donut
    const exp: Expense = { id: uid('exp'), name: 'Rent', category: 'Rent', amount: amt, date };
    nd.expenses.unshift(exp);
    if (!nd.categories.includes('Rent')) nd.categories.push('Rent');

    // 2) transaction
    nd.txns.unshift({ id: uid('txn'), name: 'Rent', amount: -amt, date, category: 'Rent' });

    // 3) alert
    addAlert(nd, 'rent_paid', `Rent paid (-$${amt.toFixed(0)})`);
    put(nd); setDB(nd);

    setFlash('Rent recorded. 💸'); setTimeout(()=>setFlash(''),1200);
    fireConfetti();
  }

  function payrollDeposited() {
    if (!db) return;
    const nd = { ...db };
    const amt = Math.abs(nd.prefs.payroll || 0);
    const date = today();
    nd.txns.unshift({ id: uid('txn'), name: 'Payroll', amount: amt, date, category: 'Income' });
    addAlert(nd, 'payroll_posted', `Payroll deposited (+$${amt.toFixed(0)})`);
    put(nd); setDB(nd);
    setFlash('Payroll deposited. ✅'); setTimeout(()=>setFlash(''),1200);
  }

  function connect() { if (!db) return; const nd={...db, connected:true}; put(nd); setDB(nd); }

  // *** Reset & Setup: clear and go to welcome ***
  function resetAndSetup() {
    localStorage.removeItem('budgetDB'); // blank slate
    window.location.href = '/welcome';
  }

  if (!db) return null;

  const donut = (() => {
    const paths: { d:string; label:string; value:number; color:string }[] = [];
    const total = byCat.total; if (total <= 0) return paths;
    const cx=70, cy=70, r=58; let start=-Math.PI/2;
    for (const [lab,val] of byCat.entries) {
      const frac = val/total; const a = frac * Math.PI * 2; const end = start + a;
      const x1=cx+r*Math.cos(start), y1=cy+r*Math.sin(start);
      const x2=cx+r*Math.cos(end),   y2=cy+r*Math.sin(end);
      const large = a>Math.PI?1:0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      paths.push({ d, label: lab, value: val, color: PALETTE[hashColorIndex(lab, PALETTE.length)] });
      start=end;
    }
    return paths;
  })();

  return (
    <main style={{ fontFamily:'ui-sans-serif,system-ui', padding:24, maxWidth:1240, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, marginBottom:4 }}>Pranaya’s Money Tracker</h1>
          <p style={{ opacity:.75, marginBottom:8 }}>
            Add expenses, categorize spending & income, and budget at a glance with friendly charts and alerts.
          </p>
        </div>

        {/* Account overview + Reset & Setup */}
        <div style={{ display:'flex', alignItems:'stretch', gap:10 }}>
          <div style={{ border:'1px solid #eee', borderRadius:12, padding:'10px 14px', minWidth:280, background:'#fbfbff' }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>Account Overview</div>
            <div style={{ fontSize:13, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div><div style={{ opacity:.6, fontSize:12 }}>Checking</div><div style={{ fontWeight:700 }}>${checking.toFixed(2)}</div></div>
              <div><div style={{ opacity:.6, fontSize:12 }}>This Month Spend</div><div style={{ fontWeight:700 }}>${thisMonthSpend.toFixed(0)}</div></div>
            </div>
          </div>
          <button onClick={resetAndSetup}
            style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #ddd', background:'#fff', whiteSpace:'nowrap' }}>
            Reset & Setup
          </button>
        </div>
      </div>

      {flash && <div style={{ marginTop:12, marginBottom:8, padding:'8px 12px', border:'1px solid #d1fadf', background:'#f0fff4', borderRadius:10 }}>{flash}</div>}

      {/* Actions */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <button onClick={connect} disabled={db.connected}
          style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #ddd', background: db.connected ? '#e8f5e9' : '#fff' }}>
          {db.connected ? 'Connected' : 'Connect bank'}
        </button>
        <button onClick={rentPaid} style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #ddd', background:'#fff' }}>Rent paid</button>
        <button onClick={payrollDeposited} style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #ddd', background:'#fff' }}>Payroll deposited</button>
        <button onClick={()=>setOpen(true)} style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #ddd', background:'#f7f7ff' }}>+ Add expense</button>
      </div>

      {/* Body */}
      <section style={{ display:'grid', gridTemplateColumns:'1fr 1fr minmax(480px,1.6fr)', gap:16 }}>
        {/* Spend card */}
        <div style={{ border:'1px solid #eee', borderRadius:12, padding:16, height:520, display:'flex', flexDirection:'column' }}>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Spend by Category</h2>
          {byCat.total===0 ? (
            <div style={{ opacity:.7, fontSize:13, textAlign:'center', marginTop:40 }}>No expenses yet. Add one to see a chart.</div>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', marginTop:4 }}>
                <svg width="180" height="180" viewBox="0 0 140 140">
                  {donut.map((p,i)=><path key={i} d={p.d} fill={p.color} opacity={0.95}/>)}
                  <circle cx="70" cy="70" r="38" fill="#fff" />
                  <text x="70" y="70" textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#111">
                    ${byCat.total.toFixed(0)}
                  </text>
                </svg>
              </div>
              <div style={{ marginTop:10, marginInline:'auto', width:'100%', maxWidth:320, display:'grid', rowGap:10 }}>
                {byCat.entries.map(([lab,val])=>{
                  const color = PALETTE[hashColorIndex(lab, PALETTE.length)];
                  return (
                    <div key={lab} style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', columnGap:16 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                        <span style={{ width:12, height:12, background:color, borderRadius:3, display:'inline-block' }}/>
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lab}</span>
                      </div>
                      <div style={{ textAlign:'right', whiteSpace:'nowrap' }}>${val.toFixed(0)}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          <div style={{ marginTop:'auto', fontSize:12, color:'#6b7280' }}>💡 tip: to add expense, press on the <strong>Add expense</strong> filter.</div>
          <div style={{ marginTop:4, fontSize:12, color:'#6b7280' }}>🌈 {vibe}</div>
        </div>

        {/* Alerts */}
        <div style={{ border:'1px solid #eee', borderRadius:12, padding:16, height:520, display:'flex', flexDirection:'column' }}>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Alerts</h2>
          <ul style={{ display:'grid', gap:10, overflowY:'auto', paddingRight:6, maxHeight:'100%' }}>
            {db.alerts.length===0 && <li style={{ opacity:.6 }}>No alerts yet.</li>}
            {db.alerts.map(a=>(
              <li key={a.id} style={{ padding:12, background:'#fafafa', borderRadius:10, border:'1px solid #eee' }}>
                <div style={{ fontWeight:700, marginBottom:4 }}>{label(a.kind)}</div>
                <div style={{ fontSize:14, marginBottom:4 }}>{a.message}</div>
                <div style={{ fontSize:12, opacity:.7 }}>Detected: {new Date(a.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>

        {/* Transactions */}
        <div style={{ border:'1px solid #eee', borderRadius:12, padding:16, height:520, display:'flex', flexDirection:'column' }}>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Transactions</h2>
          <div style={{ overflowY:'auto', paddingRight:6 }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, tableLayout:'fixed' }}>
              <colgroup><col style={{ width:'130px' }}/><col/><col style={{ width:'140px' }}/></colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign:'left', borderBottom:'1px solid #eee', padding:'8px 0', paddingRight:18 }}>Date</th>
                  <th style={{ textAlign:'left', borderBottom:'1px solid #eee', padding:'8px 0' }}>Description</th>
                  <th style={{ textAlign:'right', borderBottom:'1px solid #eee', padding:'8px 0', paddingLeft:18 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {db.txns.length===0 && <tr><td colSpan={3} style={{ opacity:.6, padding:'12px 0' }}>No transactions yet.</td></tr>}
                {db.txns.map(t=>(
                  <tr key={t.id} style={{ verticalAlign:'top' }}>
                    <td style={{ padding:'10px 0', paddingRight:18, borderBottom:'1px dashed #f3f3f3', whiteSpace:'nowrap' }}>{t.date}</td>
                    <td style={{ padding:'10px 0', borderBottom:'1px dashed #f3f3f3' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:600, wordBreak:'break-word' }}>{t.name}</span>
                        {t.category && <span style={{ fontSize:12, padding:'2px 8px', borderRadius:999, border:'1px solid #e5e7eb', background:'#f8fafc', whiteSpace:'nowrap' }}>{t.category}</span>}
                      </div>
                    </td>
                    <td style={{ padding:'10px 0', paddingLeft:18, borderBottom:'1px dashed #f3f3f3', textAlign:'right', whiteSpace:'nowrap' }}>
                      {t.amount<0?'-':''}${Math.abs(t.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal */}
      {open && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <form onSubmit={(e)=>{e.preventDefault(); addExpenseLocal();}} style={{ background:'#fff', padding:20, borderRadius:12, minWidth:340, border:'1px solid #eee' }}>
            <h3 style={{ marginBottom:12, fontWeight:700 }}>Add Expense</h3>
            <div style={{ display:'grid', gap:10 }}>
              <label style={{ display:'grid', gap:6 }}>
                <span style={{ fontSize:12, opacity:.8 }}>Name</span>
                <input value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }} required />
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <span style={{ fontSize:12, opacity:.8 }}>Category</span>
                <input value={form.category} onChange={e=>setForm(f=>({...f, category:e.target.value}))} placeholder="e.g., Coffee, Health" style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }} />
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <span style={{ fontSize:12, opacity:.8 }}>Amount</span>
                <input type="number" step="0.01" inputMode="decimal" value={form.amount} onChange={e=>setForm(f=>({...f, amount:e.target.value}))} style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }} required />
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <span style={{ fontSize:12, opacity:.8 }}>Date</span>
                <input type="date" value={form.date} onChange={e=>setForm(f=>({...f, date:e.target.value}))} style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }} required />
              </label>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:14, justifyContent:'flex-end' }}>
              <button type="button" onClick={()=>setOpen(false)} style={{ padding:'8px 12px', border:'1px solid #ddd', borderRadius:8, background:'#f7f7f7' }}>Cancel</button>
              <button type="submit" style={{ padding:'8px 12px', border:'1px solid #ddd', borderRadius:8, background:'#e8f5e9' }}>Save</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
