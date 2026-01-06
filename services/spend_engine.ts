
import { id as ethersId } from 'ethers';
import { 
    CreditEvent, 
    CreditEventType, 
    SpendParams, 
    SpendResult, 
    NARRATIVE_ACCOUNTS,
    IMerchantValueAdapter,
    Attestation,
    CreditBalance
} from '../types';
import { AttestationEngine } from './attestation';
import { getNarrativeMirror, NarrativeMirrorService } from './narrative_mirror';
import { getTigerBeetle, TigerBeetleMock } from './tigerbeetle_mock';

export class SpendEngine {
    private attestationEngine: AttestationEngine;
    private narrativeMirror: NarrativeMirrorService;
    private tigerBeetle: TigerBeetleMock;
    private adapters: Map<string, IMerchantValueAdapter> = new Map();
    private userBalanceCache: Map<string, { balance: CreditBalance; timestamp: number }> = new Map();

    constructor(attestationEngine: AttestationEngine) {
        this.attestationEngine = attestationEngine;
        this.narrativeMirror = getNarrativeMirror();
        this.tigerBeetle = getTigerBeetle();
    }

    async registerAdapter(adapter: IMerchantValueAdapter): Promise<void> {
        const isValid = await adapter.validateConfig();
        if (!isValid) return;
        this.adapters.set(adapter.type, adapter);
    }

    getAdapters(): IMerchantValueAdapter[] {
        return Array.from(this.adapters.values());
    }

    /**
     * Universal Spend Logic: Converts attested credit into real-world value.
     * Enforces strict SOVR Doctrine Assertions.
     */
    async spendCredit(params: SpendParams): Promise<SpendResult> {
        // [DOCTRINE ASSERTION: RULE ZERO] Truth is Mechanical. 
        // We begin by calculating the mechanical units.
        const requestedUnits = BigInt(Math.floor(params.amount * 1_000_000));
        
        // [DOCTRINE ASSERTION: ECONOMIC REALITY]
        if (requestedUnits <= 0n) {
            throw new Error("[DOCTRINE VIOLATION] Mechanical units must be positive. Reality cannot clear zero or negative value.");
        }

        // [DOCTRINE ASSERTION: RULE FIVE] Attestation First.
        // Even before checking balance, we define the intent.
        const event: CreditEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: CreditEventType.SPEND_AUTHORIZED,
            userId: params.userId,
            amount: requestedUnits,
            timestamp: new Date(),
            metadata: { merchant: params.merchant, ...params.metadata }
        };

        // 1. Check Authority (TigerBeetle) - [RULE TWO: NO BALANCE EDITS]
        // Balance is a mathematical result of prior cleared transfers.
        const balance = await this.getCreditBalance(params.userId);
        
        // [DOCTRINE ASSERTION: SUSTAINABILITY] Sustainability Without a Credit System.
        // We strictly enforce No Overdraft / No Borrowing.
        if (balance.available < requestedUnits) {
            throw new Error(`[DOCTRINE VIOLATION: NO CREDIT] Insufficient cleared capacity: ${balance.available} < ${requestedUnits}. Borrowing is mechanically prohibited.`);
        }

        // 2. [RULE FIVE] Attestation Generation
        const attestation = await this.attestationEngine.attest(event);
        if (!attestation) {
            throw new Error("[DOCTRINE VIOLATION] Attestation failed. Claims without proof are void.");
        }

