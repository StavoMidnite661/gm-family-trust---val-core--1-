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
