
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { VALSystem } from './index';
import { ethers } from 'ethers';
import { CreditEvent, CreditEventType } from './events/types';
import { NARRATIVE_ACCOUNTS } from './shared/narrative-mirror-bridge';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// process.env.POSTGRES_URL is used from docker-compose or .env.local

const app = express();
const PORT = process.env.PORT || 3001;

// BigInt JSON serialization helper
function serializeBigInts(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(serializeBigInts);
    if (typeof obj === 'object') {
        const result: any = {};
        for (const key of Object.keys(obj)) {
            result[key] = serializeBigInts(obj[key]);
        }
        return result;
    }
    return obj;
}

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static frontend files from 'dist' folder
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Initialize VAL System
// In a real scenario, these keys should be securely managed
const ATTESTOR_PRIVATE_KEY = process.env.ATTESTOR_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

console.log('[VAL] Initializing Sovereign Stack...');
const valSystem = new VALSystem(
    ATTESTOR_PRIVATE_KEY,
    provider,
    {
        square: {
            apiKey: process.env.SQUARE_API_KEY || 'mock_key',
            locationId: process.env.SQUARE_LOCATION_ID || 'mock_loc'
        },
        tango: {
            platformName: process.env.TANGO_PLATFORM_NAME || 'mock_platform',
            platformKey: process.env.TANGO_PLATFORM_KEY || 'mock_key',
            sandbox: process.env.TANGO_SANDBOX === 'false' ? false : true
        },
        instacart: {
            platformName: process.env.TANGO_PLATFORM_NAME || 'mock_platform',
            platformKey: process.env.TANGO_PLATFORM_KEY || 'mock_key',
            utid: process.env.INSTACART_UTID || 'U123456',
            sandbox: process.env.TANGO_SANDBOX === 'false' ? false : true
        },
        arcus: {
            apiKey: process.env.ARCUS_API_KEY || 'mock_key',
            apiSecret: process.env.ARCUS_API_SECRET || 'mock_secret',
            sandbox: process.env.ARCUS_SANDBOX === 'false' ? false : true
        },
        moov: {
            apiKey: process.env.MOOV_API_KEY || 'mock_key',
            apiSecret: process.env.MOOV_API_SECRET || 'mock_secret',
            sandbox: process.env.MOOV_SANDBOX === 'false' ? false : true
        },
        tillo: {
            apiKey: process.env.TILLO_API_KEY || 'mock_key',
            apiSecret: process.env.TILLO_API_SECRET || 'mock_secret',
            sandbox: process.env.TILLO_SANDBOX === 'false' ? false : true
        }
    }
);

// Initialize Async Components
valSystem.initialize().then(() => {
    console.log('[VAL] TigerBeetle reference accounts initialized.');
}).catch(err => {
    console.error('[VAL] Failed to initialize TigerBeetle accounts:', err);
});

// Get Engine Instances
const spendEngine = valSystem.getSpendEngine();
const narrativeMirror = (spendEngine as any).narrativeMirror;
const tigerBeetle = (spendEngine as any).tigerBeetle || (spendEngine as any).tigerBeetleService;

// =============================================================================
// DEMO DATA SEEDER
// =============================================================================

