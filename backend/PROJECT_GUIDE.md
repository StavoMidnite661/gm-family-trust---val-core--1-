# Z.AI Development Environment

## 📋 Project Overview

This repository contains **two separate but related projects**:

1. **Next.js Frontend Application** - A modern web application built with Next.js 15, TypeScript, and shadcn/ui
2. **VAL Core Backend System** - A financial transaction processing system with multiple adapters and infrastructure services

---

## 🏗️ Project Structure

```
/home/z/my-project/
├── src/                              # Next.js Frontend
│   ├── app/                          # App Router pages
│   ├── components/                   # React components (shadcn/ui)
│   ├── hooks/                        # Custom React hooks
│   └── lib/                          # Utility libraries
│
├── gm-family-trust---val-core--1-/   # VAL Core Backend (Submodule)
│   ├── val/                          # Core business logic
│   │   ├── adapters/                 # External API integrations
│   │   │   ├── tango_adapter.ts      # Tango Card API
│   │   │   ├── arcus-utility-adapter.ts  # Arcus Bill-Pay
│   │   │   ├── moov-cashout-adapter.ts   # Moov Push-to-Card
│   │   │   └── square_adapter.ts    # Square Payments
│   │   ├── core/                     # Core services
│   │   │   ├── compliance-service.ts # Compliance checking
│   │   │   ├── credit-manager.ts     # Credit balance management
│   │   │   ├── e2e-finality-types.ts # E2E finality types
│   │   │   ├── honoring-dispatcher.ts # Transaction dispatcher
│   │   │   ├── narrative-mirror-service.ts # PostgreSQL mirror
│   │   │   └── spend_engine.ts      # Transaction processing
│   │   ├── webhooks/                 # Webhook handlers
│   │   └── index.ts                  # Main entry point
│   │
│   ├── monitor.html                  # VAL Core Service Monitor Dashboard
│   ├── val/server.ts                 # Backend server (Port 3001)
│   ├── docker-compose.yml            # Infrastructure services
│   └── package.json                  # Backend dependencies
│
├── prisma/                           # Database schema for Next.js
├── start.sh                          # Startup script (THIS FILE)
└── package.json                      # Frontend dependencies
```

---

## 🎯 What Each Project Does

### 1. Next.js Frontend (Port 3000)

**Purpose**: Main web application interface

**Tech Stack**:
- Next.js 15 with App Router
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui components
- Prisma ORM with SQLite
- React Query for server state
- Zustand for client state

**Current State**: Minimal starter page at `http://localhost:3000`

---

### 2. VAL Core Backend (Port 3001)

**Purpose**: Financial transaction processing system

**Key Components**:

#### Infrastructure Services:
- **PostgreSQL** (Port 5432) - Narrative mirror database
- **TigerBeetle** (Port 3000) - High-performance financial ledger (clearing authority)

#### Core Services:
- **Spend Engine** - Processes spend transactions
- **Compliance Service** - Validates transactions against rules
- **Credit Manager** - Manages credit balances
- **Honoring Dispatcher** - Dispatches transactions to adapters
- **E2E Finality System** - End-to-end transaction finality tracking

#### External API Adapters:
- **Tango Card** - Gift card processing
- **Arcus** - Bill payment services
- **Moov** - Push-to-Card cashouts
- **Square** - Payment processing
- **Instacart** - Grocery delivery integration

#### Monitor Dashboard:
- `monitor.html` - Visual dashboard for monitoring all VAL Core services
- Shows real-time status of infrastructure and adapters
- Provides control buttons for services
- Displays system event logs

---

## 🚀 Quick Start

### Prerequisites

- **Bun** - Fast JavaScript runtime and package manager
- **Docker** - For running infrastructure services (PostgreSQL, TigerBeetle)

### Installation

```bash
# Install Bun if not already installed
curl -fsSL https://bun.sh/install | bash

# Clone the repository (if you haven't already)
git clone https://github.com/StavoMidnite661/Z.AI_Val.git
cd Z.AI_Val

# Make the startup script executable
chmod +x start.sh
```

### Running the Projects

#### Option 1: Use the Startup Script (Recommended)

```bash
# Start ALL services (infrastructure, backend, frontend)
./start.sh start-all

# Start ONLY the Next.js frontend
./start.sh start-frontend

# Start ONLY the VAL Core backend
./start.sh start-backend

# Start ONLY infrastructure services (Docker)
./start.sh start-infra

# Open the VAL Core monitor dashboard
./start.sh start-monitor

# Check status of all services
./start.sh status

# Stop all running services
./start.sh stop
```

#### Option 2: Manual Startup

**Start Frontend (Next.js)**:
```bash
# Install dependencies (first time only)
bun install

# Setup database (first time only)
bun run db:push

# Start development server
bun run dev
# Access at: http://localhost:3000
```

