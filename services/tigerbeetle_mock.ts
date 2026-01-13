
import { NARRATIVE_ACCOUNTS } from '../types';

export interface TBAccount {
    id: bigint;
    debits_posted: bigint;
    credits_posted: bigint;
    ledger: number;
    code: number;
}

export interface TBTransfer {
    id: bigint;
    debit_account_id: bigint;
    credit_account_id: bigint;
    amount: bigint;
    ledger: number;
    timestamp: bigint;
}

/**
 * Mocks the high-performance TigerBeetle ledger for browser demonstration.
 * Following the doctrine of Mechanical Truth: Ledgers update, money does not move.
 */
export class TigerBeetleMock {
    private accounts: Map<bigint, TBAccount> = new Map();
    private transfers: Map<bigint, TBTransfer> = new Map();

    constructor() {
        this.initializeAccounts();
    }

    private initializeAccounts() {
        // Initialize all accounts with zero balances first
        Object.values(NARRATIVE_ACCOUNTS).forEach(id => {
            this.accounts.set(BigInt(id), {
                id: BigInt(id),
                debits_posted: 0n,
                credits_posted: 0n,
                ledger: 1, // USD Ledger
                code: 1    // System Account
            });
        });

        // Set demo balances for key accounts (in micro-units: 1 USD = 1_000_000)
        // MINT account (genesis source) - negative balance (debits issued)
        const mintAcc = this.accounts.get(BigInt(NARRATIVE_ACCOUNTS.MINT));
        if (mintAcc) mintAcc.debits_posted = 30000_000000n; // $30,000 issued

        // STABLECOIN pool - available liquid funds  
        const stableAcc = this.accounts.get(BigInt(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN));
        if (stableAcc) stableAcc.credits_posted = 18584_910000n; // ~$18,584.91 available

        // ODFI Reserve - trust backstop
        const odfiAcc = this.accounts.get(BigInt(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI));
        if (odfiAcc) odfiAcc.credits_posted = 10000_000000n; // $10,000 reserve
    }

    async createTransfer(
        debitAccount: bigint,
        creditAccount: bigint,
        amount: bigint,
        ledger: number = 1,
        id?: bigint
    ): Promise<boolean> {
        // Deterministic ID or generated
        const transferId = id || BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));

        // Idempotency check
        if (this.transfers.has(transferId)) {
            console.warn(`[TigerBeetle] Transfer ${transferId} already exists. Idempotency triggered.`);
            return true; 
        }

        if (amount <= 0n) {
            console.error("[TigerBeetle] Transfer failed: Amount must be positive.");
            return false;
        }

        const from = this.accounts.get(debitAccount);
        const to = this.accounts.get(creditAccount);

        if (!from || !to) {
            console.error(`[TigerBeetle] Transfer failed: Account ${!from ? debitAccount : creditAccount} not found.`);
            return false;
        }

        // Mechanical Invariant: No overdrafts (except from MINT)
        const currentBalance = from.credits_posted - from.debits_posted;
        const isMint = debitAccount === BigInt(NARRATIVE_ACCOUNTS.MINT);
        
        if (!isMint && currentBalance < amount) {
            console.error(`[TigerBeetle] Transfer rejected: Insufficient balance in ${debitAccount}. Current: ${currentBalance}, Requested: ${amount}`);
            return false;
        }

        // Atomic Update
        from.debits_posted += amount;
        to.credits_posted += amount;

        const transfer: TBTransfer = {
            id: transferId,
            debit_account_id: debitAccount,
            credit_account_id: creditAccount,
            amount: amount,
            ledger: ledger,
            timestamp: BigInt(Date.now())
        };

        this.transfers.set(transferId, transfer);
        return true;
    }

    async verifyIntegrity(): Promise<boolean> {
        let totalIssued = 0n;
        let totalBalances = 0n;

        for (const [id, acc] of this.accounts) {
            const balance = acc.credits_posted - acc.debits_posted;
            if (id === BigInt(NARRATIVE_ACCOUNTS.MINT)) {
                totalIssued = acc.debits_posted; 
            } else {
                totalBalances += balance;
            }
        }
        return totalIssued === totalBalances;
    }

    async getBalance(id: bigint): Promise<bigint> {
        const acc = this.accounts.get(id);
        if (!acc) return 0n;
        // Asset account balance: Debits - Credits
        // Liability account balance: Credits - Debits
        // We use a universal "net" for this mock: Credits - Debits
        return acc.credits_posted - acc.debits_posted;
    }
}

let instance: TigerBeetleMock | null = null;
export function getTigerBeetle(): TigerBeetleMock {
    if (!instance) instance = new TigerBeetleMock();
    return instance;
}
