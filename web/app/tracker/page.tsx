'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

type Account = { id: string; name: string; type: string; balance: number };
type Txn = { id: string; account_id: string; name: string; amount: number; date: string; category?: string };
type Alert = { id: string; txn_id: string; kind: string; message: string; severity: 'low'|'medium'|'high'; amount: number; balance: number; created_at: string };
type Expense = { id: string; name: string; category: string; amount: number; date: string };

function todayStr() { return new Date().toISOString().slice(0,10); }
function monthKey(d: Date) { return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`; }

function prettyKind(kind: string) {
  const map: Record<string,string> = {
    rent_due_soon: 'Rent Due Soon',
    payroll_incoming: 'Payroll Incoming',
    spend_up_month_over_month: 'Spending Up vs Last Month',
    payroll_posted: 'Payroll Posted',
    rent_paid: 'Rent Paid',
  };
  return map[kind] || kind.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const PALETTE = ['#6366F1','#22C55E','#F59E0B','#EF4444','#06B6D4','#A855F7','#F97316','#84CC16','#10B981','#3B82F6'];
const CARD_H = 520;

function fireConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;
  const resize = () => { canvas.width = innerWidth*dpr; canvas.height = innerHeight*dpr; };
  resize(); addEventListener('resize', resize);
  const N = 160, parts = Array.from({length:N},(_,i)=>({
    x: Math.random()*canvas.width, y: -Math.random()*canvas.height*0.2,
    r: (6+Math.random()*6)*dpr, vx: (-1+Math.random()*2)*0.8*dpr,
    vy: (1+Math.random()*2)*dpr, color: PALETTE[i%PALETTE.length], a: 1
  }));
  const t0 = performance.now();
  const draw = (t:number)=>{
    const dt=(t-t0)/1200;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    parts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.04*dpr; p.a = Math.max(0, 1-dt);
      ctx.globalAlpha=p.a; ctx.fillStyle=p.color;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
    if(dt<1){ requestAnimationFrame(draw); } else { removeEventListener('resize', resize); canvas.remove(); }
  };
  requestAnimationFrame(draw);
}

export default function Tracker() {
  const router = useRouter();

  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<string>('');

  // Required values from /welcome
  const [checkingOverride, setCheckingOverride] = useState<number | null>(null);
  const [rentPref, setRentPref] = useState<number | null>(null);
  const [payrollPref, setPayrollPref] = useState<number | null>(null);

  // enforce setup
  useEffect(() => {
    const ic = localStorage.getItem('initialChecking');
    const r  = localStorage.getItem('monthlyRent');
    const p  = localStorage.getItem('payrollAmount');

    if (!ic || !r || !p) {
      router.push('/welcome'); // compulsory setup
      return;
    }
    setCheckingOverride(parseFloat(ic));
    setRentPref(parseFloat(r));
    setPayrollPref(parseFloat(p));
  }, [router]);

  // vibes
  const vibes = useRef([
    "you're building great money habits ✨",
    "little steps today is big wins later 💪",
    "track it to tame it 💸",
    "proud of you for checking in 🌱",
    "consistency is better than intensity keep going 🚀",
  ]);
  const [vibe, setVibe] = useState(vibes.current[0]);
  useEffect(() => {
    const id = setInterval(() => {
      setVibe(v => {
        const idx = (vibes.current.indexOf(v)+1) % vibes.current.length;
        return vibes.current[idx];
      });
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // data
  async function fetchBalances(){ const r=await fetch(`${API}/api/balances`); setAccounts((await r.json()).accounts||[]); }
  async function fetchTxns(){ const r=await fetch(`${API}/api/transactions`); const j=await r.json(); setTxns((j.transactions||[]).sort((a:Txn,b:Txn)=> b.id.localeCompare(a.id))); }
  async function fetchAlerts(){ const r=await fetch(`${API}/api/alerts`); const j=await r.json(); setAlerts((j.alerts||[]).sort((a:Alert,b:Alert)=> (b.created_at||'').localeCompare(a.created_at||''))); }
  async function fetchExpenses(){ const r=await fetch(`${API}/api/expenses`); const j=await r.json(); setExpenses((j.expenses||[]).sort((a:Expense,b:Expense)=> (b.date||'').localeCompare(a.date||''))); }
  async function fetchCategories(){ const r=await fetch(`${API}/api/categories`); const j=await r.json(); setCategories((j.categories||[]).sort()); }
  async function refreshAll(){ await Promise.all([fetchBalances(),fetchTxns(),fetchAlerts(),fetchExpenses(),fetchCategories()]); }

  useEffect(()=>{ refreshAll(); },[]);

  async function connectBank(){
    setLoading(true);
    try { await fetch(`${API}/api/public_token/exchange`,{method:'POST'}); setConnected(true); await refreshAll(); }
    finally { setLoading(false); }
  }

  async function markRentPaid() {
    if (rentPref == null) return router.push('/welcome');
    setLoading(true);
    try {
      await fetch(`${API}/api/autopay/rent`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ date: todayStr(), amount: rentPref })
      });
      setCheckingOverride(v => {
        const base = (typeof v === 'number') ? v : (accounts.find(a=>a.name==='Checking')?.balance ?? 0);
        return base - rentPref;
      });
      await refreshAll();
      setFlash(`Rent recorded (-$${rentPref.toFixed(0)}). 💸`); setTimeout(()=>setFlash(""), 1600);
      fireConfetti();
    } finally { setLoading(false); }
  }

  async function markPayrollDeposited() {
    if (payrollPref == null) return router.push('/welcome');
    setLoading(true);
    try {
      await fetch(`${API}/api/autopay/payroll`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ date: todayStr(), amount: payrollPref })
      });
      setCheckingOverride(v => {
        const base = (typeof v === 'number') ? v : (accounts.find(a=>a.name==='Checking')?.balance ?? 0);
        return base + payrollPref;
      });
      await refreshAll();
      setFlash(`Payroll deposited (+$${payrollPref.toFixed(0)}). ✅`); setTimeout(()=>setFlash(""), 1600);
    } finally { setLoading(false); }
  }

  // add expense
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', amount: '', date: todayStr() });

  async function submitExpense(e: React.FormEvent){
    e.preventDefault();
    const amt = parseFloat(form.amount||'0');
    const cat = (form.category||'').trim() || 'Other';
    if(!form.name || isNaN(amt) || amt<=0) return;
    await fetch(`${API}/api/expenses`,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name:form.name, category:cat, amount:amt, date:form.date})
    });
    await fetch(`${API}/api/categories`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name:cat}) }).catch(()=>{});
    setOpenForm(false);
    setForm({ name:'', category:'', amount:'', date: todayStr() });
    await refreshAll();
    setFlash("Expense logged! 🎉"); setTimeout(()=>setFlash(""), 1800);
    fireConfetti();
  }

  // KPIs
  const now = new Date();
  const thisKey = monthKey(now);
  const spendThis = useMemo(()=>{
    let sum = 0;
    for(const e of expenses){
      const d = new Date(e.date);
      if (monthKey(d) === thisKey) sum += Math.abs(e.amount);
    }
    return sum;
  },[expenses, thisKey]);

  const checkingActual = accounts.find(a=>a.name==='Checking')?.balance ?? 0;
  const checking = (typeof checkingOverride === 'number') ? checkingOverride : checkingActual;

  // spend by category
  const byCat = useMemo(()=>{
    const map = new Map<string, number>();
    for(const e of expenses) map.set(e.category, (map.get(e.category)||0) + Math.abs(e.amount));
    const total = Array.from(map.values()).reduce((a,b)=>a+b,0);
    const entries = Array.from(map.entries()).sort((a,b)=>b[1]-a[1]);
    return { entries, total };
  },[expenses]);

  const colorMap = useMemo(() => {
    const m: Record<string, string> = {};
    byCat.entries.forEach(([label], idx) => { m[label] = PALETTE[idx % PALETTE.length]; });
    return m;
  }, [byCat.entries]);

  function donutPaths(entries: [string,number][], total: number, colors: Record<string,string>){
    const paths: {d:string; label:string; value:number; color:string}[] = [];
    if(total<=0) return paths;
    const cx=70, cy=70, r=58; let start=-Math.PI/2;
    for(const [label, val] of entries){
      const frac = val/total; const a = frac * Math.PI*2; const end = start + a;
      const x1=cx+r*Math.cos(start), y1=cy+r*Math.sin(start);
      const x2=cx+r*Math.cos(end),   y2=cy+r*Math.sin(end);
      const large = a>Math.PI?1:0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      paths.push({ d, label, value: val, color: colors[label] });
      start=end;
    }
    return paths;
  }
  const donut = donutPaths(byCat.entries, byCat.total, colorMap);

  return (
    <main style={{ fontFamily:'ui-sans-serif, system-ui', padding:24, maxWidth:1240, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, marginBottom:4 }}>Pranaya’s Money Tracker</h1>
          <p style={{ opacity:.75, marginBottom:8 }}>
            Add expenses, categorize spending & income, and budget at a glance with friendly charts and alerts.
          </p>
        </div>
        <div style={{ border:'1px solid #eee', borderRadius:12, padding:'10px 14px', minWidth:280, background:'#fbfbff' }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>Account Overview</div>
          <div style={{ fontSize:13, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div><div style={{ opacity:.6, fontSize:12 }}>Checking</div><div style={{ fontWeight:700 }}>${checking.toFixed(2)}</div></div>
            <div><div style={{ opacity:.6, fontSize:12 }}>This Month Spend</div><div style={{ fontWeight:700 }}>${spendThis.toFixed(0)}</div></div>
          </div>
        </div>
      </div>

      {flash && <div style={{ marginTop:12, marginBottom:8, padding:'8px 12px', border:'1px solid #d1fadf', background:'#f0fff4', borderRadius:10 }}>{flash}</div>}

      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <button onClick={connectBank} disabled={loading || connected}
          style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #ddd', background: connected?'#e8f5e9':'white', cursor: connected?'default':'pointer' }}>
          {connected ? 'Connected' : 'Connect bank'}
        </button>

        <button onClick={markRentPaid} disabled={loading} style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #ddd', background:'#fff' }}>
          Rent paid
        </button>
        <button onClick={markPayrollDeposited} disabled={loading} style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #ddd', background:'#fff' }}>
          Payroll deposited
        </button>

        <button onClick={()=>setOpenForm(true)} style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #ddd', background:'#f7f7ff' }}>
          + Add expense
        </button>
      </div>

      <section style={{ display:'grid', gridTemplateColumns:'1fr 1fr minmax(480px,1.6fr)', gap:16 }}>
        {/* Spend */}
        <div style={{ border:'1px solid #eee', borderRadius:12, padding:16, height:CARD_H, display:'flex', flexDirection:'column' }}>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Spend by Category</h2>

          {byCat.total === 0 ? (
            <div style={{ opacity:.7, fontSize:13, textAlign:'center', marginTop:40 }}>No expenses yet. Add one to see a chart.</div>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', marginTop:4 }}>
                <svg width="180" height="180" viewBox="0 0 140 140">
                  {donut.map((p, i) => <path key={i} d={p.d} fill={p.color} opacity={0.95} />)}
                  <circle cx="70" cy="70" r="38" fill="#fff" />
                  <text x="70" y="70" textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#111">
                    ${byCat.total.toFixed(0)}
                  </text>
                </svg>
              </div>

              <div style={{ marginTop:10, marginInline:'auto', width:'100%', maxWidth:320, display:'grid', rowGap:10 }}>
                {byCat.entries.map(([label, val]) => (
                  <div key={label} style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', columnGap:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                      <span style={{ width:12, height:12, background:colorMap[label], borderRadius:3, display:'inline-block' }} />
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
                    </div>
                    <div style={{ textAlign:'right', whiteSpace:'nowrap' }}>${val.toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop:'auto', fontSize:12, color:'#6b7280' }}>
            💡 tip: to add expense, press on the <strong>Add expense</strong> filter.
          </div>
          <div style={{ marginTop:4, fontSize:12, color:'#6b7280' }}>
            {vibe}
          </div>
        </div>

        {/* Alerts */}
        <div style={{ border:'1px solid #eee', borderRadius:12, padding:16, height:CARD_H, display:'flex', flexDirection:'column' }}>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Alerts</h2>
          <ul style={{ display:'grid', gap:10, overflowY:'auto', paddingRight:6, maxHeight:'100%' }}>
            {alerts.map((al)=>(
              <li key={al.id} style={{ padding:12, background:'#fafafa', borderRadius:10, border:'1px solid #eee' }}>
                <div style={{ fontWeight:700, marginBottom:4 }}>{prettyKind(al.kind)}</div>
                <div style={{ fontSize:14, marginBottom:4 }}>{al.message}</div>
                <div style={{ fontSize:12, opacity:.7 }}>Detected: {al.created_at ? new Date(al.created_at).toLocaleString() : ''}</div>
              </li>
            ))}
            {alerts.length===0 && <li style={{ opacity:.6 }}>No alerts yet.</li>}
          </ul>
        </div>

        {/* Transactions */}
        <div style={{ border:'1px solid #eee', borderRadius:12, padding:16, height:CARD_H, display:'flex', flexDirection:'column' }}>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Transactions</h2>
          <div style={{ overflowY:'auto', paddingRight:6 }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, tableLayout:'fixed' }}>
              <colgroup>
                <col style={{ width: '130px' }} />
                <col style={{ width: 'auto' }} />
                <col style={{ width: '140px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign:'left', borderBottom:'1px solid #eee', padding:'8px 0', paddingRight:18 }}>Date</th>
                  <th style={{ textAlign:'left', borderBottom:'1px solid #eee', padding:'8px 0' }}>Description</th>
                  <th style={{ textAlign:'right', borderBottom:'1px solid #eee', padding:'8px 0', paddingLeft:18 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {txns.map(txn=>(
                  <tr key={txn.id} style={{ verticalAlign:'top' }}>
                    <td style={{ padding:'10px 0', paddingRight:18, borderBottom:'1px dashed #f3f3f3', whiteSpace:'nowrap' }}>{txn.date}</td>
                    <td style={{ padding:'10px 0', borderBottom:'1px dashed #f3f3f3' }}>
                      <div title={`${txn.name}${txn.category ? ' • '+txn.category : ''}`}
                           style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:10, minWidth:0 }}>
                        <span style={{ fontWeight:600, wordBreak:'break-word' }}>
                          {txn.name}
                        </span>
                        {txn.category && (
                          <span style={{ fontSize:12, padding:'2px 8px', borderRadius:999, border:'1px solid #e5e7eb', background:'#f8fafc', whiteSpace:'nowrap' }}>
                            {txn.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding:'10px 0', paddingLeft:18, borderBottom:'1px dashed #f3f3f3', textAlign:'right', whiteSpace:'nowrap' }}>
                      {txn.amount<0?'-':''}${Math.abs(txn.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {txns.length===0 && <tr><td colSpan={3} style={{ opacity:.6, padding:'12px 0' }}>No transactions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal: Add Expense */}
      {openForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <form onSubmit={submitExpense} style={{ background:'#fff', padding:20, borderRadius:12, minWidth:340, border:'1px solid #eee' }}>
            <h3 style={{ marginBottom:12, fontWeight:700 }}>Add Expense</h3>
            <div style={{ display:'grid', gap:10 }}>
              <label style={{ display:'grid', gap:6 }}>
                <span style={{ fontSize:12, opacity:.8 }}>Name</span>
                <input value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))}
                  style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }} required />
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <span style={{ fontSize:12, opacity:.8 }}>Category</span>
                <input list="category-list" value={form.category} onChange={e=>setForm(f=>({...f, category:e.target.value}))}
                  placeholder="e.g., Coffee, Subscriptions, Health"
                  style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }} />
                <datalist id="category-list">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <span style={{ fontSize:12, opacity:.8 }}>Amount</span>
                <input type="number" step="0.01" inputMode="decimal"
                  value={form.amount} onChange={e=>setForm(f=>({...f, amount:e.target.value}))}
                  style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }} required />
              </label>
              <label style={{ display:'grid', gap:6 }}>
                <span style={{ fontSize:12, opacity:.8 }}>Date</span>
                <input type="date" value={form.date} onChange={e=>setForm(f=>({...f, date:e.target.value}))}
                  style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }} required />
              </label>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:14, justifyContent:'flex-end' }}>
              <button type="button" onClick={()=>setOpenForm(false)} style={{ padding:'8px 12px', border:'1px solid #ddd', borderRadius:8, background:'#f7f7f7' }}>Cancel</button>
              <button type="submit" style={{ padding:'8px 12px', border:'1px solid #ddd', borderRadius:8, background:'#e8f5e9' }}>Save</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
