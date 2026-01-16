# VAL Core Backend

Financial transaction processing system running on port 3001.

## Structure

```
backend/
├── val/
│   ├── server.ts           # Express server (port 3001)
│   ├── core/               # Core services
│   │   ├── spend-engine.ts
│   │   ├── compliance.ts
│   │   └── ...
│   └── adapters/           # External API integrations
│       └── index.ts
├── docker-compose.yml      # Infrastructure (PostgreSQL, TigerBeetle)
├── monitor.html           # Service monitoring dashboard
└── package.json           # Backend dependencies
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
bun install
```

### 2. Start VAL Core Backend

```bash
bun run dev
```

The backend will start on `http://localhost:3001`

### 3. Start Infrastructure

```bash
# Start PostgreSQL
docker-compose up -d

# TigerBeetle needs to be started separately
# See documentation for setup instructions
```

### 4. Check Status

Open `monitor.html` in your browser to see service status.

## API Endpoints

- `GET /health` - Health check
- `GET /api/adapters` - List available adapters
- `GET /api/transactions` - Transaction API

## Services

- **Spend Engine** - Transaction spending logic
- **Compliance Service** - Regulatory compliance checks
- **Credit Manager** - Credit management
- **E2E Finality** - End-to-end transaction finality
- **Honoring Dispatcher** - Transaction honoring

## Adapters

- Tango Cards API
- Arcus Bill-Pay API
- Moov Push-to-Card API
- Square Payments API
- Instacart API

## Ports

- 3001 - VAL Core Backend
- 5432 - PostgreSQL
- 3000 - TigerBeetle (Financial Ledger)
