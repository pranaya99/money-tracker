import os, time, requests
from datetime import datetime, timedelta
from calendar import monthrange

API_BASE = os.environ.get("API_BASE", "http://localhost:8080")

def get_json(path):
    r = requests.get(f"{API_BASE}{path}", timeout=5)
    r.raise_for_status()
    return r.json()

def post_alert(payload):
    r = requests.post(f"{API_BASE}/api/alerts", json=payload, timeout=5)
    r.raise_for_status()

def ymd(dt: datetime):
    return dt.strftime("%Y-%m-%d")

def start_of_month(dt: datetime):
    return dt.replace(day=1)

def prev_month_bounds(dt: datetime):
    # returns (start_date, end_date) of previous month
    first = dt.replace(day=1)
    last_month_end = first - timedelta(days=1)
    start_prev = last_month_end.replace(day=1)
    return start_prev, last_month_end

def sum_expenses_in_range(expenses, start_date: datetime, end_date: datetime):
    s = 0.0
    for e in expenses:
        try:
            d = datetime.strptime(e.get("date",""), "%Y-%m-%d")
        except Exception:
            continue
        if start_date <= d <= end_date:
            s += float(e.get("amount", 0.0))
    return s

def main():
    print("Worker started; polling every 10s")
    fired = set()  # dedupe by (kind, key)

    while True:
        try:
            accounts = get_json("/api/balances").get("accounts", [])
            expenses = get_json("/api/expenses").get("expenses", [])

            now = datetime.utcnow()
            today = ymd(now)

            # --- Alert 1: Rent due soon (monthly on the 1st; warn when within 5 days) ---
            next_rent_month = now.month + (1 if now.day > 1 else 0)
            next_rent_year = now.year + (1 if next_rent_month == 13 else 0)
            if next_rent_month == 13: next_rent_month = 1
            next_rent_date = datetime(next_rent_year, next_rent_month, 1)
            days_until_rent = (next_rent_date - now).days
            if 0 < days_until_rent <= 5:
                key = ("rent_due_soon", ymd(next_rent_date))
                if key not in fired:
                    post_alert({
                        "txn_id": "",
                        "kind": "rent_due_soon",
                        "message": f"Rent is due in {days_until_rent} day(s) on {ymd(next_rent_date)}.",
                        "severity": "medium",
                        "amount": 0,
                        "balance": 0
                    })
                    fired.add(key)

            # --- Alert 2: Payroll incoming (1st & 15th; warn when within 3 days) ---
            # compute next payday
            payday_candidates = []
            # this month 1st & 15th
            for d in (1, 15):
                pd = datetime(now.year, now.month, d)
                if pd >= now:
                    payday_candidates.append(pd)
            # next month 1st (fallback)
            if not payday_candidates:
                m = now.month + 1
                y = now.year + (1 if m == 13 else 0)
                if m == 13: m = 1
                payday_candidates.append(datetime(y, m, 1))
            next_payday = min(payday_candidates)
            days_to_payday = (next_payday - now).days
            if 0 < days_to_payday <= 3:
                key = ("payroll_incoming", ymd(next_payday))
                if key not in fired:
                    post_alert({
                        "txn_id": "",
                        "kind": "payroll_incoming",
                        "message": f"Payroll expected on {ymd(next_payday)}.",
                        "severity": "low",
                        "amount": 0,
                        "balance": 0
                    })
                    fired.add(key)

            # --- Alert 3: This month spend > last month spend ---
            som = start_of_month(now)
            prev_start, prev_end = prev_month_bounds(now)
            this_month_spend = sum_expenses_in_range(expenses, som, now)
            last_month_spend = sum_expenses_in_range(expenses, prev_start, prev_end)
            if this_month_spend > 0 and this_month_spend > last_month_spend:
                key = ("spend_up_mom", ymd(som))
                if key not in fired:
                    delta = this_month_spend - last_month_spend
                    post_alert({
                        "txn_id": "",
                        "kind": "spend_up_month_over_month",
                        "message": f"Spending is up by ${delta:,.0f} vs last month.",
                        "severity": "medium",
                        "amount": -delta,
                        "balance": 0
                    })
                    fired.add(key)

        except Exception as e:
            print("worker loop error:", e)

        time.sleep(10)

if __name__ == "__main__":
    main()
