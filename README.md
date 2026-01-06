# GM Family Trust — VAL Core

<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Sovereign Value Attestation Layer for the GM Family Trust

**VAL Core** implements strict sFIAT funding discipline, mechanical TigerBeetle-ready ledgers, and real-time cryptographic integrity monitoring with Sovereign AGI oversight.

---

## What This Is

VAL Core is a **ledger-cleared obligation network** where value exists only as the result of finalized mechanical transfers. It is part of the broader [SOVR Ecosystem](https://github.com/your-org/sovr-ecosystem) governed by SOVR Development Holdings LLC.

### Core Properties

- **TigerBeetle** — Sole mechanical clearing authority (deterministic, immutable)
- **Zero Overdraft Protocol** — Balances are mathematical results, never manually adjusted
- **No Reversals** — Corrections are new obligations, never mutations
- **Attestation-First** — Legitimacy is proven before clearing
- **Honoring Adapters** — External fulfillment agents (Stripe, ACH, Instacart, etc.)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL HONORING AGENTS                            │
│  (Stripe, ACH, Instacart, Amazon, Visa, Coinbase, etc.)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CREDIT TERMINAL                                    │
│  (Intent → Transfer Translator)                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ATTESTOR                                        │
│  (Legitimacy Gate — Cryptographic Proof Validation)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TIGERBEETLE                                       │
│  (Sole Clearing Authority — Mechanical Truth Engine)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EVENT BUS                                         │
│  (Reality Propagation to Observers)                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                 │                        │                        │
                 ▼                        ▼                        ▼
     ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
     │  PostgreSQL      │      │   Analytics      │      │   Audit Trail    │
     │  (Narrative      │      │   (Read-Only)    │      │   (Immutable)    │
     │   Mirror)        │      │                  │      │                  │
     └──────────────────┘      └──────────────────┘      └──────────────────┘
```

---

## Doctrine & Principles

### Rule Zero: Truth is Mechanical

> **If it did not clear in TigerBeetle, it did not happen.**

All decisions are based on finalized transfers. There are no exceptions.

### The Eight Operator Doctrines

1. **No Payment Processing** — The system clears obligations; honoring happens externally
2. **No Balance Edits** — Balances are mathematical results of finalized transfers
3. **No Overrides** — Admins observe; they do not correct reality
4. **Clearing ≠ Honoring** — A cleared obligation does not guarantee external execution
5. **Attestation First** — Legitimacy is proven before clearing; no post-facto validation
6. **Legacy Rails Are Guests** — External agents may honor claims but never define them
7. **Fiat is Optional** — No unit-of-account is privileged
8. **No Reversals** — All failures are handled by new transfers

See [`SOVR_OPERATOR_DOCTRINE_V2.md`](SOVR_OPERATOR_DOCTRINE_V2.md) for complete operational guidance.

---

## Key Components

### Services

| Service | Purpose |
|---------|---------|
| [`services/attestation.ts`](services/attestation.ts) | Cryptographic legitimacy validation before clearing |
| [`services/spend_engine.ts`](services/spend_engine.ts) | Clears obligations through TigerBeetle |
| [`services/narrative_mirror.ts`](services/narrative_mirror.ts) | Human-readable audit trail (PostgreSQL mirror) |
| [`services/tigerbeetle_mock.ts`](services/tigerbeetle_mock.ts) | TigerBeetle integration layer |
| [`services/adapters.ts`](services/adapters.ts) | Honoring agent registry (Stripe, Instacart, etc.) |

### UI Components

| Component | Description |
|-----------|-------------|
| [`App.tsx`](App.tsx) | Main application orchestrator |
| [`components/LedgerTable.tsx`](components/LedgerTable.tsx) | Double-entry ledger visualization |
| [`components/AssetAllocationChart.tsx`](components/AssetAllocationChart.tsx) | Trust allocation visualization |

### Types

| Type | Purpose |
|------|---------|
| [`types.ts`](types.ts) | Core domain types, attestation proofs, merchant adapters |

---

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom dark theme
- **Icons**: Lucide React
- **Cryptography**: ethers.js v6
- **Database**: TigerBeetle (mechanical clearing), PostgreSQL (narrative mirror)
- **State Management**: React hooks + localStorage persistence

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/sovr-holdings/gm-family-trust-val-core.git
cd gm-family-trust-val-core

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Usage

### Dashboard Views

1. **TERMINAL** — Overview of sFIAT capacity, observations, attestations, and trust reserve
2. **HONORING** — Execute trust flows through external honoring agents
3. **HISTORY** — Full audit log of all ledger entries
4. **AUTH** — Authority vault for account introspection
5. **ADAPTERS** — Configure and validate external honoring agents

### Executing a Trust Flow

1. Select an honoring agent (Instacart, Amazon, Stripe, etc.)
2. Choose a consumption anchor (GROCERY, FUEL, HOUSING, MEDICAL, etc.)
3. Enter the USD equivalent amount
4. Click "Execute Trust Flow"
5. Observe the clearing in TigerBeetle and the attestation proof

---

## Authority Hierarchy

| Level | Component | Role |
|-------|-----------|------|
| 1 | **TigerBeetle** | Sole mechanical clearing authority |
| 2 | **Attestors** | Legitimacy gatekeepers |
| 3 | **Observers** | Narrative mirrors (PostgreSQL, Analytics) |
| 4 | **Honoring Agents** | Optional external executors |

No component above clearing may override components below it.

---

## Documentation

| Document | Description |
|----------|-------------|
| [`SOVR_CANONICAL_SPEC_V2.md`](SOVR_CANONICAL_SPEC_V2.md) | Complete system specification and architecture |
| [`SOVR_OPERATOR_DOCTRINE_V2.md`](SOVR_OPERATOR_DOCTRINE_V2.md) | Operational rules and daily checklists |
| [`SOVR_BLACKLIST_V2.md`](SOVR_BLACKLIST_V2.md) | Forbidden terminology and patterns |

---

## License

© 2024 SOVR Development Holdings LLC. All rights reserved.

---

## Related Projects

- [TigerBeetle](https://github.com/tigerbeetle/tigerbeetle) — High-performance financial database
- [SOVR Ecosystem](https://github.com/sovr-holdings) — Complete sovereign stack

---

<div align="center">
  <strong>This is not fintech. This is clearing reality itself.</strong>
</div>