async function seedDemoData() {
    console.log('[VAL] Seeding demo data...');
    
    const demoEntries = [
        {
            description: 'Genesis Attestation - Family Trust Establishment',
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.OBSERVED_TOKEN_REALIZATION, type: 'DEBIT' as const, amount: 25000_000000n },
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, type: 'CREDIT' as const, amount: 25000_000000n }
            ],
            source: 'ATTESTATION' as const,
            status: 'RECORDED' as const,
            userId: 'gm_trust_admin'
        },
        {
            description: 'Trust Reserve Allocation - ODFI Backstop',
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, type: 'DEBIT' as const, amount: 10000_000000n },
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI, type: 'CREDIT' as const, amount: 10000_000000n }
            ],
            source: 'CLEARING_OBSERVATION' as const,
            status: 'RECORDED' as const,
            userId: 'gm_trust_admin'
        },
        {
            description: 'Instacart Grocery - Weekly Essentials',
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, type: 'DEBIT' as const, amount: 127_450000n },
                { accountId: NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_GROCERY_OBLIGATION, type: 'CREDIT' as const, amount: 127_450000n }
            ],
            source: 'HONORING_RESULT' as const,
            status: 'RECORDED' as const,
            userId: 'gm_family_member_1'
        },
        {
            description: 'Amazon Gift Card - Household Supplies',
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, type: 'DEBIT' as const, amount: 75_000000n },
                { accountId: NARRATIVE_ACCOUNTS.OBSERVED_PURCHASE_EXPENSE, type: 'CREDIT' as const, amount: 75_000000n }
            ],
            source: 'HONORING_RESULT' as const,
            status: 'RECORDED' as const,
            userId: 'gm_family_member_2'
        },
        {
            description: 'Utility Obligation Authorization - Electric Bill',
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, type: 'DEBIT' as const, amount: 185_750000n },
                { accountId: NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_UTILITY_OBLIGATION, type: 'CREDIT' as const, amount: 185_750000n }
            ],
            source: 'HONORING_ATTEMPT' as const,
            status: 'RECORDED' as const,
            userId: 'gm_trust_admin'
        },
        {
            description: 'Fuel Card Issuance - Vehicle Gas',
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, type: 'DEBIT' as const, amount: 65_000000n },
                { accountId: NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_FUEL_OBLIGATION, type: 'CREDIT' as const, amount: 65_000000n }
            ],
            source: 'HONORING_RESULT' as const,
            status: 'RECORDED' as const,
            userId: 'gm_family_member_1'
        },
        {
            description: 'Walmart Purchase - Back to School',
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, type: 'DEBIT' as const, amount: 245_890000n },
                { accountId: NARRATIVE_ACCOUNTS.OBSERVED_PURCHASE_EXPENSE, type: 'CREDIT' as const, amount: 245_890000n }
            ],
            source: 'HONORING_RESULT' as const,
            status: 'RECORDED' as const,
            userId: 'gm_family_member_3'
        },
        {
            description: 'Mobile Top-Up Authorization - Family Plan',
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, type: 'DEBIT' as const, amount: 120_000000n },
                { accountId: NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_MOBILE_OBLIGATION, type: 'CREDIT' as const, amount: 120_000000n }
            ],
            source: 'HONORING_ATTEMPT' as const,
            status: 'RECORDED' as const,
            userId: 'gm_trust_admin'
        },
        {
            description: 'Attestation Verified - External Deposit',
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.OBSERVED_TOKEN_REALIZATION, type: 'DEBIT' as const, amount: 5000_000000n },
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, type: 'CREDIT' as const, amount: 5000_000000n }
            ],
            source: 'ATTESTATION' as const,
            status: 'RECORDED' as const,
            userId: 'gm_trust_admin'
        },
        {
            description: 'Medical Expense Authorization - Pharmacy',
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, type: 'DEBIT' as const, amount: 89_500000n },
                { accountId: NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_MEDICAL_OBLIGATION, type: 'CREDIT' as const, amount: 89_500000n }
            ],
            source: 'HONORING_RESULT' as const,
            status: 'RECORDED' as const,
            userId: 'gm_family_member_2'
        },
        {
            description: 'Instacart Grocery - Organic Produce',
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, type: 'DEBIT' as const, amount: 156_320000n },
                { accountId: NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_GROCERY_OBLIGATION, type: 'CREDIT' as const, amount: 156_320000n }
            ],
            source: 'HONORING_RESULT' as const,
            status: 'RECORDED' as const,
            userId: 'gm_family_member_1'
        },
        {
            description: 'Housing Expense - HOA Obligation',
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, type: 'DEBIT' as const, amount: 350_000000n },
                { accountId: NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_HOUSING_OBLIGATION, type: 'CREDIT' as const, amount: 350_000000n }
            ],
            source: 'HONORING_ATTEMPT' as const,
            status: 'RECORDED' as const,
            userId: 'gm_trust_admin'
        }
    ];

    // Seed each entry with a slight delay to create varying timestamps
    for (let i = 0; i < demoEntries.length; i++) {
        const entry = demoEntries[i];
        await narrativeMirror.recordNarrativeEntry({
            ...entry,
            eventId: `demo_evt_${Date.now()}_${i}`
        });
    }

    console.log(`[VAL] Demo data seeded: ${demoEntries.length} narrative entries`);
}

// Seed data only if explicitly requested (Production Safety)
// setTimeout(() => {
//     seedDemoData().catch(console.error);
// }, 1000);

console.log('[VAL] System Initialized (Zero-State). Waiting for Attestations.');

// =============================================================================
// API ENDPOINTS
// =============================================================================

/**
 * GET /api/status
 * Health check
 */
app.get('/api/status', (req, res) => {
    res.json({ status: 'active', system: 'VAL Core Authority', timestamp: new Date() });
});

/**
 * GET /api/balance/:userId
 * Get cleared credit balance
 */
app.get('/api/balance/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const balance = await spendEngine.getCreditBalance(userId);
        res.json(serializeBigInts(balance));
    } catch (error: any) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/tigerbeetle/balance/:accountId
 * Get TigerBeetle account balance (for debugging)
 */
