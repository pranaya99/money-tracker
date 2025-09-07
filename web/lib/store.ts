// web/lib/clientStore.ts
'use client';

export type Expense = { id: string; name: string; category: string; amount: number; date: string };
export type Txn     = { id: string; name: string; amount: number; date: string; category?: string };
export type Alert   = { id: string; kind: string; message: string; createdAt: string; severity?: 'low'|'medium'|'high' };

export type State = {
  checking: number;
  rent: number;
  payroll: number;
  expenses: Expense[];
  txns: Txn[];
  alerts: Alert[];
  categories: string[];
};

const KEY = 'pm_state';
const uid = (p='id') => `${p}_${Math.random().toString(36).slice(2,10)}${Date.now().toString(36)}`;

export function loadState(): State {
  if (typeof window === 'undefined') {
    // server-side safeguard; never used because we only import in client components
    return { checking: 0, rent: 0, payroll: 0, expenses: [], txns: [], alerts: [], categories: ['Rent','Groceries','Entertainment','Subscriptions','Health','Income'] };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return { checking: 0, rent: 0, payroll: 0, expenses: [], txns: [], alerts: [], categories: ['Rent','Groceries','Entertainment','Subscriptions','Health','Income'] };
    }
    const s = JSON.parse(raw) as State;
    if (!s.categories) s.categories = ['Rent','Groceries','Entertainment','Subscriptions','Health','Income'];
    return s;
  } catch {
    return { checking: 0, rent: 0, payroll: 0, expenses: [], txns: [], alerts: [], categories: ['Rent','Groceries','Entertainment','Subscriptions','Health','Income'] };
  }
}

export function saveState(s: State) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

// Initialize from welcome page
export function initState(checking: number, rent: number, payroll: number) {
  const s: State = {
    checking, rent, payroll,
    expenses: [],
    txns: [],
    alerts: [],
    categories: ['Rent','Groceries','Entertainment','Subscriptions','Health','Income'],
  };
  saveState(s);
  return s;
}

export function resetState() {
  const s: State = {
    checking: 0, rent: 0, payroll: 0,
    expenses: [], txns: [], alerts: [],
    categories: ['Rent','Groceries','Entertainment','Subscriptions','Health','Income'],
  };
  saveState(s);
  return s;
}

export function addExpenseToState(s: State, e: Omit<Expense,'id'>) {
  const ex: Expense = { ...e, id: uid('exp') };
  s.expenses.unshift(ex);
  // mirror to transactions (debit)
  s.txns.unshift({ id: uid('txn'), name: ex.name, amount: -Math.abs(ex.amount), date: ex.date, category: ex.category });
  // reduce checking
  s.checking -= Math.abs(ex.amount);
  // ensure category exists
  if (!s.categories.includes(ex.category)) s.categories.push(ex.category);
  // optional alert
  s.alerts.unshift({
    id: uid('al'),
    kind: 'expense_logged',
    message: `Logged ${ex.name} -$${Math.abs(ex.amount).toFixed(0)}`,
    createdAt: new Date().toISOString(),
    severity: 'low',
  });
  saveState(s);
  return s;
}

export function markRentPaidInState(s: State, date: string) {
  const amt = Math.abs(s.rent || 0);
  if (amt <= 0) return s;
  // expense + txn
  s.expenses.unshift({ id: uid('exp'), name: 'Rent', category: 'Rent', amount: amt, date });
  s.txns.unshift({ id: uid('txn'), name: 'Rent', amount: -amt, date, category: 'Rent' });
  s.checking -= amt;
  // alert
  s.alerts.unshift({
    id: uid('al'),
    kind: 'rent_paid',
    message: `Rent paid -$${amt.toFixed(0)}`,
    createdAt: new Date().toISOString(),
    severity: 'medium',
  });
  saveState(s);
  return s;
}

export function markPayrollPostedInState(s: State, date: string) {
  const amt = Math.abs(s.payroll || 0);
  if (amt <= 0) return s;
  s.txns.unshift({ id: uid('txn'), name: 'Payroll', amount: amt, date, category: 'Income' });
  s.checking += amt;
  s.alerts.unshift({
    id: uid('al'),
    kind: 'payroll_posted',
    message: `Payroll posted +$${amt.toFixed(0)}`,
    createdAt: new Date().toISOString(),
    severity: 'low',
  });
  // Also ensure 'Income' is a category for chart color consistency
  if (!s.categories.includes('Income')) s.categories.push('Income');
  saveState(s);
  return s;
}
