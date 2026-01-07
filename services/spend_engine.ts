
import { 
    SpendParams, 
    SpendResult, 
    IMerchantValueAdapter,
    Attestation,
    CreditBalance
} from '../types';

const API_BASE = 'http://localhost:3001/api';

export class SpendEngine {
    // We keep adapters here only for "View" purposes or client-side config,
    // but the actual execution happens on backend. 
    // Ideally, we fetch adapters from backend too.
    private adapters: Map<string, IMerchantValueAdapter> = new Map();

    constructor(attestationEngine: any) {
        // AttestationEngine arg is kept for compatibility but ignored/deprecated
        console.log('[SpendEngine] Initialized in API Client Mode');
    }

    async registerAdapter(adapter: IMerchantValueAdapter): Promise<void> {
        // We still allow UI to "register" adapters to see them locally if needed,
        // but backend has its own source of truth.
        this.adapters.set(adapter.type, adapter);
    }

    getAdapters(): IMerchantValueAdapter[] {
        return Array.from(this.adapters.values());
    }

    /**
     * Universal Spend Logic: NOW VIA API AUTHORITY
     */
    async spendCredit(params: SpendParams): Promise<SpendResult> {
        console.log(`[SpendEngine] Remote Spend Request: ${params.amount} @ ${params.merchant}`);
        
        try {
            const response = await fetch(`${API_BASE}/spend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Spend Request Failed');
            }

            const result: SpendResult = await response.json();
            return result;
        } catch (error: any) {
            console.error('[SpendEngine] API Error:', error);
            throw error;
        }
    }

    // Deprecated client-side method
    async settle(event: any, attestation: any): Promise<SpendResult> {
        throw new Error('Client-side settlement is deprecated. Use API.');
    }

    async getCreditBalance(userId: string): Promise<CreditBalance> {
        try {
            const response = await fetch(`${API_BASE}/balance/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch balance');
            return await response.json();
        } catch (error) {
            console.error('[SpendEngine] Balance fetch error:', error);
            // Fallback for UI stability if server down
            return {
                userId,
                available: 0n,
                pending: 0n,
                total: 0n,
                lastUpdated: new Date()
            };
        }
    }
}
