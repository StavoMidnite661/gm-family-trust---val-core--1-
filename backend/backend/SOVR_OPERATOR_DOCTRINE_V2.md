# SOVR OPERATOR DOCTRINE V2

## RULE ZERO: TRUTH IS MECHANICAL

**If it did not clear in TigerBeetle, it did not happen.**

All operator decisions are based on finalized transfers. There are no exceptions.

## RULE ONE: NO PAYMENT PROCESSING

The system clears obligations. Honoring happens externally. The system makes no guarantees.

## RULE TWO: NO BALANCE EDITS

Balances are mathematical results of finalized transfers. They are never manually adjusted. They are never overridden.

## RULE THREE: NO OVERRIDES

Admins observe. They do not correct reality. Failures require new transfers, not edits.

## RULE FOUR: A CLEARED OBLIGATION DOES NOT IMPLY, GUARANTEE, OR COMPEL HONORING

Clearing is finality, not execution. Honoring is external and optional. No system guarantee required.

## RULE FIVE: ATTESTATION FIRST

Legitimacy is proven before clearing. Unattested claims are void. There is no post-facto validation.

## RULE SIX: LEGACY RAILS ARE GUESTS

External agents may honor claims. They never define them. They have no privileged access.

## RULE SEVEN: FIAT IS OPTIONAL

No unit-of-account is privileged. All units are translations. Fiat is never required.

## RULE EIGHT: NO REVERSALS

If a system requires reversal, it is not sovereign-safe. All failures are handled by new transfers. History is never edited.

## OPERATOR COMMANDS

### COMMAND: VERIFY CLEARING

```bash
# Check TigerBeetle cluster health
curl http://localhost:3000/status

# Verify transfer finality
tb-cli get-transfer <transfer-id>

# Confirm no pending obligations
tb-cli list-pending
```

### COMMAND: CHECK ATTESTATION

```bash
# Verify attestor availability
attestor-cli health

# Check policy compliance
attestor-cli validate <claim-id>

# Ensure no unattested claims exist
attestor-cli list-unattested
```

### COMMAND: OBSERVE NARRATIVE

```bash
# Verify Postgres sync
psql -c "SELECT COUNT(*) FROM journal_entries WHERE status = 'Posted';"

# Check analytics
analytics-cli dashboard

# Review audit trail
audit-cli tail
```

### COMMAND: HONORING STATUS

```bash
# Check external agent status
honoring-cli status

# Verify cleared claims
honoring-cli list-cleared

# No system involvement in honoring
```

## FORBIDDEN COMMANDS

### ❌ NEVER RUN

```bash
# Manual balance adjustment
UPDATE account_balances SET current_balance = X WHERE account_id = Y;

# Transfer reversal
REVERSE TRANSFER <transfer-id>;

# Admin override
FORCE_SETTLE <transfer-id>;

# Fiat privilege
SET DEFAULT_CURRENCY 'USD';

# Narrative authority
UPDATE journal_entries SET status = 'Posted' WHERE id = <id>;

# Semantic reversion
function processPayment(amount: number) { ... }
```

## INCIDENT RESPONSE

### INCIDENT: CLEARING FAILURE

1. **Verify cluster health**
   ```bash
   curl http://localhost:3000/status
   ```

2. **Check network connectivity**
   ```bash
   tb-cli ping-all
   ```

3. **Restart failed nodes**
   ```bash
   systemctl restart tigerbeetle-nodeX
   ```

4. **Never override clearing**
   - No manual settlements
   - No force operations
   - Let cluster recover

### INCIDENT: ATTESTATION FAILURE

1. **Verify attestor availability**
   ```bash
   attestor-cli health
   ```

2. **Check policy rules**
   ```bash
   attestor-cli list-policies
   ```

3. **Use fallback attestors**
   ```bash
   attestor-cli switch-fallback
   ```

4. **Never create unattested claims**
   - No bypass operations
   - No manual approvals
   - Let system recover

### INCIDENT: HONORING FAILURE

1. **Verify external agent status**
   ```bash
   honoring-cli status
   ```

2. **Try alternative agents**
   ```bash
   honoring-cli switch-agent <agent-id>
   ```

3. **Never override clearing**
   - No forced honoring
   - No system guarantees
   - Let external systems recover

4. **Never guarantee honoring**
   - No promises to users
   - No SLA commitments
   - Honoring is external

### INCIDENT: OBSERVATION FAILURE

1. **Verify Postgres health**
   ```bash
   psql -c "SELECT 1;"
   ```

2. **Check sync status**
   ```bash
   tb-cli sync-status
   ```

3. **Restart if needed**
   ```bash
   systemctl restart postgres
   ```

4. **No impact on clearing**
   - Observation is read-only
   - No system modifications
   - Clearing continues normally

### INCIDENT: SEMANTIC DRIFT DETECTED

1. **Identify violation**
   - Locate forbidden language
   - Document exact wording

2. **Correct immediately**
   - Replace with allowed terms
   - Update all references

3. **Retrain operator**
   - Review blacklist
   - Conduct training session
   - Document incident

4. **Prevent recurrence**
   - Add to language audit
   - Update documentation
   - Enforce discipline