**Start Backend (VAL Core)**:
```bash
cd gm-family-trust---val-core--1-

# Install dependencies (first time only)
bun install

# Start infrastructure (PostgreSQL, TigerBeetle)
bun run infra:up

# Start backend server
bun run server
# Access at: http://localhost:3001

# Or return to project root and open monitor
cd ..
open gm-family-trust---val-core--1-/monitor.html
```

---

## 📊 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Next.js Frontend | 3000 | Main web application |
| VAL Core Backend | 3001 | Financial transaction API |
| PostgreSQL | 5432 | Narrative mirror database |
| TigerBeetle | 3000 | Financial ledger (clearing authority) |
| Webhook Service | 3002 | Adapter notifications |

---

## 🔧 How the Projects Are Related

### Current Relationship:
- **Independent**: The Next.js frontend and VAL Core backend currently run as separate services
- **Future Integration**: The frontend can be enhanced to communicate with the VAL Core backend API

### Potential Integration Points:
1. **Dashboard Integration**: Create a Next.js page that displays VAL Core monitoring data
2. **Transaction UI**: Build a React interface for creating and monitoring transactions
3. **Adapter Management**: Create UI components to configure and manage external adapters
4. **Real-time Updates**: Use WebSocket to stream live transaction data to the frontend

### Example: Connecting Frontend to Backend

```typescript
// Example API call in Next.js frontend
import { fetch } from 'undici'

async function createTransaction(data) {
  const response = await fetch('/api/transaction?XTransformPort=3001', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}
```

---

## 📖 Documentation

### VAL Core Backend:
- `E2E_FINALITY_INTEGRATION_GUIDE.md` - End-to-end finality system documentation
- `REAL_WORLD_INTEGRATION_GUIDE.md` - Real-world adapter integration guide
- `SOVR_*` files - System of Record and Verification (SOVR) documentation

### Next.js Frontend:
- Uses standard Next.js 15 documentation
- shadcn/ui components: https://ui.shadcn.com/

---

## 🛠️ Development Workflow

### For Frontend Development:
```bash
# Start only the frontend
./start.sh start-frontend

# Or manually
bun run dev
```

### For Backend Development:
```bash
# Start backend with infrastructure
./start.sh start-backend

# Or manually
cd gm-family-trust---val-core--1-
bun run infra:up  # First time
bun run server
```

### For Full-Stack Development:
```bash
# Start everything
./start.sh start-all

# Check logs
tail -f frontend.log
tail -f gm-family-trust---val-core--1-/backend.log
```

---

## 📝 Configuration

### Environment Variables

Create `.env` files for configuration:

**Frontend (.env)**:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"
```

**Backend (gm-family-trust---val-core--1-/.env)**:
```env
POSTGRES_CONNECTION_STRING="postgresql://user:pass@localhost:5432/val_core"
TIGERBEETLE_ADDRESS="3000"
# Add adapter API keys here
TANGO_API_KEY="your-tango-key"
ARCUS_API_KEY="your-arcus-key"
MOOV_API_KEY="your-moov-key"
SQUARE_API_KEY="your-square-key"
```

---

## 🐛 Troubleshooting

### Port Already in Use:
```bash
# Check what's using a port
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Kill the process
kill -9 <PID>
```

### Database Issues:
```bash
# Reset database
bun run db:reset

# Or manually
rm prisma/dev.db
bun run db:push
```

### Docker Issues:
```bash
# Stop Docker containers
cd gm-family-trust---val-core--1-
docker-compose down

# Start again
docker-compose up -d
```

---

## 📦 Deployment

### Frontend (Vercel Recommended):
```bash
bun run build
# Deploy build output to Vercel
```

### Backend:
1. Deploy infrastructure to cloud (AWS, GCP, Azure)
2. Deploy backend server (Node.js/Express)
3. Configure environment variables
4. Set up monitoring

---

## 🤝 Contributing

This is a development environment. When making changes:
1. Test locally using `./start.sh start-all`
2. Commit changes to the appropriate project
3. Push to GitHub
4. Open pull requests

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review the VAL Core documentation in the submodule
- Check Next.js documentation at https://nextjs.org/docs

---

## 📄 License

This project is part of the Z.AI development environment.

---

## 🗺️ Quick Reference

### Commands:
```bash
./start.sh start-all      # Start everything
./start.sh status          # Check status
./start.sh stop            # Stop everything
./start.sh help            # Show all commands
```

### URLs:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Monitor: Open `gm-family-trust---val-core--1-/monitor.html` in browser

### Logs:
- Frontend: `tail -f frontend.log`
- Backend: `tail -f gm-family-trust---val-core--1-/backend.log`
- Dev server: `tail -f dev.log` (Next.js)

---

**Last Updated**: 2025
**Maintained By**: Z.AI Development Team
