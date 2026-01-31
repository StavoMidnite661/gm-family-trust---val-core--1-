# Attestation Flow Architecture

## Overview

In the SOVR ValCore system, value is never "minted" by the system itself. Instead, value is **Attested** to by a trusted external entity (the Attestor) and then **Cleared** by the Truth Engine (TigerBeetle).

This document outlines the flow of value entry, specifically focused on the `usdSOVR` Stablecoin realization.

## The Doctrine

> "Value does not appear; it is Attested to. The System merely clears the mechanical truth of that attestation."

## The Flow

### 1. Intent (External World)

A user performs an action in the real world (e.g., wires funds to a trust, deposits cash at a kiosk). This creates an **Intent** to realize value within the system.

### 2. Attestation (The Bridge)

The `AttestationEngine` acts as the bridge. It verifies the external proof (e.g., bank wire confirmation) and signs a `CreditEvent` of type `ATTESTATION_VERIFIED`.

**Data Structure:**

```typescript
interface Attestation {
  attestor: string; // Public key of the Attestor
  signature: string; // Cryptographic signature of the event hash
  proof: {
    merkleRoot: string; // Root of the event batch
    path: string[]; // Merkle path
  };
  timestamp: Date;
}
```

### 3. Mechanical Truth (The Clearing)

Once attested, the system submits the transfer to TigerBeetle.

**Transfer:**

- **Source**: `OBSERVED_TOKEN_REALIZATION` (The "External World" Account)
- **Destination**: `HONORING_ADAPTER_STABLECOIN` (The User's "Vault")
- **Amount**: The attested value (in micro-units)
- **Ledger**: SOVR (999)

This maintains the Zero-Debt property: Every unit of `usdSOVR` in a user's vault is mechanically balanced by a debit in the Realization account.

### 4. Observation (The Log)

The `EventLogger` records the verified attestation in the `NarrativeMirror` (PostgreSQL/Memory). This provides the human-readable audit trail ("The Shadow") of the mechanical action.

## UI Implementation

The UI represents this flow not as a "Deposit" or "Buy" button, but as an **Attestation Console**.

1. **Request**: User requests realization.
2. **Signing**: UI visualizes the Attestor signing the proof.
3. **Verification**: System verifies the signature.
4. **Clearing**: TigerBeetle accepts the transfer.
