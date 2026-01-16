# 🎯 PROJECT OVERVIEW - At a Glance

## 📌 What is This?

This repository contains **TWO SEPARATE PROJECTS** that work together:

```
┌─────────────────────────────────────────────────────────────┐
│              Z.AI DEVELOPMENT ENVIRONMENT                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌──────────────────────┐              ┌──────────────────────┐
│  NEXT.JS FRONTEND    │              │   VAL CORE BACKEND   │
│                      │              │                      │
│  • Modern Web App    │              │  • Financial System  │
│  • Port: 3000        │              │  • Port: 3001        │
│  • React + TypeScript│              │  • Express + Node    │
│  • shadcn/ui         │              │  • Multiple Adapters │
└──────────────────────┘              └──────────────────────┘
         │                                           │
         │              Communicates via              │
         │                   API                      │
         └───────────────────┬───────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │   INFRASTRUCTURE          │
              │                          │
              │  • PostgreSQL (5432)     │
              │  • TigerBeetle (3000)    │
              │  • Docker                │
              └──────────────────────────┘
```

---

## 🗂️ Project 1: Next.js Frontend

**Location**: `/home/z/my-project/src/`

**What it is**:
- Modern web application interface
- Built with Next.js 15, React, TypeScript
- Uses shadcn/ui components
- Has database via Prisma (SQLite)

**Current State**:
- Minimal starter page at http://localhost:3000
- Ready for you to build features

**Key Files**:
- `src/app/page.tsx` - Main page
- `src/components/ui/` - UI components
- `src/app/api/` - API routes

---

## 🗂️ Project 2: VAL Core Backend

**Location**: `/home/z/my-project/gm-family-trust---val-core--1-/`

**What it is**:
- Financial transaction processing system
- Handles payments, gift cards, bill payments
- Integrates with external APIs
- Uses PostgreSQL and TigerBeetle

**Key Components**:

### Core Services:
- **Spend Engine** - Processes transactions
- **Compliance Service** - Validates transactions
- **Credit Manager** - Manages balances
- **E2E Finality** - Tracks transaction completion

### External Adapters:
- **Tango Card** - Gift cards
- **Arcus** - Bill payments
- **Moov** - Push-to-card cashouts
- **Square** - Payments
- **Instacart** - Grocery delivery

### Infrastructure:
- **PostgreSQL** (Port 5432) - Database
- **TigerBeetle** (Port 3000) - Financial ledger
- **Docker** - Container management

### Monitor Dashboard:
- `monitor.html` - Visual dashboard for monitoring all services
- Shows real-time status
- Displays system events

---

## 🚀 How to Start Everything

### Easy Way (Recommended):

```bash
cd /home/z/my-project
./start.sh start-all
```

This starts:
✅ Infrastructure (Docker containers)
✅ VAL Core Backend (Port 3001)
✅ Next.js Frontend (Port 3000)

### Check Status:
```bash
./start.sh status
```

### Stop Everything:
```bash
./start.sh stop
```

---

## 📍 Access Points

| Service | URL/Path | Description |
|---------|----------|-------------|
| Next.js App | http://localhost:3000 | Main web application |
| VAL Core API | http://localhost:3001 | Backend API |
| Monitor Dashboard | `gm-family-trust---val-core--1-/monitor.html` | Open in browser |

---

## 🔗 How They Connect

### Current State:
- **Independent** - They run separately
- **Optional Integration** - Next.js CAN talk to VAL Core if you want

### Integration Example:
```typescript
// In Next.js, call VAL Core API
fetch('/api/transaction?XTransformPort=3001', {
  method: 'POST',
  body: JSON.stringify({ amount: 100 })
})
```

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| **README.md** | Main overview (this file) |
| **PROJECT_GUIDE.md** | Complete detailed guide |
| **AGENT_QUICK_REFERENCE.md** | Quick reference for AI agents |
| **start.sh** | Startup script |

---

## 🎯 What You Should Do

### If you want to build the frontend:
1. Work in `/home/z/my-project/src/`
2. Use Next.js and shadcn/ui components
3. Access at http://localhost:3000

### If you want to work with VAL Core:
1. Work in `/home/z/my-project/gm-family-trust---val-core--1-/`
2. Backend logic in `val/` directory
3. Access API at http://localhost:3001
4. Monitor with `monitor.html`

### If you want full-stack integration:
1. Create Next.js pages that call VAL Core API
2. Use `XTransformPort=3001` for backend requests
3. Build UI to manage transactions and adapters

---

## 🎮 Quick Commands

```bash
cd /home/z/my-project

# Start everything
./start.sh start-all

# Start just frontend
./start.sh start-frontend

# Start just backend
./start.sh start-backend

# Open monitor
./start.sh start-monitor

# Check status
./start.sh status

# Stop all
./start.sh stop

# Help
./start.sh help
```

---

## 📊 Services Summary

```
FRONTEND (Port 3000)
├── Next.js App - Your web interface
└── Access: http://localhost:3000

BACKEND (Port 3001)
├── VAL Core Server - Financial API
├── Access: http://localhost:3001
└── Monitor: monitor.html

INFRASTRUCTURE
├── PostgreSQL (5432) - Database
├── TigerBeetle (3000) - Ledger
└── Docker - Container management
```

---

## 💡 Key Points to Remember

1. **Two Projects**: Next.js (frontend) + VAL Core (backend)
2. **Independent**: They can run separately
3. **Integratable**: Next.js can call VAL Core API
4. **Startup Script**: Use `./start.sh` to manage everything
5. **Monitor**: Use `monitor.html` to watch VAL Core services
6. **Documentation**: Read `PROJECT_GUIDE.md` for details

---

**Questions? Check `PROJECT_GUIDE.md` for complete documentation!**
