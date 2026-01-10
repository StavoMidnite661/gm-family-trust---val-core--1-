
import express from 'express';
import cors from 'cors';
import { VALSystem } from './index';
import { ethers } from 'ethers';
import { CreditEventType } from './events/types';
import dotenv from 'dotenv';
import { NARRATIVE_ACCOUNTS } from './shared/narrative-mirror-bridge';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001; // 3001 to avoid TigerBeetle's default 3000

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

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
            sandbox: true
        }
    }
);

// Get Engine Instances
const spendEngine = valSystem.getSpendEngine();
const narrativeMirror = (spendEngine as any).narrativeMirror;
const tigerBeetle = (spendEngine as any).tigerBeetle || (spendEngine as any).tigerBeetleService;

console.log('[VAL] System Initialized.');

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
        res.json(balance);
    } catch (error: any) {
        console.error('Error fetching balance:', error);
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
        
        const result = await spendEngine.spendCredit(params);
        res.json(result);
    } catch (error: any) {
        console.error('Error processing spend:', error);
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
        // In a real mirror, this would query a DB.
        // For this in-memory implementation, we access the private map if possible,
        // or just return empty if we can't cleanly access it without refactoring.
        // 
        // HACK: Accessing private map for demo purposes since we're using the mock/service in memory
        const entries = Array.from((narrativeMirror as any).narrativeRecords.values())
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
        res.json(entries);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/adapters
 * Get registered adapters
 */
app.get('/api/adapters', (req, res) => {
    // Access private adapters map for display
    const adapters = Array.from((spendEngine as any).adapters.values());
    res.json(adapters);
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 VAL Core Authority running on http://localhost:${PORT}`);
    console.log(`   - Terminals: Ready`);
    console.log(`   - TigerBeetle: Attempting Connection...`);
});
