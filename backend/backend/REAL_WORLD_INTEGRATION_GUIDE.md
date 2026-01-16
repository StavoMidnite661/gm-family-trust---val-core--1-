# Real-World Anchor Integration Guide

> **Complete end-to-end guide for connecting VAL Core to real-world anchor providers**

---

## 📋 Overview

This guide covers the complete real-world integration workflow:

1. ✅ **Environment Setup** - Configure real API credentials
2. ✅ **Adapter Integration** - Connect to Tango Card, Square, etc.
3. ✅ **Webhook Infrastructure** - Handle real-time notifications
4. ✅ **Compliance Layer** - KYC, AML, and rate limiting
5. ✅ **Testing** - Sandbox validation before production

---

## 🚀 Quick Start

### 1. Configure Environment

```bash
# Copy example to .env
cp .env.example .env

# Edit .env with real credentials
nano .env  # or your preferred editor
```

### 2. Install Additional Dependencies

```bash
cd gm-family-trust---val-core--1-
npm install express cors
```

### 3. Start Services

```bash
# Terminal 1: Start Postgres
npm run infra:up

# Terminal 2: Start TigerBeetle
./tigerbeetle.exe start --addresses=0.0.0.0:3000 tigerbeetle_data/0_0.tigerbeetle

# Terminal 3: Start Backend (VAL Core)
npm run server

# Terminal 4: Start Webhook Service
bun run dev  # in mini-services/webhooks

# Terminal 5: Start Frontend
npm run dev
```

---

## 🔐 Real-World Provider Setup

### Tango Card Setup

1. **Create Account**
   - Go to https://www.tangocard.com
   - Sign up for a business account
   - Complete KYC and business verification

2. **Get Credentials**
   - Platform Name (provided after approval)
   - Platform Key (in dashboard)
   - Account ID (in dashboard)

3. **Configure UTIDs**
   - Request UTIDs for specific brands:
     - `U123456` for Instacart
     - `U654321` for Amazon
     - `U789012` for Walmart
   - Add to your Tango Card account

4. **Update Environment**
   ```bash
   TANGO_PLATFORM_NAME=your_platform_name
   TANGO_PLATFORM_KEY=your_platform_key
   TANGO_ACCOUNT_ID=your_account_id
   INSTACART_UTID=U123456
   AMAZON_UTID=U654321
   WALMART_UTID=U789012
   USE_SANDBOX=false  # Set to true for testing
   ```

### Square Gift Cards Setup

1. **Create Developer Account**
   - Go to https://developer.squareup.com
   - Create an account
   - Get API access token

2. **Create Gift Card Catalog**
   - Use Square Dashboard to create gift card templates
   - Set up automatic fulfillment

3. **Update Environment**
   ```bash
   SQUARE_ACCESS_TOKEN=your_square_access_token
   SQUARE_LOCATION_ID=your_location_id
   SQUARE_ENVIRONMENT=sandbox  # or 'production'
   ```

---

## 🔄 End-to-End Workflow

### Production Flow

```
User Request
    ↓
1. Client Signs Intent (ethers.js)
    ↓
2. POST /api/spend (with signature)
    ↓
3. Backend Verifies Signature
    ↓
4. Compliance Check
    - KYC status
    - AML screening
    - Rate limits
    ↓
5. TigerBeetle Clearing
    - Debit user balance
    - Credit anchor obligation
    ↓
6. Adapter Fulfillment
    - Call Tango Card API
    - Issue gift card
    ↓
7. Narrative Mirror Recording
    - Log authorization
    - Log fulfillment
    ↓
8. Webhook Notification
    - Tango Card notifies completion
    - Update transaction status
    ↓
9. User Receives Gift Card
    - Email with code
    - Redeem in app
```

---

## 🛡️ Security & Compliance

### Attestation Verification

All transactions must include a cryptographic attestation:

```typescript
const messageToSign = {
  userId: intent.userId,
  amount: intent.amount,
  merchant: intent.merchant,
  timestamp: intent.timestamp
};

const signature = await wallet.signMessage(JSON.stringify(messageToSign));

// Backend verifies:
const recoveredAddress = ethers.verifyMessage(messageToSign, signature);
if (recoveredAddress !== KNOWN_ADMIN) {
  throw new Error('Unauthorized');
}
```

### Rate Limits

Default limits (configurable in `.env`):

| Limit | Default | Description |
|--------|----------|-------------|
| Daily Transactions | 100 | Max transactions per user per day |
| Daily Value | $50,000 | Max USD value per user per day |
| Hourly Transactions | 20 | Max transactions per user per hour |

### AML Screening

Automatic screening triggers:

