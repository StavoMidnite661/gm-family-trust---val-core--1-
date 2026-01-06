
import { 
    NarrativeEntry, 
    NarrativeLine, 
    NarrativeSource, 
    NarrativeStatus, 
    NARRATIVE_ACCOUNTS,
    Attestation
} from '../types';

export class NarrativeMirrorService {
    private records: NarrativeEntry[] = [];
    private observedBalances: Map<number, bigint> = new Map();

    constructor() {
        Object.values(NARRATIVE_ACCOUNTS).forEach(id => {
            this.observedBalances.set(id, 0n);
        });
        
        // Initial observed balances (NOT authoritative)
        this.observedBalances.set(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, 2500n * 1_000_000n);
        this.observedBalances.set(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI, 5000n * 1_000_000n);

        this.seedInitialData();
    }

    private seedInitialData() {
        const createMockAttestation = (eventId: string): Attestation => ({
            id: `att_${eventId}`,
            eventId,
            signature: `0x${Math.random().toString(16).slice(2, 66)}...sig`,
            attestor: `0x${Math.random().toString(16).slice(2, 42)}`,
            timestamp: new Date(),
            proof: {
                merkleRoot: `0x${Math.random().toString(16).slice(2, 66)}`,
                merkleProof: [],
                eventHash: `0x${Math.random().toString(16).slice(2, 66)}`,
                nonce: `0x${Math.random().toString(16).slice(2, 66)}`
            }
        });

        const initialEvents = [
            {
                description: "Credit Deposit Observed: 1000.00 USD",
                source: 'CLEARING_OBSERVATION' as NarrativeSource,
                status: 'RECORDED' as NarrativeStatus,
                userId: 'user_0x9928',
                eventId: 'evt_init_01',
                lines: [
                    { accountId: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, type: 'DEBIT' as const, amount: 1000n * 1_000_000n },
                    { accountId: NARRATIVE_ACCOUNTS.OBSERVED_TOKEN_REALIZATION, type: 'CREDIT' as const, amount: 1000n * 1_000_000n },
                ]
            }
        ];

        initialEvents.forEach(e => {
            this.recordNarrativeEntry({
                ...e,
                attestation: createMockAttestation(e.eventId)
            });
        });
    }

    async recordNarrativeEntry(entry: Omit<NarrativeEntry, 'id' | 'date'>): Promise<string> {
        const id = `NM-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const newEntry: NarrativeEntry = {
            ...entry,
            id,
            date: new Date().toISOString().split('T')[0]
        };

        this.records.push(newEntry);

        // Update local observations (Observer only - never authoritative)
        newEntry.lines.forEach(line => {
            const current = this.observedBalances.get(line.accountId) || 0n;
            const delta = line.type === 'DEBIT' ? line.amount : -line.amount;
            this.observedBalances.set(line.accountId, current + delta);
        });

        return id;
    }

    getEntries(): NarrativeEntry[] {
        return [...this.records].reverse();
    }

    getObservedBalance(accountId: number): bigint {
        return this.observedBalances.get(accountId) || 0n;
    }

    async getPendingObligationObservations(): Promise<Record<string, bigint>> {
        return {
            GROCERY: this.observedBalances.get(NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_GROCERY_OBLIGATION) || 0n,
            UTILITY: this.observedBalances.get(NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_UTILITY_OBLIGATION) || 0n,
            FUEL: this.observedBalances.get(NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_FUEL_OBLIGATION) || 0n,
            MOBILE: this.observedBalances.get(NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_MOBILE_OBLIGATION) || 0n,
            HOUSING: this.observedBalances.get(NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_HOUSING_OBLIGATION) || 0n,
            MEDICAL: this.observedBalances.get(NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_MEDICAL_OBLIGATION) || 0n,
        };
    }
}

let instance: NarrativeMirrorService | null = null;
export function getNarrativeMirror(): NarrativeMirrorService {
    if (!instance) instance = new NarrativeMirrorService();
    return instance;
}
