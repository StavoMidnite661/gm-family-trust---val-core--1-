# 🐛 TODO MIDDLEWARE: Infrastructure Debugging & Validation

**To:** CLI Agent / DevOps Engineer
**From:** Lead Architect (Antigravity)
**Priorities:** Critical Infrastructure Fix

## 🛑 Current Blockers

### 1. Postgres Authentication Failure (Error 28P01)

- **Symptom:** Backend logs show `password authentication failed for user "sovr_admin"`.
- **Context:**
  - Docker container `sovr_postgres` is running.
  - `docker-compose.yml` defines `POSTGRES_USER: sovr_admin` / `PASSWORD: sovereignty_is_mechanical`.
  - `.env.local` was updated (utf-8) to match these credentials.
  - **Hypothesis:** Volume `postgres_data` persists data from an OLD initialization (possibly default `postgres` user or different password).
- **Action Required:**
  - [ ] Connect to `sovr_postgres` shell and verify users (`psql -U postgres`).
  - [ ] **Wipe** `postgres_data` volume and restart to force re-initialization with correct credentials? (Caution: Data loss, but currently only demo data).
  - [ ] Or update `.env.local` to use the working credentials found.

### 2. TigerBeetle Verification

- **Symptom:** `npx tsx val/tests/finalize_real_world.test.ts` hangs or fails to output status.
- **Context:**
  - Container `sovr_tigerbeetle` is UP (after manual format fix).
  - Backend log shows `[TigerBeetle] Attempting Connection...` but no "Connected" success message.
  - **Hypothesis:** `tigerbeetle-node` client version mismatch with binary? Or port mapping issue? Or simply no "Connected" log exists in code (need to check `val/clearing/tigerbeetle/client.ts`).
- **Action Required:**
  - [ ] Verify network connectivity to `localhost:3000`.
  - [ ] Check `val/clearing/tigerbeetle/client.ts` for connection logging.
  - [ ] Run a simple standalone TB script to verify client-server handshake.

### 3. Real World Test Execution

- **Goal:** Successfully run `val/tests/finalize_real_world.test.ts` and see `✔ Result: Success`.

## 📝 New Specs Added (Reference)

The user added these files to root (Read them):

- `ANCHOR_CONTRACT_SPEC.md`
- `INSTACART_ADAPTER_SPEC.md`
- `TIGERBEETLE_LEDGER_SCHEMA.md`

**Instruction:** Once infrastructure is fixed, align `narrative-mirror-bridge.ts` accounts with `TIGERBEETLE_LEDGER_SCHEMA.md`.
