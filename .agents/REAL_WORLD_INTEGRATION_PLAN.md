# 🛠️ REAL WORLD INTEGRATION PLAN (BOARD CHECKPOINT)

> **Target Agent:** Gemini CLI Agent / Kilo Code Agent
> **Objective:** Transition VAL Core from "Demo Mode" (mocks) to "Real World Integration".

## 🛑 BOARD STATUS: APPROVED FOR INTEGRATION

## 📅 PHASE 1: NARRATIVE MIRROR (POSTGRES)

**Goal:** Persist observations and audit trails.

1.  **Install Dependencies**
    ```bash
    npm install pg
    npm install -D @types/pg
    ```
2.  **Infrastructure Setup**
    - Create `docker-compose.yml` for Postgres (and TigerBeetle).
    - Define `init.sql` for the `journal_entries` table.
3.  **Implement Bridge**
    - Create `val/adapters/postgres_mirror.ts`.
    - Implement `INarrativeMirror` interface using `pg` Pool.
    - **Doctrine Check:** Ensure it is READ-ONLY for operators (INSERT only via Event Bus).

## 🐅 PHASE 2: TIGERBEETLE INTEGRATION

**Goal:** Mechanical Truth. Move off the mock.

1.  **Infrastructure**
    - Add TigerBeetle to `docker-compose.yml` (or use existing binary in `tigerbeetle-main`).
    - Initialize cluster file: `0_0.tigerbeetle`.
2.  **Client Implementation**
    - Create `val/services/tigerbeetle_client.ts`.
    - Replace `tigerbeetle_mock.ts` logic with real `createTransfers` calls.
    - Map `NARRATIVE_ACCOUNTS` (MINT, STABLECOIN, ODFI) to 128-bit UInts.
3.  **Verification**
    - Run `tb-cli` to inspect accounts after frontend actions.

## 🔐 PHASE 3: ATTESTATION & SECURITY

**Goal:** Cryptographic proof for all value entry.

1.  **Key Management**
    - Generate "Genesis Keypair" (Ed25519).
    - Store public key in `AttestationEngine`.
2.  **Signing Middleware**
    - All `/api/spend` requests must include a signature.
    - `AttestationEngine` verifies signature before passing to `SpendEngine`.
3.  **Doctrine Check:** Reject any unsigned flows.

## 🚀 EXECUTION ORDER (CLI AGENT TASKS)

### Task 1: Docker Foundation

- [x] Create `docker-compose.yml` with `postgres:15` and `tigerbeetle`.
- [x] Verify both services start.

### Task 2: Postgres Mirror Implementation

- [x] `npm install pg`
- [x] Create `val/services/postgres-mirror.ts`
- [x] Update `val/server.ts` to use real PostgresMirror instead of memory.

### Task 3: TigerBeetle Realization

- [x] Init TB Cluster.
- [x] Update `SpendEngine` to use real TB client.

### Task 4: End-to-End Test

- [x] Frontend "Execute Trust Flow" -> API -> Auth -> TB(Clearing) -> Postgres(Mirror) -> Frontend(Observation).

---

## 🔒 PHASE 4: VAULT SYNC (BLOCKCHAIN BRIDGE)

**Goal:** Connect wallet, burn on-chain assets, and credit ledger.

### Task 5: Wallet Persistence

- [x] Implement localStorage wallet connection persistence.
- [x] Auto-reconnect on page load.

### Task 6: Automated Burn Flow

- [x] Create burn logic in `AttestationModal.tsx`.
- [x] Enforce Base Network (Chain ID 8453) before burn.
- [x] Capture transaction hash and link to attestation.

### Task 7: Transaction History

- [x] Add `/api/history/:userId` endpoint.
- [x] Create `HistoryModal` component in `App.tsx`.
- [x] Query Narrative Mirror for 6-month lookback.

---

## 🚀 PHASE 5: PRODUCTION DEPLOYMENT

**Goal:** Deploy ValCore to public internet.

### Task 8: VPS Provisioning

- [x] Provision VPS (Hetzner/DigitalOcean/AWS).
- [x] Install Docker, Node.js, Nginx.
- [x] Copy project files.

### Task 9: Domain & SSL

- [x] Point Namecheap domain to VPS IP (A Record).
- [x] Configure Nginx reverse proxy.
- [x] Install SSL via Certbot (Let's Encrypt).

### Task 10: Production Launch

- [x] Run `docker-compose up -d` (TigerBeetle + Postgres).
- [x] Build frontend: `npm run build`.
- [x] Start backend: `docker compose up -d`.
- [x] Verify public access via domain.
