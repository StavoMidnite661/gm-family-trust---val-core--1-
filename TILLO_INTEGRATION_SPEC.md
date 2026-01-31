# Specification: Tillo Integration (Real-World Settlement)

**Status:** Implementation Ready / Verified  
**Namespace:** `val/adapters/tillo_adapter.ts`  
**Purpose:** Bridge Sovereign Credit (Ledger) to Real-World Goods (Gift Cards/Prepaid Visas).

---

## 1. Architectural Overview

The Tillo integration serves as the primary **Settlement Adapter**. It transforms internal obligation clearances into external value issuance. The workflow ensures that for every unit of value issued via Tillo, a corresponding debit has occurred in the TigerBeetle ledger.

## 2. Data Flow (Mechanical Path)

### Phase A: Validation & Prep
1. **Trigger:** `SpendEngine.finalize()` identifies a Tillo-bound event.
2. **Adapter Entry:** `TilloAdapter.issueValue(request)` is invoked.
3. **KYC Check:** If `brand === 'reward-pass'`, the adapter validates the presence of:
   - `firstName`
   - `lastName`
   - `email`
   - *Failure result:* `MerchantAdapterError (MISSING_KYC_DATA)`

### Phase B: Cryptographic Authorization
To prevent spoofing or tampering, every request requires an HMAC-SHA256 signature.

**Signature String Construction:**
- **POST (Issuance):** `APIKey-POST-digital-issue-{requestId}-{brand}-{currency}-{amount}-{timestamp}`
- **GET (Status):** `APIKey-GET-digital-issue-{reference}-none-none-0-{timestamp}`

**Hashing:**
```javascript
crypto.createHmac('sha256', apiSecret).update(signatureString).digest('hex')
```

### Phase C: API Execution
The adapter communicates with the Tillo V2 API.

| Requirement | Value |
|--- |--- |
| **Base URL (Sandbox)** | `https://sandbox.tillo.dev/api/v2` |
| **Base URL (Prod)** | `https://hub.tillo.tech/api/v2` |
| **Endpoint** | `/digital/issue` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |

### Phase D: Resolution
1. **Success (Code 000):** 
   - Extract `data.url` (Redemption link).
   - Extract `data.reference` (Tillo internal ID).
   - Map to `ValueResponse` with `status: success`.
2. **Failure (Non-000):**
   - Log specific Tillo error code (e.g., `005` for Insufficient Float).
   - Throw `MerchantAdapterError`.

---

## 3. API Reference

### `POST /digital/issue`
**Payload Structure:**
```json
{
  "client_request_id": "UUID-v4",
  "brand": "brand-slug",
  "face_value": {
    "amount": 50.00,
    "currency": "USD"
  },
  "delivery_method": "url",
  "fulfilment_by": "partner",
  "personalisation": {
    "recipient": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    }
  }
}
```

### `GET /digital/issue/{reference}`
Used for status reconciliation if the initial POST result is ambiguous (e.g., timeout).

---

## 4. Error Handling Matrix

| Error Code | Meaning | System Action |
|--- |--- |--- |
| `000` | Success | Finalize Ledger Transfer |
| `005` | Insufficient Float | **CRITICAL:** Halt Issuance / Alert Admin |
| `006` | Brand Unavailable | Notify User / Suggest Alternative |
| `012` | Invalid Signature | **DEV ERROR:** Check API Keys / Time Sync |
| `TIMEOUT` | Network Issue | Retry with same `client_request_id` (Idempotent) |

---

## 5. Security & Idempotency

1. **Client Request ID:** The `client_request_id` MUST be persistent across retries. Tillo uses this field to ensure that if the same ID is sent twice, a second card is NOT issued, but the original reward details are returned.
2. **Signature Expiry:** Tillo enforces a timestamp check. Ensure server clocks are synchronized via NTP.
3. **Secret Storage:** `TILLO_API_SECRET` must never be logged or exposed to the frontend.

---

## 6. Testing Requirements

- **Signature Validation:** Run `val/tests/tillo_test.ts` to verify HMAC logic.
- **KYC Validation:** Assert that Reward Pass issuance fails if name/email is null.
- **Idempotency Test:** Execute the same request ID twice; verify the second response matches the first without error.
