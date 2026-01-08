# 🐯 TigerBeetle Clearing Authority

## Purpose
This directory defines the **sole mechanical clearing authority** for the SOVR protocol.

TigerBeetle is not a service, dependency, or adapter.
It is the **authoritative ledger of truth**.

No other system is permitted to:
- Approve balances
- Authorize spends
- Reverse transactions
- Simulate clearing

---

## Authority Contract

### TigerBeetle Responsibilities
- Maintain immutable account balances
- Atomically clear obligations via transfers
- Enforce idempotency and determinism
- Persist truth independent of honoring outcomes

### What TigerBeetle Is NOT
- ❌ A narrative system
- ❌ A reporting database
- ❌ A UX concern
- ❌ An honoring adapter

---

## Execution Rules

1. **All obligations clear here first**
2. **Honoring adapters are downstream guests**
3. **Narrative systems observe only**
4. **Failures never rollback clearing**
5. **Adjustments are new obligations**

---

## File Responsibilities

- `client.ts`
  TigerBeetle client initialization and lifecycle

- `settle.ts`
  Canonical clearing operations (`createTransfer`)

- `types.ts`
  Account, transfer, and ID schemas

---

## Forbidden Actions (Hard Rules)

- Reading balances from Postgres
- Conditional clearing based on adapters
- Coupling clearing with narrative writes
- Implementing reversals or refunds

Violations of these rules constitute **protocol failure**.

---

## Design Principle

> Clearing is truth.
> Everything else is commentary.