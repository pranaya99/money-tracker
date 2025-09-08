// web/lib/store.ts

// ---------- Types ----------
export type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
};

export type Txn = {
  id: string;
  account_id: string;
  name: string;
  amount: number;
  date: string;
  category?: string;
};

export type Alert = {
  id: string;
  txn_id?: string;
  kind: string;
  message: string;
  severity: "low" | "medium" | "high";
  amount?: number;
  balance?: number;
  created_at: string;
};

export type Expense = {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
};

type DB = {
  accounts: Account[];
  transactions: Txn[];
  alerts: Alert[];
  expenses: Expense[];
  categories: string[];
  prefs: {
    checking?: number;
    rent?: number;
    payroll?: number;
  };
};

// ---------- Global Store Singleton ----------
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
    prefs: { checking: 0, rent: 0, payroll: 0 },
  } as DB;
}

export const db: DB = g.__DB__;

// ---------- Helpers ----------
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

// ---------- Mutators ----------
export function setChecking(bal: number) {
  const a = db.accounts.find((a) => a.id === "acc_checking" || a.name === "Checking");
  if (a) a.balance = bal;
  db.prefs.checking = bal;
}

/** ✅ Consistent reset used by /api/reset */
export function resetAll() {
  db.accounts = [
    { id: "acc_checking", name: "Checking", type: "depository", balance: 0 },
    { id: "acc_savings",  name: "Savings",  type: "depository", balance: 0 },
  ];
  db.transactions = [];  // ✅ correct key (was `txns` before)
  db.expenses = [];
  db.alerts = [];
  db.categories = ["Rent","Groceries","Entertainment","Subscriptions","Health","Income"];
  db.prefs = { checking: 0, rent: 0, payroll: 0 };
}

/** Insert a transaction and update Checking balance automatically */
export function addTxn(
  t: Omit<Txn, "id" | "account_id"> & { account_id?: string }
) {
  const id = uid("txn");
  const account_id = t.account_id ?? "acc_checking";
  const txn: Txn = {
    id,
    account_id,
    name: t.name,
    amount: t.amount,
    date: t.date,
    category: t.category,
  };

  db.transactions.unshift(txn);

  // Reflect amounts to the Checking account balance
  const checking = db.accounts.find((a) => a.id === "acc_checking");
  if (checking) checking.balance += t.amount;

  return txn;
}

/** Add an alert to the feed */
export function addAlert(
  kind: Alert["kind"],
  message: string,
  severity: Alert["severity"] = "low",
  amount?: number,
  balance?: number
) {
  const al: Alert = {
    id: uid("al"),
    kind,
    message,
    severity,
    amount,
    balance,
    created_at: new Date().toISOString(),
  };
  db.alerts.unshift(al);
  return al;
}

/** Log an expense and mirror it to a debit transaction */
export function addExpense(e: Omit<Expense, "id">) {
  const ex: Expense = { ...e, id: uid("exp") };
  db.expenses.unshift(ex);

  // add new categories on the fly
  if (!db.categories.includes(ex.category)) db.categories.push(ex.category);

  // mirror to transactions as a debit (negative amount)
  addTxn({
    name: ex.name,
    amount: -Math.abs(ex.amount),
    date: ex.date,
    category: ex.category,
  });

  return ex;
}
