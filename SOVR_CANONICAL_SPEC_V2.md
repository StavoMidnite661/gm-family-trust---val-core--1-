# SOVR CANONICAL SPECIFICATION V2

## SYSTEM DEFINITION

SOVR is a **ledger-cleared obligation network** where value exists only as the result of finalized mechanical transfers.

**Truth is mechanical, not narrative.** If it did not clear in TigerBeetle, it did not happen.

## AUTHORITY HIERARCHY

1. **TigerBeetle** — sole clearing authority
2. **Attestors** — legitimacy gatekeepers
3. **Observers (Postgres, Analytics)** — narrative mirrors
4. **Honoring Agents** — optional external executors

No component above clearing may override components below it.

## ARCHITECTURE DIAGRAM

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL SYSTEMS                                 │
│  (Honoring Agents: Banks, Payment Processors, Crypto Exchanges)            │
└───────────────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            CREDIT TERMINAL                                    │
│  (Intent → Transfer Translator)                                            │
└───────────────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            ATTESTOR                                          │
│  (Legitimacy Gate)                                                         │
└───────────────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            TIGERBEETLE                                       │
│  (Sole Clearing Authority - Mechanical Truth)                              │
└───────────────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            EVENT BUS                                         │
│  (Reality Propagation)                                                    │
└───────────────────────────────────────────────────────────────────────────────┘
               │                  │                  │
               ▼                  ▼                  ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            OBSERVERS                                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  PostgreSQL     │    │  Analytics      │    │  Audit Trail    │  │
