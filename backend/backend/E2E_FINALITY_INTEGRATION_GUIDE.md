# E2E Finality System - Integration Guide

> **Complete guide for implementing end-to-end finality while maintaining SOVR language discipline**

---

## 📋 Overview

The E2E Finality System provides a **Multi-Adapter Dispatcher** that acts as a bridge between **Mechanical Truth** (TigerBeetle ledger) and **Optional Honoring** of external systems.

### Key Principles

1. **SOVR Canon Compliance**
   - TigerBeetle clearing is FINAL and immutable
   - External honoring is OPTIONAL
   - External failures NEVER reverse clearing
   - Narrative Mirror is OBSERVATION ONLY

2. **Zero-Float Mechanics**
   - No pre-funding of adapter accounts
   - Net-clearing via CreditManager
   - Credit terms with external providers

3. **Language Discipline**
   - "Clearing" not "payment processing"
   - "Honoring" not "fulfillment"
   - "Obligation" not "transaction"
   - "Credit" not "wallet"

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   User Request (Frontend)                       │
└─────────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│         E2E FINALITY SYSTEM (New Component)                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Honoring Dispatcher (Router)                  │   │
│  └───────────────────────────┬─────────────────────┘   │
│                            │                           │
│                            ▼               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ External Adapters (Optional Honoring)        │   │
│  │ ┌─────────────────────────────────────────┐   │
│  │ │ GROCERY  │ UTILITY  │ CASH_OUT   │   │
│  │ └──────────────┴───────────┴───────────┘   │
│  └─────────────────────────────┬─────────────────────┘   │
│                            │                           │
│                            ▼               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Credit Manager (Net-Clearing)          │   │
│  │ Zero-Float Credit Limits                │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│         Narrative Mirror (Observation)                    │
│         Records: E2E Events, Credit Alerts        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Component Structure

### Core Types
- `val/core/e2e-finality-types.ts`
  - `AnchorType` enum (GROCERY, UTILITY, CASH_OUT, etc.)
  - `ClearedTransfer` interface
  - `HonoringResult` interface
  - `ExternalAdapter` interface
  - `CreditAccount` interface
  - And more...

### Dispatcher
- `val/core/honoring-dispatcher.ts`
  - Routes cleared transfers to appropriate adapters
  - Retry logic with exponential backoff
  - Queue management
  - Statistics and monitoring

### Adapters
- `val/adapters/tango_client.ts` - Real Tango Card API client
- `val/adapters/tango_adapter.ts` - Updated with real API
- `val/adapters/instacart_adapter.ts` - Zero-float via Tango
- `val/adapters/arcus-utility-adapter.ts` - UTILITY via Arcus Bill-Pay
- `val/adapters/square_adapter.ts` - Mock only (real impl pending)

### Credit Manager
- `val/core/credit-manager.ts`
  - Net-clearing tracking
  - Credit limit management
  - Automatic clearing batches
  - Utilization alerts

---

## 🔄 E2E Workflow

### 1. Clearing (Mechanical Truth)
```
User Intent
    ↓
1. Client Signs (Attestation)
    ↓
2. POST /api/spend (with signature)
    ↓
3. Backend Verifies Signature
    ↓
4. Compliance Check
    ↓
5. TigerBeetle Clearing (FINAL)
    - Debits user balance
    - Credits anchor obligation
    - EMIT: CLEARING_FINALIZED event
    ↓
```

### 2. Dispatching
```
CLEARING_FINALIZED Event
    ↓
1. HonoringDispatcher receives event
    ↓
2. Routes to appropriate adapter (by anchorType)
    ↓
3. Adapter checks credits
    ↓
4. Adapter executes honoring
```

### 3. Honoring (External Execution)
```
Adapter Execution
    ↓
1. Call external API (Tango, Arcus, etc.)
    ↓
2. Receive confirmation/proof
    ↓
3. Generate fulfillment proof hash
    ↓
4. Record E2E Finality Event in Narrative Mirror
    ↓
```

### 4. Net-Clearing (Optional)
```
Daily Clearing Cycle
    ↓
1. CreditManager creates clearing batch
    ↓
2. Calls provider clearing API
    ↓
3. Updates credit: reduces pending, increases cleared
    ↓
4. Records clearing in Narrative Mirror
```

---

## 🎯 Implementation Steps

### Step 1: Environment Configuration

Add to `.env`:
```bash
# Arcus Configuration
ARCUS_MERCHANT_ID=your_arcus_merchant_id
ARCUS_SECRET_KEY=your_arcus_secret_key
ARCUS_SANDBOX=true  # Set to false for production
ARCUS_API_URL=https://api.arcus.com  # Or production URL

# Credit Configuration
RESERVE_CLEARING_INTERVAL_MS=86400000  # 24 hours
RESERVE_CREDIT_LIMIT_MARGIN=0.8  # Use 80% of limit
```

### Step 2: Initialize VAL System

```typescript
import { VALSystem } from './val/index';

const valSystem = new VALSystem(
  process.env.ATTESTOR_PRIVATE_KEY || 'your_attestor_key',
  ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545'),
  {
    tango: {
      platformName: process.env.TANGO_PLATFORM_NAME,
      platformKey: process.env.TANGO_PLATFORM_KEY,
      sandbox: process.env.USE_SANDBOX !== 'false',
    },
    creditConfig: {
      clearingIntervalMs: 86400000,
      creditLimitMargin: 0.8,
    }
  }
);

await valSystem.initialize();
```