app.get('/api/tigerbeetle/balance/:accountId', async (req, res) => {
    try {
        const accountId = BigInt(req.params.accountId);
        const balance = await tigerBeetle.getAccountBalance(accountId);
        res.json({
            accountId: req.params.accountId,
            available: balance.available.toString(),
            pending: balance.pending.toString()
        });
    } catch (error: any) {
        console.error('Error fetching TigerBeetle balance:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/spend
 * Authorize and Execute Spend
 */
app.post('/api/spend', async (req, res) => {
    try {
        const params = req.body;
        
        // [DOCTRINE] Mechanical Truth: We are attempting to clear an obligation
        console.log(`[API] Spend Request: ${params.amount} @ ${params.merchant}`);
        
        // [DOCTRINE] Cryptographic Integrity: Verify User Signature (Intent)
        if (!params.signature || !params.timestamp) {
            throw new Error('Missing cryptographic proof of intent (signature/timestamp)');
        }

        const messageToVerify = JSON.stringify({
            userId: params.userId,
            amount: params.amount,
            merchant: params.merchant,
            timestamp: params.timestamp
        });

        // Recover address from signature
        const recoveredAddress = ethers.verifyMessage(messageToVerify, params.signature);
        
        // Enforce Authorization (In production, check against an allowlist or Identity Registry)
        // For this Terminal Authority, we check against the known Admin key
        const KNOWN_ADMIN = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Corresponds to MOCK_ADMIN_KEY
        
        if (recoveredAddress !== KNOWN_ADMIN) {
            console.warn(`[AUTH] Signature mismatch. Recovered: ${recoveredAddress}`);
            throw new Error('Unauthorized: Invalid cryptographic signature');
        }

        // Prevent Replay Attacks (Simple timestamp check)
        const now = Date.now();
        if (Math.abs(now - params.timestamp) > 60000) { // 1 minute window
            throw new Error('Stale request: Timestamp out of bounds');
        }

        const result = await spendEngine.spendCredit(params);
        res.json(serializeBigInts(result));
    } catch (error: any) {
        console.error('Error processing obligation:', error);
        res.status(400).json({ 
            success: false, 
            error: error.message,
            doctrine_violation: true 
        });
    }
});

/**
 * GET /api/narrative
 * Get all narrative entries (Audit Log)
 */
app.get('/api/narrative', async (req, res) => {
    try {
        const entries = await narrativeMirror.getAllNarrativeEntries();
        res.json(serializeBigInts(entries));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/faucet
 * Real-World Attestation Oracle (Dev/Demo Ingress)
 * 
 * Generates a cryptographically signed attestation and clears it via TigerBeetle.
 * This represents "Real Value" entering the system from an external source.
 */
app.post('/api/faucet', async (req, res) => {
    try {
        const { amount, userId, txHash } = req.body;
        const depositAmount = BigInt(amount);

        console.log(`[FAUCET] Generating Real-World Attestation for ${userId}...`);

        // 1. Create Credit Event with External Proof
        const eventId = `tx_faucet_${Date.now()}`;
        const event: CreditEvent = {
            id: eventId,
            type: CreditEventType.VALUE_CREATED,
            userId: userId || 'user_demo',
            amount: depositAmount,
            timestamp: new Date(),
            metadata: { source: 'faucet', txHash },
            transactionHash: txHash
        };

        // 2. Authoritative Attestation (The "Real World" Proof)
        // We use the system's Attestor Engine to sign this event
        const attestationEngine = valSystem.getAttestationEngine();
        const attestation = await attestationEngine.attest(event);
        
        // 3. Mechanical Truth (TigerBeetle Clearing)
        // Move funds from REALIZATION (External World) -> STABLECOIN (User Vault)
        const transferId = BigInt(ethers.id(eventId)) & 0xffffffffffffffffffffffffffffffffn;
        
        const transferResult = await tigerBeetle.createTransfer(
            BigInt(NARRATIVE_ACCOUNTS.OBSERVED_TOKEN_REALIZATION),    // Source: External World
            BigInt(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN),   // Dest: User Vault
            depositAmount,
            999, // Ledger (SOVR)
            1, // Code (DEPOSIT = 1)
            transferId
        );

        if (!transferResult.success) {
            throw new Error(`Ledger rejected deposit. Code: ${transferResult.error}`);
        }

        // 4. Narrative Observation (Postgres)
        await narrativeMirror.recordAttestationVerified(
            eventId,
            depositAmount,
            userId || 'user_demo',
            attestation.attestor,
            txHash || 'tx_faucet_internal'
        );

        console.log(`[FAUCET] Success. ${depositAmount} units cleared to ${userId}.`);
        
        res.json({
            success: true,
            txId: eventId,
            attestation,
            newBalance: serializeBigInts(depositAmount) 
        });

    } catch (error: any) {
        console.error('[FAUCET] Error:', error);
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/adapters', (req, res) => {
    // Access private adapters map for display and map to serializable JSON
    const adapters = Array.from((spendEngine as any).adapters.values()).map((a: any) => ({
        type: a.type,
        enabled: a.enabled,
        name: a.constructor.name
    }));
    res.json(adapters);
});

app.get('/api/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const history = await narrativeMirror.getHistory(userId, limit);
        res.json(serializeBigInts(history));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 VAL Core Authority running on http://localhost:${PORT}`);
    console.log(`   - Terminals: Ready`);
    console.log(`   - TigerBeetle: Attempting Connection...`);
});


