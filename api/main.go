package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

type Account struct {
	ID      string  `json:"id"`
	Name    string  `json:"name"`
	Type    string  `json:"type"`
	Balance float64 `json:"balance"`
}

type Transaction struct {
	ID        string  `json:"id"`
	AccountID string  `json:"account_id"`
	Name      string  `json:"name"`
	Amount    float64 `json:"amount"` // negative = debit, positive = credit
	Date      string  `json:"date"`   // YYYY-MM-DD
	Category  string  `json:"category,omitempty"`
}

type Alert struct {
	ID        string  `json:"id"`
	TxnID     string  `json:"txn_id"`
	Kind      string  `json:"kind"`
	Message   string  `json:"message"`
	Severity  string  `json:"severity"`
	Amount    float64 `json:"amount"`
	Balance   float64 `json:"balance"`
	CreatedAt string  `json:"created_at"`
}

type Expense struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Category string  `json:"category"`
	Amount   float64 `json:"amount"` // positive spend
	Date     string  `json:"date"`   // YYYY-MM-DD
}

type Store struct {
	mu           sync.RWMutex
	connected    bool
	accounts     map[string]*Account
	transactions map[string]*Transaction
	alerts       map[string]*Alert
	expenses     map[string]*Expense
	categories   map[string]bool
}

var store = &Store{
	accounts:     map[string]*Account{},
	transactions: map[string]*Transaction{},
	alerts:       map[string]*Alert{},
	expenses:     map[string]*Expense{},
	categories:   map[string]bool{},
}

func defaultCategories() []string {
	return []string{"Rent", "Groceries", "Transport", "Entertainment", "Utilities", "Subscriptions", "Health", "Income", "Other"}
}

func ensureDefaultCategoriesLocked() {
	if len(store.categories) == 0 {
		for _, c := range defaultCategories() {
			store.categories[c] = true
		}
	}
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func cors(next http.Handler) http.Handler {
	allowed := getEnv("ALLOWED_ORIGIN", "http://localhost:3000")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowed)
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Idempotency-Key")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func round(val float64, places int) float64 {
	pow := 1.0
	for i := 0; i < places; i++ {
		pow *= 10
	}
	return float64(int(val*pow+0.5)) / pow
}

// ---- helpers ----

func addAlert(kind, msg, sev string, amount, balance float64, txnID string) {
	a := &Alert{
		ID:        "alt_" + strconv.FormatInt(time.Now().UnixNano(), 10),
		TxnID:     txnID,
		Kind:      kind,
		Message:   msg,
		Severity:  sev,
		Amount:    amount,
		Balance:   balance,
		CreatedAt: time.Now().Format(time.RFC3339),
	}
	store.alerts[a.ID] = a
}

func addTxn(accountID, name string, amount float64, date, category string) *Transaction {
	id := "txn_" + strconv.FormatInt(time.Now().UnixNano(), 10)
	t := &Transaction{
		ID:        id,
		AccountID: accountID,
		Name:      name,
		Amount:    amount,
		Date:      date,
		Category:  category,
	}
	store.transactions[id] = t
	if acc := store.accounts[accountID]; acc != nil {
		acc.Balance += amount
	}
	return t
}

// -----------------

