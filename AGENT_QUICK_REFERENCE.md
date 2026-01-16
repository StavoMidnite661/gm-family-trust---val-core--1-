# Agent Quick Reference Guide

## 📌 WHAT THIS PROJECT IS

This is a **dual-project development environment** containing:

1. **Next.js 15 Frontend** (Port 3000)
   - Modern React web application
   - Uses shadcn/ui components
   - Currently has minimal starter page

2. **VAL Core Backend** (Port 3001)
   - Financial transaction processing system
   - Uses TigerBeetle (ledger) and PostgreSQL (database)
   - Has multiple external API adapters
   - Includes monitor.html dashboard for monitoring

## 🔗 PROJECT RELATIONSHIP

- **Current State**: Two INDEPENDENT services running separately
- **Integration Point**: Next.js frontend CAN communicate with VAL Core backend via API
- **Monitor Dashboard**: A standalone HTML file (monitor.html) for visual monitoring of VAL Core services

---

## 📁 FILE LOCATIONS

```
/home/z/my-project/                          # ROOT DIRECTORY
├── src/app/page.tsx                         # Next.js frontend entry
├── src/components/ui/                        # shadcn/ui components
├── prisma/                                  # Database for Next.js
├── start.sh                                  # Startup script
├── PROJECT_GUIDE.md                          # Full documentation
│
├── gm-family-trust---val-core--1-/           # VAL CORE BACKEND (Submodule)
│   ├── val/server.ts                         # Backend server entry (Port 3001)
│   ├── monitor.html                          # VAL Core monitor dashboard
│   ├── val/adapters/                         # External API integrations
│   ├── val/core/                             # Core business logic
│   ├── docker-compose.yml                    # Infrastructure (Postgres, TigerBeetle)
│   └── package.json                          # Backend dependencies
```

---

## 🚀 HOW TO START EVERYTHING

### Using Startup Script (RECOMMENDED):

```bash
cd /home/z/my-project

# Start ALL services (infrastructure + backend + frontend)
./start.sh start-all

# Check status
./start.sh status

# Stop everything
./start.sh stop
```

### Manual Startup:

```bash
# Start Frontend
cd /home/z/my-project
bun run dev  # Access at http://localhost:3000

# Start Backend (in separate terminal)
cd /home/z/my-project/gm-family-trust---val-core--1-
bun run infra:up   # Start Docker services (Postgres, TigerBeetle)
bun run server     # Start backend server at http://localhost:3001

# Open Monitor Dashboard (in browser)
open /home/z/my-project/gm-family-trust---val-core--1-/monitor.html
```

---

## 🎯 WHAT YOU SHOULD DO

### For Frontend Development (Next.js):
- Work in `/home/z/my-project/src/`
- Use shadcn/ui components from `/home/z/my-project/src/components/ui/`
- Access at http://localhost:3000
- Use Prisma for database operations

### For Backend Development (VAL Core):
- Work in `/home/z/my-project/gm-family-trust---val-core--1-/`
- Core logic in `val/` directory
- Adapters in `val/adapters/`
- Backend server at http://localhost:3001
- Monitor dashboard in `monitor.html`

### For Full-Stack Integration:
- Next.js frontend calls VAL Core backend API via `/api/*?XTransformPort=3001`
- Example: `fetch('/api/transaction?XTransformPort=3001', ...)`

---

## 📊 SERVICE ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT ENVIRONMENT                │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   NEXT.JS     │    │  VAL CORE     │    │  MONITOR.HTML │
│   FRONTEND    │    │   BACKEND     │    │   DASHBOARD   │
│   (Port 3000) │    │  (Port 3001)  │    │   (Static)    │
└───────────────┘    └───────────────┘    └───────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │ PostgreSQL │   │TigerBeetle│   │  Adapters │
    │ (Port 5432)│   │ (Port 3000)│   │ (Ext APIs)│
    └───────────┘   └───────────┘   └───────────┘
```

---

## 🔑 KEY FILES TO KNOW

### Frontend:
- `src/app/page.tsx` - Main page
- `src/app/layout.tsx` - Root layout
- `src/app/api/` - API routes
- `src/components/ui/` - UI components
- `prisma/schema.prisma` - Database schema

### Backend:
- `val/server.ts` - Express server
- `val/index.ts` - Main entry point
- `val/adapters/` - External integrations
- `val/core/` - Core services
- `monitor.html` - Monitoring dashboard

### Documentation:
- `PROJECT_GUIDE.md` - Complete project guide
- `gm-family-trust---val-core--1-/E2E_FINALITY_INTEGRATION_GUIDE.md` - E2E system docs
- `gm-family-trust---val-core--1-/REAL_WORLD_INTEGRATION_GUIDE.md` - Adapter integration

---

## 🎮 AVAILABLE COMMANDS

```bash
# From /home/z/my-project

# Start services
./start.sh start-all       # Start everything
./start.sh start-frontend  # Start only Next.js
./start.sh start-backend   # Start only VAL Core
./start.sh start-infra     # Start Docker services
./start.sh start-monitor   # Open monitor dashboard

# Management
./start.sh status          # Check service status
./start.sh stop            # Stop all services
./start.sh help            # Show help

# Next.js specific
bun run dev                # Start Next.js dev server
bun run lint               # Lint code
bun run db:push            # Push database schema

# VAL Core specific
cd gm-family-trust---val-core--1-
bun run server             # Start backend server
bun run infra:up           # Start Docker infrastructure
```

---

## 📝 COMMON TASKS

### Add a new page to Next.js:
```bash
# Create app directory and page.tsx
mkdir -p src/app/new-page
# Create src/app/new-page/page.tsx
# Access at http://localhost:3000/new-page
```

### Create an API route:
```bash
mkdir -p src/app/api/endpoint
# Create src/app/api/endpoint/route.ts
# Access at http://localhost:3000/api/endpoint
```

### Add a new VAL Core adapter:
```bash
# Create adapter file
cd gm-family-trust---val-core--1-/val/adapters
# Create new-adapter.ts following existing patterns
```

### Monitor VAL Core services:
```bash
# Open monitor.html in browser
# Shows status of:
# - PostgreSQL
# - TigerBeetle
# - Webhook Service
# - VAL Backend
# - All external adapters
```

---

## ⚠️ IMPORTANT NOTES

1. **Port Conflicts**: Next.js uses 3000, VAL Core uses 3001, TigerBeetle uses 3000
2. **Docker Required**: Infrastructure services need Docker running
3. **Startup Order**: Start infrastructure → backend → frontend
4. **Monitor Dashboard**: It's a static HTML file, not part of Next.js
5. **API Communication**: Use `XTransformPort=3001` for backend requests

---

## 🐛 QUICK TROUBLESHOOTING

```bash
# Check what's running
./start.sh status

# Check logs
tail -f frontend.log
tail -f gm-family-trust---val-core--1-/backend.log
tail -f dev.log

# Restart specific service
./start.sh stop
./start.sh start-all

# Port already in use?
lsof -i :3000  # Check Next.js port
lsof -i :3001  # Check backend port
lsof -i :5432  # Check PostgreSQL port
```

---

## 📚 LEARN MORE

- Full guide: `PROJECT_GUIDE.md`
- VAL Core docs: `gm-family-trust---val-core--1-/*.md`
- Next.js docs: https://nextjs.org/docs
- shadcn/ui docs: https://ui.shadcn.com/

---

**REMEMBER**: You have TWO separate projects here. The Next.js frontend and VAL Core backend are independent but can be integrated!
