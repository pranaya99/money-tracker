# Budget Tracker
*Full-stack fintech demo built with Go, Next.js, TypeScript & Docker*

A Plaid-inspired expense tracking application demonstrating production-ready architecture with microservices, real-time updates, and intuitive UX design.

## 🎯 Why This Matters
- **Modern Stack**: Go backend + Next.js 14 (TypeScript) frontend + Docker orchestration
- **Fintech Focus**: Balance tracking, autopay simulation, spending analytics, and user alerts
- **Production Patterns**: REST API design, containerized services, environment configuration
- **Full-Stack Ownership**: End-to-end feature delivery from database to UI

## 🚀 Quick Start
**Prerequisites**: Docker Desktop installed

```bash
git clone <this-repo>
cd money-tracker
docker compose up --build
```

**URLs:**
- 🏠 App: http://localhost:3000
- 📊 Dashboard: http://localhost:3000/tracker  
- 🔧 API: http://localhost:8080

*Works offline with mock data - no external dependencies required*

## ✨ Features Built

### Core Functionality
- **Account Setup**: Required onboarding flow with balance/income validation
- **Bank Connection**: Mock Plaid-style account linking with seed data
- **Expense Tracking**: Add transactions with categories and automatic balance updates
- **Autopay Simulation**: Rent payments and payroll deposits with alerts

### User Experience
- **Real-time Updates**: Instant balance and transaction updates
- **Visual Analytics**: Category spending breakdown with dynamic pie charts
- **Smart Alerts**: Spending notifications and account activity updates
- **Responsive Design**: Mobile-first UI with smooth animations

## 🏗️ Architecture

```
├── api/           # Go 1.22 REST API (in-memory data store)
├── web/           # Next.js 14 App Router (TypeScript)
├── worker/        # Background job scaffold
└── docker-compose.yml
```

**API Endpoints:**
- `POST /api/public_token/exchange` - Mock bank connection
- `GET/POST /api/expenses` - Transaction management  
- `GET /api/balances` - Account balance retrieval
- `POST /api/autopay/{rent|payroll}` - Payment simulation

**Frontend Routes:**
- `/welcome` - Onboarding flow with required setup
- `/tracker` - Main dashboard with charts and transaction history

## 🔧 Configuration

```bash
# Optional environment variables
NEXT_PUBLIC_API_BASE=http://localhost:8080  # API endpoint
```

## 🛠️ Development

**Local Development:**
```bash
# API only
cd api && go run main.go

# Frontend only  
cd web && npm run dev
```

**Production Build:**
```bash
docker compose -f docker-compose.prod.yml up --build
```

## 🚀 What's Next
- Integrate real Plaid Link SDK for live bank connections
- Add PostgreSQL persistence with migrations
- Implement user authentication and session management
- Add comprehensive test coverage (unit + e2e)
- Deploy to AWS/GCP with CI/CD pipeline

## 📋 Tech Stack
- **Backend**: Go 1.22, Gorilla Mux, JSON APIs
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Infrastructure**: Docker, Docker Compose
- **Architecture**: Microservices, REST APIs, Container orchestration

---
*Built to demonstrate full-stack development capabilities and production-ready coding practices.*