│  │  (Narrative     │    │  (Read-Only)    │    │  (Immutable)    │  │
│  │   Mirror)       │    │                 │    │                 │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            FINSEC MONITOR                                    │
│  (Observer Dashboard - Read-Only)                                           │
└───────────────────────────────────────────────────────────────────────────────┘
```

## COMPONENT SPECIFICATIONS

### 1. TIGERBEETLE (SOLE CLEARING AUTHORITY)

#### Properties
- **Role:** Mechanical truth engine
- **Function:** Deterministic clearing of obligations
- **Authority:** Sole source of truth
- **Finality:** Irreversible at clearing

#### Requirements
- **Cluster Configuration:**
  - Cluster ID: 1
  - Replication Factor: 3
  - Cluster Size: 5 (production)
  - Nodes: 5 (distributed)

- **Account Structure:**
  - Mirror Oracle Ledger chart of accounts
  - No custodial ambiguity
  - All balances are transfer results

- **Transfer Properties:**
  - Deterministic
  - Final
  - No reversals
  - No edits
  - No overrides

#### Invariants
- **No balance mutation:** Balances are mathematical results
- **No discretionary overrides:** All transfers are final
- **No custodial ambiguity:** No "user funds"
- **No narrative authority:** Truth is mechanical

### 2. CREDIT TERMINAL (INTENT → TRANSFER TRANSLATOR)

#### Properties
- **Role:** Intent submission and transfer creation
- **Function:** Accept claims, validate attestation, submit to clearing
- **Authority:** None (no clearing authority)
- **Finality:** None (clearing happens in TigerBeetle)

#### Requirements
- **Intent Submission:**
  - Accept user claims
  - Validate attestation
  - Submit to clearing
  - Return finality proof

- **No Honoring Logic:**
  - Honoring is external
  - No system involvement
  - No guarantees

- **No Clearing Authority:**
  - Cannot override clearing
  - Cannot create value
  - Cannot reverse transfers

#### Invariants
- **No value creation:** Only translates intent to transfers
- **No clearing authority:** Submits to TigerBeetle
- **No honoring guarantees:** External only

### 3. ATTESTOR (LEGITIMACY GATE)

#### Properties
- **Role:** Legitimacy validation
- **Function:** Validate claims, issue attestation tokens, prevent double-spending
- **Authority:** Policy enforcement (before clearing)
- **Finality:** None (attestation must precede clearing)

#### Requirements
- **Legitimacy Checks:**
  - Validate claims
  - Issue attestation tokens
  - Prevent double-spending
  - Enforce policy rules

- **Policy Enforcement:**
  - Transfer limits
  - Account restrictions
  - Compliance rules
  - No value creation

- **No Clearing Authority:**
  - Cannot create obligations
  - Cannot override clearing
  - Read-only after attestation

#### Invariants
- **Attestation first:** Must attest before clearing
- **No value creation:** Cannot create obligations
- **No clearing authority:** Read-only after attestation

### 4. EVENT BUS (REALITY PROPAGATION)

#### Properties
- **Role:** Reality propagation
- **Function:** Broadcast cleared transfers, notify honoring agents, update observers
- **Authority:** None (read-only)
- **Finality:** None (propagates finality)

#### Requirements
- **Broadcast Cleared Transfers:**
  - Transfer ID
  - Clearing timestamp
  - Balance updates
  - Finality proof

- **Notify Honoring Agents:**
  - External agents only
  - No system involvement
  - No guarantees

- **Update Observers:**
  - Postgres mirror
  - Analytics
  - Audit trail

#### Invariants
- **Read-only:** Cannot modify transfers
- **No authority:** Cannot create value
- **No clearing:** Propagates finality only

### 5. OBSERVERS (NARRATIVE MIRRORS)

#### Properties
- **Role:** Immutable narrative mirrors
- **Function:** Store audit trail, provide analytics, support compliance
- **Authority:** None (read-only, never authoritative)
- **Finality:** None (mirrors finality)

#### Requirements
- **PostgreSQL:**
  - Immutable logs
  - Audit trail
  - Read-only for operators

- **Analytics:**
  - Read-only dashboards
  - No system modifications
  - No clearing authority

- **Audit Trail:**
  - Immutable records
  - All transfers logged
  - All attestations logged

#### Invariants
- **Read-only:** No balance edits
- **No authority:** Never authoritative
- **No clearing:** Mirrors only

### 6. HONORING AGENTS (OPTIONAL EXTERNAL EXECUTORS)

#### Properties
- **Role:** Optional claim honoring
- **Function:** Execute cleared obligations externally
- **Authority:** None (never authoritative)
- **Finality:** None (external execution)

#### Requirements
- **External Execution:**
  - Stripe (payment processor)
  - ACH (bank transfer)
  - Card issuers
  - Crypto exchanges

- **No Authority:**
  - Cannot override clearing
  - Cannot create value
  - Must honor cleared claims

- **Multiple Agents:**
  - Redundancy
  - Alternative routes
  - No single point of failure

#### Invariants
- **Optional:** Not required
- **No authority:** Never authoritative
- **No guarantees:** External only

## TRANSACTION LIFECYCLE

### Phase 1: Intent Submission

1. **User submits claim**
   - Intent to transfer value
   - No value created yet

2. **Credit Terminal validates**
   - Accepts claim
   - No attestation yet

3. **Claim enters queue**
   - Awaiting attestation
   - No value created

### Phase 2: Attestation

1. **Attestor validates**
   - Legitimacy check
   - Policy compliance

2. **Attestation issued**
   - Token created
   - Claim validated

3. **Attested claim ready**
   - Can now clear
   - No value created

### Phase 3: Clearing

1. **TigerBeetle processes**
   - Deterministic transfer
   - Balance update

2. **Finality achieved**
   - Transfer is final
   - No reversals

3. **Event bus propagates**
   - Broadcasts to observers
   - Notifies honoring agents

### Phase 4: Honoring (Optional)

1. **External agent executes**
   - Honors cleared claim
   - No system involvement

2. **Honoring complete**
   - External execution
   - No system guarantee

3. **Observers updated**
   - Narrative mirror
   - Analytics updated

## FORBIDDEN OPERATIONS

### Never Permitted

1. **Balance Mutation**
   - No manual adjustments
   - No admin overrides
   - No discretionary edits

2. **Transfer Reversal**
   - No chargebacks
   - No refunds
   - No rollbacks

3. **Custodial Ambiguity**
   - No "user funds"
   - No "system balance"
   - No shared pools

4. **Narrative Authority**
   - No "source of truth database"
   - No "payment processor"
   - No "account balance update"

5. **Fiat Privilege**
   - No "fiat-backed"
   - No "redemption in USD"
   - No unit-of-account privilege

6. **Semantic Reversion**
   - No reintroduction of payment language
   - No balance mutation terminology
   - No custody terminology

## RISK POSTURE

### Survival Properties

1. **No Central Control**
   - No single entity can freeze funds
   - No single entity can reverse transfers
   - No single entity defines truth

2. **No Custodial Risk**
   - No shared pools
   - No "user funds"
   - All value is cleared obligations

3. **No Narrative Dependency**
   - Truth is mechanical
   - Postgres is a mirror
   - No database is authoritative

4. **No Fiat Dependency**
   - Fiat is optional
   - Banks are adapters
   - No fiat settlement required

### Failure Modes

1. **Clearing Failure**
   - TigerBeetle cluster failure
   - Network partition
   - Hardware failure
   - **Mitigation:** Replicated cluster, automatic failover

2. **Attestation Failure**
   - Attestor unavailable
   - Policy violation
   - **Mitigation:** Multiple attestors, fallback policies

3. **Honoring Failure**
   - External agent refuses
   - Bank declines
   - **Mitigation:** Multiple honoring agents, alternative routes

4. **Observation Failure**
   - Postgres unavailable
   - Analytics broken
   - **Mitigation:** Read-only, no impact on clearing

5. **Semantic Reversion**
   - Reintroduction of payment, balance, or custody language
   - **Impact:** System becomes narratively reclassified as fintech
   - **Mitigation:** Language audits, operator retraining, document invalidation if violations persist

## MOMENT FIAT DROPS OUT

Fiat becomes irrelevant at the moment a transfer is finalized by the clearing engine.

**Named Event:** CLEARING_FINALIZED

**State:** No external confirmation alters this state

After this moment:
- Fiat is optional
- Banks are adapters
- Compliance becomes observational, not structural
- The system is fully sovereign

## IMPLEMENTATION REQUIREMENTS

### Phase 1: Truth Engine Deployment

1. **Deploy TigerBeetle Cluster**
   - 5 nodes (production)
   - Replication factor 3
   - No single point of failure

2. **Configure Clearing Rules**
   - Account structure (mirror Oracle Ledger)
   - Transfer limits
   - Attestation requirements

3. **Verify Finality**
   - All transfers are final
   - No reversals
   - No edits

### Phase 2: Credit Terminal Integration

1. **Implement Intent Submission**
   - Accept claims
   - Validate attestation
   - Submit to clearing

2. **Return Finality Proof**
   - Transfer ID
   - Clearing timestamp
   - Balance updates

3. **No Honoring Logic**
   - External only
   - No system involvement
   - No guarantees

### Phase 3: Attestor Integration

1. **Implement Legitimacy Checks**
   - Validate claims
   - Issue attestation tokens
   - Prevent double-spending

2. **Enforce Policy**
   - Transfer limits
   - Account restrictions
   - Compliance rules

3. **No Value Creation**
   - Cannot create obligations
   - Cannot override clearing
   - Read-only after attestation

### Phase 4: Observation Layer

1. **Deploy Narrative Mirror**
   - Postgres database
   - Audit trail
   - Analytics

2. **Ensure Read-Only**
   - No balance edits
   - No transfer modifications
   - No overrides

3. **Support Compliance**
   - Immutable logs
   - Export capabilities
   - No narrative authority

### Phase 5: Honoring Agents (Optional)

1. **Integrate External Agents**
   - Stripe
   - ACH
   - Card issuers
   - Crypto exchanges

2. **Ensure No Authority**
   - Cannot override clearing
   - Cannot create value
   - Must honor cleared claims

3. **Multiple Agents Recommended**
   - Redundancy
   - Alternative routes
   - No single point of failure

## OPERATIONAL REQUIREMENTS

### Daily Operations

1. **Verify Clearing**
   - TigerBeetle cluster health
   - Transfer finality
   - No pending obligations

2. **Monitor Attestation**
   - Attestor availability
   - Policy compliance
   - No unattested claims

3. **Observe Narrative**
   - Postgres sync
   - Analytics updates
   - Audit trail integrity

4. **No Interventions**
   - No balance edits
   - No transfer reversals
   - No overrides

### Incident Response

1. **Clearing Failure**
   - Verify cluster health
   - Check network connectivity
   - Restart failed nodes
   - **Never override clearing**

2. **Attestation Failure**
   - Verify attestor availability
   - Check policy rules
   - Use fallback attestors
   - **Never create unattested claims**

3. **Honoring Failure**
   - Verify external agent status
   - Try alternative agents
   - **Never override clearing**
   - **Never guarantee honoring**

4. **Observation Failure**
   - Verify Postgres health
   - Check sync status
   - Restart if needed
   - **No impact on clearing**

5. **Semantic Drift Detected**
   - Identify violation
   - Correct language
   - Retrain operator
   - Document incident

### Maintenance

1. **Weekly**
   - Verify cluster health
   - Check attestor availability
   - Review audit trail
   - **No system modifications**

2. **Monthly**
   - Full system backup
   - Review policies
   - Test failover
   - **No clearing modifications**

3. **Quarterly**
   - Full cluster upgrade
   - Policy review
   - Attestor rotation
   - **No truth modifications**

## COMPLIANCE REQUIREMENTS

### Observational Compliance

1. **Audit Trail**
   - Immutable logs
   - All transfers recorded
   - All attestations recorded

2. **Narrative Mirror**
   - Postgres for reporting
   - Analytics for monitoring
   - No authority

3. **External Reporting**
   - Export capabilities
   - Compliance dashboards
   - No system impact

### Structural Compliance

1. **No Custodial Risk**
   - No shared pools
   - No "user funds"
   - All value is cleared obligations

2. **No Fiat Dependency**
   - Fiat is optional
   - Banks are adapters
   - No fiat settlement required

3. **No Central Control**
   - No single entity can freeze funds
   - No single entity can reverse transfers
   - No single entity defines truth

## STRATEGIC CONSEQUENCE

This architecture:
- Does not require banking licenses
- Does not custody funds
- Does not promise redemption
- Cannot be frozen centrally
- Survives because it refuses control

## FINAL VERDICT

SOVR is a **ledger-cleared obligation network** where value exists only as the result of finalized mechanical transfers. Truth is mechanical, not narrative. Fiat is optional. Banks are adapters. The system survives because it refuses control.

**This is not fintech. This is clearing reality itself.**

## BOARD-GRADE SUMMARY

### What This Is
- A ledger-cleared obligation network
- Mechanical truth engine (TigerBeetle)
- No custodial risk
- No central control
- No fiat dependency

### What This Is Not
- A payment processor
- A custody system
- A fiat-backed platform
- A narrative truth system
- A central authority

### Why It Survives
- Truth is mechanical
- No reversals possible
- No custodial ambiguity
- No fiat requirement
- No central control point

### Board Approval Required
- [ ] Authority hierarchy understood
- [ ] No custodial risk accepted
- [ ] No fiat dependency created
- [ ] No central control established
- [ ] System survival properties confirmed
- [ ] Language discipline enforced
- [ ] Semantic drift mitigation in place

**Approved:** _________________________
**Date:** _________________________