func main() {
	rand.Seed(time.Now().UnixNano())
	mux := http.NewServeMux()

	// Health
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, 200, map[string]string{"status": "ok"})
	})

	// Categories (GET/POST)
	mux.HandleFunc("/api/categories", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			store.mu.Lock()
			ensureDefaultCategoriesLocked()
			list := make([]string, 0, len(store.categories))
			for c := range store.categories {
				list = append(list, c)
			}
			store.mu.Unlock()
			writeJSON(w, 200, map[string]any{"categories": list})
		case http.MethodPost:
			var p struct{ Name string `json:"name"` }
			if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
				writeJSON(w, 400, map[string]string{"error": "bad json"})
				return
			}
			name := strings.TrimSpace(p.Name)
			if name == "" {
				writeJSON(w, 400, map[string]string{"error": "empty name"})
				return
			}
			store.mu.Lock()
			if store.categories == nil {
				store.categories = map[string]bool{}
			}
			store.categories[name] = true
			store.mu.Unlock()
			writeJSON(w, 200, map[string]any{"ok": true, "name": name})
		default:
			writeJSON(w, 405, map[string]string{"error": "method not allowed"})
		}
	})

	// Link & connect (mock)
	mux.HandleFunc("/api/link/token/create", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, 200, map[string]string{"link_token": "mock-link-token"})
	})
	mux.HandleFunc("/api/public_token/exchange", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, 405, map[string]string{"error": "method not allowed"})
			return
		}
		store.mu.Lock()
		defer store.mu.Unlock()
		store.connected = true
		if len(store.accounts) == 0 {
			store.accounts["acc_chk"] = &Account{ID: "acc_chk", Name: "Checking", Type: "depository", Balance: 2500}
			store.accounts["acc_sav"] = &Account{ID: "acc_sav", Name: "Savings", Type: "depository", Balance: 5000}
		}
		ensureDefaultCategoriesLocked()
		writeJSON(w, 200, map[string]string{"access_token": "mock-access-token"})
	})

	// Balances
	mux.HandleFunc("/api/balances", func(w http.ResponseWriter, r *http.Request) {
		store.mu.RLock()
		defer store.mu.RUnlock()
		accs := make([]*Account, 0, len(store.accounts))
		for _, a := range store.accounts {
			accs = append(accs, a)
		}
		writeJSON(w, 200, map[string]any{"accounts": accs})
	})

	// Transactions
	mux.HandleFunc("/api/transactions", func(w http.ResponseWriter, r *http.Request) {
		store.mu.RLock()
		defer store.mu.RUnlock()
		txns := make([]*Transaction, 0, len(store.transactions))
		for _, t := range store.transactions {
			txns = append(txns, t)
		}
		writeJSON(w, 200, map[string]any{"transactions": txns})
	})

	// Alerts (GET/POST)
	mux.HandleFunc("/api/alerts", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			store.mu.RLock()
			defer store.mu.RUnlock()
			alts := make([]*Alert, 0, len(store.alerts))
			for _, a := range store.alerts {
				alts = append(alts, a)
			}
			writeJSON(w, 200, map[string]any{"alerts": alts})
		case http.MethodPost:
			var a Alert
			if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
				writeJSON(w, 400, map[string]string{"error": "bad json"})
				return
			}
			if a.ID == "" {
				a.ID = "alt_" + strconv.FormatInt(time.Now().UnixNano(), 10)
			}
			if a.CreatedAt == "" {
				a.CreatedAt = time.Now().Format(time.RFC3339)
			}
			store.mu.Lock()
			store.alerts[a.ID] = &a
			store.mu.Unlock()
			writeJSON(w, 200, a)
		default:
			writeJSON(w, 405, map[string]string{"error": "method not allowed"})
		}
	})

	// Expenses (GET/POST) — POST also creates txn & updates checking
	mux.HandleFunc("/api/expenses", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			store.mu.RLock()
			defer store.mu.RUnlock()
			list := make([]*Expense, 0, len(store.expenses))
			for _, e := range store.expenses {
				list = append(list, e)
			}
			writeJSON(w, 200, map[string]any{"expenses": list})
		case http.MethodPost:
			var e Expense
			if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
				writeJSON(w, 400, map[string]string{"error": "bad json"})
				return
			}
			if e.Name == "" || strings.TrimSpace(e.Category) == "" || e.Amount <= 0 || e.Date == "" {
				writeJSON(w, 400, map[string]string{"error": "missing fields"})
				return
			}
			e.ID = "exp_" + strconv.FormatInt(time.Now().UnixNano(), 10)

			accID := "acc_chk"
			txnID := "txn_" + strconv.FormatInt(time.Now().UnixNano(), 10)
			t := &Transaction{
				ID:        txnID,
				AccountID: accID,
				Name:      e.Name,
				Amount:    -round(e.Amount, 2), // debit
				Date:      e.Date,
				Category:  e.Category,
			}

			store.mu.Lock()
			if _, ok := store.accounts[accID]; !ok {
				store.accounts[accID] = &Account{ID: accID, Name: "Checking", Type: "depository", Balance: 2500}
			}
			ensureDefaultCategoriesLocked()
			store.expenses[e.ID] = &e
			store.transactions[txnID] = t
			store.accounts[accID].Balance += t.Amount
			store.categories[e.Category] = true
			store.mu.Unlock()

			writeJSON(w, 200, map[string]any{"expense": e, "created_txn_id": txnID})
		default:
			writeJSON(w, 405, map[string]string{"error": "method not allowed"})
		}
	})

	// --- New: Autopay endpoints for your buttons ---

	// POST /api/autopay/rent  (optional body: {"amount":1200,"date":"YYYY-MM-DD"})
	mux.HandleFunc("/api/autopay/rent", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, 405, map[string]string{"error": "method not allowed"})
			return
		}
		var body struct {
			Amount float64 `json:"amount"`
			Date   string  `json:"date"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		if body.Amount <= 0 {
			body.Amount = 1200
		}
		if body.Date == "" {
			body.Date = time.Now().Format("2006-01-02")
		}

		store.mu.Lock()
		if _, ok := store.accounts["acc_chk"]; !ok {
			store.accounts["acc_chk"] = &Account{ID: "acc_chk", Name: "Checking", Type: "depository", Balance: 2500}
		}
		ensureDefaultCategoriesLocked()

		// create expense (for pie) + transaction (debit)
		exp := &Expense{
			ID:       "exp_" + strconv.FormatInt(time.Now().UnixNano(), 10),
			Name:     "RENT",
			Category: "Rent",
			Amount:   round(body.Amount, 2),
			Date:     body.Date,
		}
		store.expenses[exp.ID] = exp

		txn := addTxn("acc_chk", "RENT", -round(body.Amount, 2), body.Date, "Rent")

		// alert
		addAlert("rent_paid", "Rent paid (-$"+strconv.FormatFloat(body.Amount, 'f', 0, 64)+").", "medium", txn.Amount, store.accounts["acc_chk"].Balance, txn.ID)

		store.mu.Unlock()

		writeJSON(w, 200, map[string]any{"ok": true, "expense_id": exp.ID, "txn_id": txn.ID})
	})

	// POST /api/autopay/payroll  (optional body: {"amount":1500,"date":"YYYY-MM-DD"})
	mux.HandleFunc("/api/autopay/payroll", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, 405, map[string]string{"error": "method not allowed"})
			return
		}
		var body struct {
			Amount float64 `json:"amount"`
			Date   string  `json:"date"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		if body.Amount <= 0 {
			body.Amount = 1500
		}
		if body.Date == "" {
			body.Date = time.Now().Format("2006-01-02")
		}

		store.mu.Lock()
		if _, ok := store.accounts["acc_chk"]; !ok {
			store.accounts["acc_chk"] = &Account{ID: "acc_chk", Name: "Checking", Type: "depository", Balance: 2500}
		}
		ensureDefaultCategoriesLocked()

		// credit transaction (no expense)
		txn := addTxn("acc_chk", "PAYROLL", round(body.Amount, 2), body.Date, "Income")

		// alert
		addAlert("payroll_posted", "Payroll deposited (+$"+strconv.FormatFloat(body.Amount, 'f', 0, 64)+").", "low", txn.Amount, store.accounts["acc_chk"].Balance, txn.ID)

		store.mu.Unlock()

		writeJSON(w, 200, map[string]any{"ok": true, "txn_id": txn.ID})
	})

	// -----------------------------------------------

	handler := cors(mux)
	port := getEnv("API_PORT", "8080")
	log.Printf("API listening on :%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}
