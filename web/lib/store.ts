export type Account = { id: string; name: string; type: string; balance: number };
export type Txn = { id: string; account_id: string; name: string; amount: number; date: string; category?: string };
export type Alert = { id: string; txn_id?: string; kind: string; message: string; severity: "low"|"medium"|"high"; amount?: number; balance?: number; created_at: string };
export type Expense = { id: string; name: string; category: string; amount: number; date: string };

type DB = {
  accounts: Account[];
  transactions: Txn[];
  alerts: Alert[];
  expenses: Expense[];
  categories: string[];
  prefs: { checking?: number; rent?: number; payroll?: number };
};

const g = globalThis as any;
if (!g.__DB__) {
  g.__DB__ = {
    accounts: [
      { id: "acc_checking", name: "Checking", type: "depository", balance: 0 },
      { id: "acc_savings",  name: "Savings",  type: "depository", balance: 0 },
    ],
    transactions: [],
    alerts: [],
    expenses: [],
    categories: ["Rent","Groceries","Entertainment","Subscriptions","Health","Income"],
    prefs: {}
  } as DB;
}
export const db: DB = g.__DB__;

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2,10)}${Date.now().toString(36)}`;
}

export function setChecking(bal: number) {
  const a = db.accounts.find(a => a.name === "Checking");
  if (a) a.balance = bal;
}

export function resetAll() {
  db.accounts = [
    { id: "acc_checking", name: "Checking", type: "depository", balance: 0 },
    { id: "acc_savings",  name: "Savings",  type: "depository", balance: 0 },
  ];
  db.transactions = [];
  db.expenses = [];
  db.categories = ["Rent","Groceries","Entertainment","Subscriptions","Health","Income"];
  db.alerts = [];
  db.prefs = {};
}

export function addTxn(t: Omit<Txn,"id"|"account_id"> & { account_id?: string }) {
  const id = uid("txn");
  const account_id = t.account_id ?? "acc_checking";
  const txn: Txn = { id, account_id, name: t.name, amount: t.amount, date: t.date, category: t.category };
  db.transactions.unshift(txn);

  const checking = db.accounts.find(a => a.id === "acc_checking");
  if (checking) checking.balance += t.amount;

  return txn;
}

export function addAlert(kind: Alert["kind"], message: string, severity: Alert["severity"] = "low", amount?: number) {
  const al: Alert = { id: uid("al"), kind, message, severity, amount, created_at: new Date().toISOString() };
  db.alerts.unshift(al);
  return al;
}

export function addExpense(e: Omit<Expense,"id">) {
  const ex: Expense = { ...e, id: uid("exp") };
  db.expenses.unshift(ex);
  if (!db.categories.includes(ex.category)) db.categories.push(ex.category);
  // mirror to transactions as a debit
  addTxn({ name: ex.name, amount: -Math.abs(ex.amount), date: ex.date, category: ex.category });
  return ex;
}