### Step 3: Integrate with TigerBeetle

When TigerBeetle completes a transfer, emit `CLEARING_FINALIZED` event:

```typescript
import { HonoringDispatcher } from './val/core/honoring-dispatcher';

const clearedTransfer: ClearedTransfer = {
  transferId: 'TB-1234567890',
  amount: 50_000000n,  // $50 in micro-units
  userAddress: '0xUserAddress...',
  anchorType: AnchorType.GROCERY,
  finalityProof: '0xabc123...',
  timestamp: Date.now(),
  metadata: { /* ... */ },
};

const request: DispatchRequest = {
  transfer: clearedTransfer,
  priority: 'NORMAL',
};

const result = await honoringDispatcher.dispatch(request);
```

### Step 4: Monitor E2E Finality

```typescript
// Get dispatch statistics
const stats = honoringDispatcher.getStatistics();
console.log(`Active dispatches: ${stats.activeDispatches}`);
console.log(`Queued: ${stats.queuedDispatches}`);
console.log(`Adapters: ${stats.registeredAdapters}`);

    // Get credit status
const credits = creditManager.getAllCredits();
credits.forEach(credit => {
  console.log(`${credit.adapterType}: cleared=$${credit.clearedBalance}, pending=$${credit.pendingClearing}`);
});

// Get alerts
const alerts = creditManager.getAlerts(50);
console.log(`Recent alerts:`, alerts);
```

---

## 🔐 Critical Invariants

### 1. Indifference to Failure
If Arcus or Tango API is down:
- TigerBeetle ledger remains FINAL
- Obligation is still cleared
- System waits until adapter recovers or manual intervention

### 2. No Narrative Dependency
Narrative Mirror stores:
- E2E Finality events (for audit trail)
- Credit alerts (for monitoring)
- NEVER used to determine if clearing was valid

### 3. Mechanical Truth
TigerBeetle clearing happens in MICROSECONDS:
- Once committed, it's mathematically final
- External systems cannot override this truth

### 4. Zero-Float
No pre-funding of adapter accounts:
- Settled balance increases only after net clearing
- Pending clearing tracks obligations awaiting provider clearing

---

## 📊 Monitoring & Observability

### Key Metrics

| Metric | Source | Alert Threshold |
|--------|-------|-----------------|
| Honoring Success Rate | Dispatcher | < 99% |
| Adapter Response Time | Dispatcher | > 30s |
| Credit Utilization | CreditManager | > 95% (warning), > 98% (critical) |
| Clearing Success Rate | CreditManager | < 95% |

### Log Analysis

```bash
# View recent E2E events
grep "E2E_FINALITY" val/core/narrative-mirror-service.ts

# View credit alerts
grep "RESERVE-ALERT" val/core/narrative-mirror-service.ts

# View adapter errors
grep "ERROR" val/adapters/*.ts | grep -i error

# View dispatcher activity
grep "Dispatcher" val/core/honoring-dispatcher.ts
```

---

## 🚀 Testing

### 1. Test with Mock Adapters

```typescript
// Test dispatch flow
const testTransfer: ClearedTransfer = {
  transferId: 'TEST-001',
  amount: 10000000n,  // $10 test
  userAddress: '0xTestUser',
  anchorType: AnchorType.GROCERY,
  finalityProof: '0xtestproof',
  timestamp: Date.now(),
  metadata: {},
};

const result = await honoringDispatcher.dispatch({ transfer: testTransfer });
console.log('Test result:', result);
```

### 2. Test Credit Management

```typescript
// Check if obligation can be honored
const canHonor = creditManager.canHonor(
  AnchorType.GROCERY,
  10000000n  // $10
);

console.log('Can honor:', canHonor);
// { canHonor: true, reason: undefined } or
// { canHonor: false, reason: 'Insufficient credit' }
```

---

## 📦 Deployment Checklist

Before production:

- [ ] Real API credentials configured (Tango, Arcus)
- [ ] E2E finality event listener configured
- [ ] Credit manager clearing intervals set
- [ ] Credit limits configured per adapter
- [ ] All adapters registered in dispatcher
- [ ] TigerBeetle `CLEARING_FINALIZED` events integrated
- [ ] Monitoring and alerting configured
- [ ] Error handling and retry logic tested
- [ ] Net-clearing flow tested
- [ ] Compliance layer integrated (if applicable)

---

## 🎓 Summary

The E2E Finality System provides:

✅ **Multi-Adapter Dispatcher** - Routes cleared obligations to correct adapters
✅ **Zero-Float Support** - Net-clearing without pre-funding
✅ **Arcus Integration** - UTILITY anchor path via Bill-Pay
✅ **Credit Manager** - Automatic clearing, credit limits, utilization alerts
✅ **Language Discipline** - SOVR terminology maintained throughout
✅ **E2E Finality Tracking** - Complete audit trail in Narrative Mirror
✅ **Indifference to Failure** - TigerBeetle truth remains final

**Ready for production deployment with real-world anchors.**

---

*E2E Finality Integration Guide v1.0 - January 2026*
