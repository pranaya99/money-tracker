# Budget Tracker
*Full-stack fintech demo built with Go, Next.js, TypeScript & Docker*

## 🎥 Watch the Demo

[![Demo Link](./assets/thumbnail.png)](https://www.youtube.com/watch?v=bkEGmonaT6s "Demo Link")


A Plaid-inspired expense tracking application demonstrating production-ready architecture with microservices, real-time updates, and intuitive UX design.

## Why This Matters
- **Modern Stack**: Go backend + Next.js 14 (TypeScript) frontend + Docker orchestration
- **Fintech Focus**: Balance tracking, autopay simulation, spending analytics, and user alerts
- **Production Patterns**: REST API design, containerized services, environment configuration
- **Full-Stack Ownership**: End-to-end feature delivery from database to UI

## Quick Start
**Prerequisites**: Docker Desktop installed

```bash
git clone <this-repo>
cd money-tracker
docker compose up --build
```

**URLs:**
-  App: http://localhost:3000
-  Dashboard: http://localhost:3000/tracker  
-  API: http://localhost:8080

*Works offline with mock data - no external dependencies required*


##  Architecture

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

##  Configuration

```bash
# Optional environment variables
NEXT_PUBLIC_API_BASE=http://localhost:8080  # API endpoint
```

##  Development

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


##  Tech Stack
- **Backend**: Go 1.22, Gorilla Mux, JSON APIs
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Infrastructure**: Docker, Docker Compose
- **Architecture**: Microservices, REST APIs, Container orchestration

---
*Built to demonstrate full-stack development capabilities and production-ready coding practices.*
