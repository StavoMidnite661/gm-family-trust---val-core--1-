# SOVR LANGUAGE BLACKLIST V2

## NEVER USE THESE WORDS

If **any** of these appear in code, documentation, or conversation, the system is compromised.

### ❌ FORBIDDEN TERMS

#### System Authority
- "Source of truth database"
- "Central ledger"
- "Master record"
- "Authoritative source"
- "Primary system"

#### Payment Processing
- "Payment processor"
- "Payment gateway"
- "Payment system"
- "Payment network"
- "Payment rail"

#### Custodial Language
- "User funds"
- "System balance"
- "Shared pool"
- "Reserve account"
- "Custody wallet"

#### Balance Mutation
- "Account balance update"
- "Manual adjustment"
- "Admin override"
- "Discretionary edit"
- "Force settlement"

#### Settlement Language
- "Settlement layer"
- "Settlement engine"
- "Settlement finality"
- "Settlement status"
- "Pending settlement"

#### Fiat Privilege
- "Fiat-backed"
- "USD-backed"
- "Dollar-pegged"
- "Redemption in USD"
- "Fiat equivalent"

#### Reversal Operations
- "Chargeback"
- "Refund"
- "Rollback"
- "Reversal"
- "Undo transaction"

#### Narrative Authority
- "Reconciliation required"
- "Data correction"
- "Audit adjustment"
- "Posting correction"
- "Journal entry edit"

#### Custodial Ambiguity
- "Held by system"
- "In our control"
- "Under management"
- "In custody"
- "In escrow"

#### Fiat Dependency
- "Fiat on-ramp"
- "Fiat off-ramp"
- "Fiat gateway"
- "Fiat bridge"
- "Fiat conversion"

#### Central Control
- "Freeze funds"
- "Lock account"
- "Disable user"
- "Suspend operations"
- "Emergency stop"

#### Narrative Truth
- "Story about what happened"
- "Historical record"
- "Transaction history"
- "Past events"
- "What occurred"

#### Semantic Reversion
- "On-ramp"
- "Off-ramp"
- "Payment"
- "Balance"
- "Custody"

### ✅ ALLOWED TERMS

#### Mechanical Truth
- "Clearing"
- "Finality"
- "Transfer"
- "Obligation"
- "Claim"

#### Honoring
- "Honoring agent"
- "External executor"
- "Optional honoring"
- "Claim fulfillment"
- "Obligation execution"

#### Observation
- "Narrative mirror"
- "Immutable log"
- "Audit trail"
- "Read-only record"
- "Observation layer"

#### Authority
- "Sole clearing authority"
- "Mechanical truth"
- "Deterministic result"
- "Finalized transfer"
- "Cleared obligation"

#### Discipline
- "No overrides"
- "No edits"
- "No reversals"
- "No discretion"
- "No exceptions"

#### Translation Paths
- "Translation path"
- "Honoring interface"
- "External adapter"
- "Value translation"
- "Claim execution"

## LANGUAGE DRIFT DETECTION

### RED FLAGS IN CODE

```typescript
// ❌ FORBIDDEN
function updateUserBalance(userId: string, amount: number) {
  // Never manually adjust balances
}

// ✅ ALLOWED
function recordTransfer(transfer: Transfer) {
  // Let clearing engine update balances
}
```

```typescript
// ❌ FORBIDDEN
interface PaymentProcessor {
  // Never call it a payment processor
}

// ✅ ALLOWED
interface HonoringAgent {
  // External claim fulfillment
}
```

```typescript
// ❌ FORBIDDEN
class SettlementEngine {
  // Never call it settlement
}

// ✅ ALLOWED
class ClearingEngine {
  // Mechanical truth
}
```

### RED FLAGS IN DOCUMENTATION

❌ "The system processes payments"
✅ "The system clears obligations"

❌ "User funds are held securely"
✅ "Cleared obligations exist"

❌ "Balances are updated daily"
✅ "Balances are mathematical results"

❌ "Payments are settled"
✅ "Obligations are cleared"

❌ "Fiat on/off ramps available"
✅ "External value translation adapters"

### RED FLAGS IN CONVERSATION

❌ "We need to reconcile the ledger"
✅ "We need to verify clearing finality"

❌ "The balance was adjusted"
✅ "The transfer was recorded"

❌ "The payment was reversed"
✅ "A new transfer was created"

❌ "The account was frozen"
✅ "The attestor rejected the claim"

❌ "The funds are in custody"
✅ "The obligations are cleared"

## DISIPLINE PROTOCOL

### WHEN YOU HEAR FORBIDDEN LANGUAGE

1. **Stop the conversation**
2. **Identify the forbidden term**
3. **Replace with allowed term**
4. **Document the violation**
5. **Train the speaker**

### WHEN YOU SEE FORBIDDEN CODE

1. **Do not merge**
2. **Identify the violation**
3. **Replace with correct term**
4. **Document the fix**
5. **Train the developer**

### WHEN YOU READ FORBIDDEN DOCUMENTATION

1. **Do not approve**
2. **Identify the violation**
3. **Replace with correct term**
4. **Document the correction**
5. **Train the writer**

## FAILURE MODE: SEMANTIC REVERSION

### Description
Reintroduction of payment, balance, or custody language into the system.

### Impact
System becomes narratively reclassified as fintech, losing sovereign properties.

### Mitigation
- **Language audits:** Regular reviews of all documentation
- **Operator retraining:** Immediate correction of violations
- **Document invalidation:** Retire documents with violations
- **Code reviews:** Enforce language discipline in all PRs

## FINAL VERDICT

**Language discipline = system survival.**

If you use forbidden terms, you are **dangerous**.

**This is not fintech. This is clearing reality itself.**