        // 3. Record Intent (Observer) - [RULE ONE: NO PAYMENT PROCESSING]
        // This is a record of intent, not a guarantee of payment.
        await this.narrativeMirror.recordNarrativeEntry({
            description: `Authorization Intent Observed: ${params.amount} USD at ${params.merchant}`,
            source: 'HONORING_ATTEMPT',
            status: 'OBSERVED',
            userId: params.userId,
            eventId: event.id,
            attestation,
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.OBSERVED_OPS_EXPENSE, type: 'DEBIT', amount: requestedUnits },
                { accountId: NARRATIVE_ACCOUNTS.ANCHOR_GROCERY_AUTHORIZATION_MEMO, type: 'CREDIT', amount: requestedUnits }
            ]
        });

        // 4. Fulfillment (External Agent) - [RULE SIX: LEGACY RAILS ARE GUESTS]
        const adapter = this.adapters.get(params.merchant);
        if (!adapter) throw new Error(`[DOCTRINE VIOLATION] No honoring guest registered for: ${params.merchant}`);
        if (!adapter.enabled) throw new Error(`[DOCTRINE VIOLATION] Adapter for ${params.merchant} is currently disabled.`);

        const valueResponse = await adapter.issueValue({
            userId: params.userId,
            amount: params.amount,
            currency: 'USD',
            attestation,
            metadata: params.metadata
        });

        if (!valueResponse.success) {
            // [RULE EIGHT: NO REVERSALS] Failures are recorded as new events.
            await this.narrativeMirror.recordNarrativeEntry({
                description: `Fulfillment Observation (FAILED): ${valueResponse.error?.message}`,
                source: 'HONORING_RESULT',
                status: 'FAILED',
                userId: params.userId,
                eventId: event.id,
                lines: []
            });
            throw new Error(valueResponse.error?.message || 'External honoring failed.');
        }

        // 5. Settlement (Mechanical Clearing) - [RULE ZERO: TRUTH IS MECHANICAL]
        const transferId = this.eventIdToBigInt(event.id);
        const cleared = await this.tigerBeetle.createTransfer(
            BigInt(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN),
            BigInt(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI),
            requestedUnits,
            1,
            transferId
        );

        // [DOCTRINE ASSERTION: MECHANICAL TRUTH]
        if (!cleared) {
            throw new Error("[DOCTRINE VIOLATION] TigerBeetle rejection. If it did not clear in TB, it did not happen. Clearing failed (Potential Replay).");
        }

        // 6. Record Settlement Observation - [RULE THREE: NO OVERRIDES]
        await this.narrativeMirror.recordNarrativeEntry({
            description: `Settlement Observed: Mechanical finality confirmed for ${event.id}`,
            source: 'HONORING_RESULT',
            status: 'RECORDED',
            userId: params.userId,
            eventId: event.id,
            attestation,
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.OBSERVED_OPS_EXPENSE, type: 'DEBIT', amount: requestedUnits },
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI, type: 'CREDIT', amount: requestedUnits }
            ]
        });

        return {
            success: true,
            transactionId: event.id,
            value: valueResponse.value,
            newBalance: (await this.getCreditBalance(params.userId)).available,
            attestation
        };
    }

    async settle(event: CreditEvent, attestation: Attestation): Promise<SpendResult> {
        // [DOCTRINE ASSERTION: RULE FIVE] Attestation First.
        const isValid = await this.attestationEngine.verify(attestation, event);
        if (!isValid) throw new Error('[DOCTRINE VIOLATION] Verification failure. Unattested claims are void.');

        const transferId = this.eventIdToBigInt(event.id);

        // [DOCTRINE ASSERTION: RULE ZERO] Mechanical Finality
        const success = await this.tigerBeetle.createTransfer(
            BigInt(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN),
            BigInt(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI),
            event.amount,
            1,
            transferId
        );

        if (!success) throw new Error('[DOCTRINE VIOLATION] Mechanical rejection: Replay or invalid capacity.');

        await this.narrativeMirror.recordNarrativeEntry({
            description: `Async Settlement Observation for ${event.id}`,
            source: 'HONORING_RESULT',
            status: 'RECORDED',
            userId: event.userId,
            eventId: event.id,
            attestation,
            lines: [
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI, type: 'DEBIT', amount: 0n },
                { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI, type: 'CREDIT', amount: 0n }
            ]
        });

        return {
            success: true,
            transactionId: event.id,
            value: { type: 'direct_credit' },
            newBalance: (await this.getCreditBalance(event.userId)).available,
            attestation
        };
    }

    async getCreditBalance(userId: string): Promise<CreditBalance> {
        // [RULE TWO: NO BALANCE EDITS] - Balance is a mathematical result.
        const totalStable = await this.tigerBeetle.getBalance(BigInt(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN));
        
        // In a sovereign system, the balance is a real-time observation of the ledger state.
        const userAvailable = totalStable > 500n * 1_000_000n ? 500n * 1_000_000n : totalStable;

        return {
            userId,
            available: userAvailable,
            pending: 0n,
            total: userAvailable,
            lastUpdated: new Date()
        };
    }

    private eventIdToBigInt(id: string): bigint {
        const hashHex = ethersId(id);
        return BigInt(hashHex) & 0xffffffffffffffffffffffffffffffffn;
    }
}