1. **Suspicious Flags** - Manual review required
2. **Unusual Amounts** - > 3x user average
3. **Rapid High-Value** - 3+ transactions > $1000 in 24h
4. **Geography Anomalies** - Different from usual location

### Blocking

Users can be blocked for security reasons:

```typescript
complianceService.blockUser(
  'userId',
  'Suspicious activity detected',
  'HIGH'  // or 'BLOCKED'
);
```

---

## 🧪 Testing Workflow

### 1. Sandbox Testing

```bash
# Enable sandbox mode in .env
USE_SANDBOX=true
TANGO_PLATFORM_NAME=SOVR_SANDBOX
TANGO_PLATFORM_KEY=sandbox_key

# Restart services
npm run server
```

### 2. Test Transactions

Use the frontend to test:

```bash
# Test small amounts first
$10.00
$25.00

# Test larger amounts
$100.00
$500.00

# Verify in dashboard:
# - TigerBeetle account balances
# - Narrative Mirror logs
# - Adapter transaction history
```

### 3. Monitor Webhooks

```bash
# Check webhook logs
curl http://localhost:3002/health

# View received webhooks in logs
# All webhooks logged with [WebhookService] prefix
```

---

## 📊 Monitoring & Observability

### Key Metrics

Monitor these metrics in production:

| Metric | Target | Alert Threshold |
|--------|---------|-----------------|
| Adapter Success Rate | > 99% | < 98% |
| Average Fulfillment Time | < 60s | > 120s |
| TigerBeetle Latency | < 100ms | > 500ms |
| Compliance Rejection Rate | < 5% | > 10% |
| Webhook Processing Time | < 1s | > 5s |

### Log Analysis

```bash
# View recent adapter errors
grep "ERROR" val/adapters/*.ts

# View webhook failures
grep "WebhookService" server_out.log | grep -i error

# View compliance blocks
grep "BLOCKED" val/core/compliance-service.ts
```

---

## 🚨 Troubleshooting

### Tango Card API Errors

| Error | Meaning | Solution |
|--------|----------|----------|
| `AUTH_FAILED` | Invalid credentials | Check `TANGO_PLATFORM_KEY` and `TANGO_PLATFORM_NAME` |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry, reduce velocity |
| `INSUFFICIENT_FUNDS` | Provider balance low | Contact Tango Card support |
| `INVALID_UTID` | Brand not available | Verify UTID is correct |

### Adapter Failures

**Critical Rule**: If fulfillment fails, DO NOT retry automatically.

Per SOVR doctrine, the anchor halts to protect ledger credibility. Manual intervention required.

### Webhook Not Received

1. Check firewall allows inbound connections on webhook port
2. Verify webhook URL is accessible from internet
3. Check webhook signature verification isn't blocking legitimate requests
4. Verify provider is sending to correct URL

---

## 📦 Production Deployment Checklist

Before going live:

- [ ] Real API credentials configured (not sandbox)
- [ ] Webhook URL is publicly accessible
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Firewall rules configured
- [ ] Rate limits tested and tuned
- [ ] KYC/AML screening enabled
- [ ] Monitoring and alerting set up
- [ ] Backup and recovery procedures documented
- [ ] Team trained on incident response
- [ ] Legal review completed
- [ ] Compliance audit performed

---

## 🔗 Integration Status

| Component | Status | Notes |
|-----------|--------|-------|
| TigerBeetle | ✅ Operational | Native binary, port 3000 |
| Narrative Mirror | ✅ Operational | Postgres, port 5433 |
| Tango Card API | ✅ Real Client | With retry logic & error handling |
| Instacart Adapter | ✅ Real Integration | Uses real Tango Card API |
| Webhook Service | ✅ Implemented | Port 3002, signature verification |
| Compliance Layer | ✅ Implemented | KYC, AML, rate limits |
| Square Adapter | ⚠️  Mock Only | Real implementation pending |

---

## 📚 Next Steps

1. **Square Integration** - Implement real Square Gift Cards API client
2. **Additional Anchors** - Add support for utilities, fuel, mobile, housing, medical
3. **Advanced AML** - Integrate with external AML screening providers
4. **Analytics Dashboard** - Build real-time monitoring dashboard
5. **Automated Reconciliation** - Daily reconciliation with adapter providers

---

## 📞 Support

For integration issues:

1. Check logs: `server_out.log` and `server_err.log`
2. Review adapter specifications: `INSTACART_ADAPTER_SPEC.md`, `ANCHOR_CONTRACT_SPEC.md`
3. Consult SOVR doctrine: `SOVR_CANONICAL_SPEC_V2.md`
4. Check worklog: `worklog.md`

---

*Real-World Anchor Integration Guide v1.0 - January 2026*