## DAILY CHECKLIST

### MORNING (08:00 UTC)

- [ ] Verify TigerBeetle cluster health
- [ ] Check attestor availability
- [ ] Review pending obligations
- [ ] Verify Postgres sync
- [ ] Check audit trail
- [ ] No manual interventions

### EVENING (20:00 UTC)

- [ ] Verify all transfers cleared
- [ ] Check unattested claims (should be 0)
- [ ] Review honoring agent status
- [ ] Verify backup completion
- [ ] No system modifications

## WEEKLY CHECKLIST

### MONDAY (08:00 UTC)

- [ ] Full cluster health check
- [ ] Attestor policy review
- [ ] Backup verification
- [ ] Audit trail review
- [ ] No system modifications

### FRIDAY (20:00 UTC)

- [ ] End-of-week sync
- [ ] Honoring agent review
- [ ] Incident log review
- [ ] Documentation update
- [ ] No system modifications

## QUARTERLY CHECKLIST

### FIRST DAY OF QUARTER

- [ ] Full cluster upgrade
- [ ] Attestor rotation
- [ ] Policy review
- [ ] Security audit
- [ ] No truth modifications

## EMERGENCY PROCEDURES

### EMERGENCY: CLUSTER QUORUM LOST

1. **Do not panic**
2. **Check node status**
   ```bash
   tb-cli node-status
   ```
3. **Restart failed nodes**
   ```bash
   systemctl restart tigerbeetle-nodeX
   ```
4. **Wait for recovery**
5. **Never override clearing**

### EMERGENCY: ATTESTOR COMPROMISED

1. **Isolate immediately**
   ```bash
   attestor-cli isolate <attestor-id>
   ```
2. **Switch to fallback**
   ```bash
   attestor-cli switch-fallback
   ```
3. **Investigate**
4. **Rotate credentials**
5. **Never create unattested claims**

### EMERGENCY: UNAUTHORIZED ACCESS

1. **Revoke all sessions**
   ```bash
   auth-cli revoke-all
   ```
2. **Rotate all keys**
   ```bash
   key-cli rotate-all
   ```
3. **Audit all transfers**
   ```bash
   audit-cli review <timeframe>
   ```
4. **No balance modifications**
5. **Let clearing continue**

### EMERGENCY: SEMANTIC REVERSION DETECTED

1. **Freeze all changes**
   - Stop all code merges
   - Halt documentation updates
   - Pause training sessions

2. **Identify source**
   - Locate violation origin
   - Document all instances
   - Trace propagation

3. **Correct immediately**
   - Replace all forbidden terms
   - Update all documents
   - Retrain all operators

4. **Prevent recurrence**
   - Implement language audits
   - Enforce code reviews
   - Update blacklist
   - Document lessons learned

## OPERATOR TRAINING

### TRAINING: CLEARING REALITY

**Lesson:** Truth is mechanical, not narrative

**Exercise:**
1. Submit a transfer
2. Verify it cleared in TigerBeetle
3. Confirm Postgres mirror updated
4. Understand: Postgres is read-only

**Test:**
- Can you manually edit a balance? (No)
- Can you reverse a transfer? (No)
- Can you override clearing? (No)

### TRAINING: ATTESTATION DISCIPLINE

**Lesson:** Legitimacy precedes value

**Exercise:**
1. Submit an unattested claim
2. Verify it is rejected
3. Add attestation
4. Verify it clears

**Test:**
- Can you create value without attestation? (No)
- Can you attest after clearing? (No)
- Can you override attestation? (No)

### TRAINING: HONORING BOUNDARIES

**Lesson:** Honoring is external, not system function

**Exercise:**
1. Clear a transfer
2. Verify no honoring guarantee
3. Observe external agent honor (or not)
4. Understand: System is indifferent

**Test:**
- Does the system guarantee honoring? (No)
- Can you force honoring? (No)
- Can you override clearing for honoring? (No)

### TRAINING: LANGUAGE DISCIPLINE

**Lesson:** Language discipline = system survival

**Exercise:**
1. Identify forbidden terms in sample code
2. Replace with allowed terms
3. Document corrections
4. Understand consequences of violations

**Test:**
- Can you use "payment" in code? (No)
- Can you use "balance update"? (No)
- Can you use "custody"? (No)

## OPERATOR MANTRAS

### MANTRA ONE
"If it did not clear in TigerBeetle, it did not happen."

### MANTRA TWO
"Balances are mathematical results. They are never edited."

### MANTRA THREE
"Admins observe. They do not correct reality."

### MANTRA FOUR
"A cleared obligation does not imply, guarantee, or compel honoring."

### MANTRA FIVE
"Legitimacy is proven before clearing. Unattested claims are void."

### MANTRA SIX
"External agents may honor claims. They never define them."

### MANTRA SEVEN
"Fiat is optional. No unit-of-account is privileged."

### MANTRA EIGHT
"If a system requires reversal, it is not sovereign-safe."

### MANTRA NINE
"Language discipline = system survival."

## FINAL VERDICT

Operators who violate doctrine are not "mistaken" — they are **dangerous**.

**This is not fintech. This is clearing reality itself.**
