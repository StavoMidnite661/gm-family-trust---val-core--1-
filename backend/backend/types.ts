
export enum CreditEventType {
    // === Deposit Events ===
    CREDIT_DEPOSITED = 'CREDIT_DEPOSITED',
    VALUE_CREATED = 'VALUE_CREATED',

    // === Attestation Events ===
    CREDIT_PROOF_ATTESTED = 'CREDIT_PROOF_ATTESTED',
    ATTESTATION_VERIFIED = 'ATTESTATION_VERIFIED',
    CREDIT_UNLOCKED = 'CREDIT_UNLOCKED',

    // === Merchant Events ===
    MERCHANT_VALUE_REQUESTED = 'MERCHANT_VALUE_REQUESTED',
    MERCHANT_VALUE_ISSUED = 'MERCHANT_VALUE_ISSUED',
    GIFT_CARD_CREATED = 'GIFT_CARD_CREATED',

    // === Spend Events ===
    SPEND_AUTHORIZED = 'SPEND_AUTHORIZED',
    SPEND_EXECUTED = 'SPEND_EXECUTED',
    SPEND_SETTLED = 'SPEND_SETTLED',
    SPEND_FAILED = 'SPEND_FAILED',

    // === Reward Events ===
    USER_REWARD_EARNED = 'USER_REWARD_EARNED',
    CASHBACK_ISSUED = 'CASHBACK_ISSUED',

    // === Reconciliation Events ===
    BALANCE_RECONCILED = 'BALANCE_RECONCILED',
    AUDIT_LOG_CREATED = 'AUDIT_LOG_CREATED'
}

export type MerchantType = 'square' | 'tango' | 'instacart' | 'amazon' | 'walmart' | 'stripe' | 'coinbase' | 'visa';

export type AnchorType = 'GROCERY' | 'UTILITY' | 'FUEL' | 'MOBILE' | 'HOUSING' | 'MEDICAL' | 'GENERAL_GOODS';

export interface AttestationProof {
    merkleRoot: string;
    merkleProof: string[];
    eventHash: string;
    nonce: string;
}

export interface Attestation {
    id: string;
    eventId: string;
    signature: string;
    attestor: string;
    timestamp: Date;
    proof: AttestationProof;
    onChainHash?: string;
}

export interface CreditEvent {
    id: string;
    type: CreditEventType;
    userId: string;
    amount: bigint;
    timestamp: Date;
    attestation?: Attestation;
    metadata: Record<string, any>;
    blockNumber?: number;
    transactionHash?: string;
}

export interface ValueRequest {
    userId: string;
    amount: number;
    currency: string;
    attestation: Attestation;
    metadata: Record<string, any>;
}

export interface ValueResponse {
    success: boolean;
    transactionId: string;
    value: {
        type: 'gift_card' | 'virtual_card' | 'direct_credit' | 'voucher';
        code?: string;
        url?: string;
        balance?: number;
        redemptionInstructions?: string;
        expiresAt?: Date;
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp: Date;
}

export interface IMerchantValueAdapter {
    name: string;
    type: MerchantType;
    enabled: boolean;
    lastValidatedAt?: Date;
    configParams?: Record<string, string>;
    issueValue(request: ValueRequest): Promise<ValueResponse>;
    validateConfig(): Promise<boolean>;
}

export interface SpendParams {
    userId: string;
    merchant: MerchantType;
    amount: number;
    timestamp: number;
    signature?: string;
    metadata: {
        email?: string;
        phone?: string;
        recipientId?: string;
    };
}

export interface SpendResult {
    success: boolean;
    transactionId: string;
    value: ValueResponse['value'];
    newBalance: bigint;
    attestation: Attestation;
}

export interface CreditBalance {
    userId: string;
    available: bigint;
    pending: bigint;
    total: bigint;
    lastUpdated: Date;
}

// Narrative Mirror Types (Doctrine Aligned)
export type NarrativeStatus = 'OBSERVED' | 'RECORDED' | 'FAILED';
export type NarrativeSource = 'CLEARING_OBSERVATION' | 'ATTESTATION' | 'HONORING_ATTEMPT' | 'HONORING_RESULT' | 'INTERSYSTEM';

export interface NarrativeEntry {
    id: string;
    date: string;
    description: string;
    lines: NarrativeLine[];
    source: NarrativeSource;
    status: NarrativeStatus;
    txHash?: string;
    blockNumber?: number;
    eventId?: string;
    attestationHash?: string;
    attestation?: Attestation;
    userId?: string;
}

export interface NarrativeLine {
    accountId: number;
    type: 'DEBIT' | 'CREDIT';
    amount: bigint;
}

/**
 * NARRATIVE_ACCOUNTS based on VAL Core Logic Review
 * Authority level is zero for these - they are for observation.
 */
export const NARRATIVE_ACCOUNTS = {
    MINT: 100,
    HONORING_ADAPTER_ODFI: 5000,
    HONORING_ADAPTER_STABLECOIN: 2500,
    OBSERVED_TOKEN_REALIZATION: 3001,
    OBSERVED_OPS_EXPENSE: 4001,
    OBSERVED_PURCHASE_EXPENSE: 4002,
    OBSERVED_AP: 5001,
    ANCHOR_GROCERY_AUTHORIZATION_MEMO: 9001,
    OBSERVED_ANCHOR_GROCERY_OBLIGATION: 9002,
    OBSERVED_ANCHOR_UTILITY_OBLIGATION: 9003,
    OBSERVED_ANCHOR_FUEL_OBLIGATION: 9004,
    OBSERVED_ANCHOR_MOBILE_OBLIGATION: 9005,
    OBSERVED_ANCHOR_HOUSING_OBLIGATION: 9006,
    OBSERVED_ANCHOR_MEDICAL_OBLIGATION: 9007,
};

export interface AssetAllocation {
    label: string;
    percentage: number;
    color: string;
}
