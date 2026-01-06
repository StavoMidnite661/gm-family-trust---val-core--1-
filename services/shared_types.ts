/**
 * Shared Types - SOVR Value Creation Network
 * Integrated from val/ backend for frontend use
 */

// ============================================================================
// Event Types (from val/events/types.ts)
// ============================================================================

export enum CreditEventType {
  CREDIT_DEPOSITED = 'CREDIT_DEPOSITED',
  VALUE_CREATED = 'VALUE_CREATED',
  CREDIT_PROOF_ATTESTED = 'CREDIT_PROOF_ATTESTED',
  ATTESTATION_VERIFIED = 'ATTESTATION_VERIFIED',
  CREDIT_UNLOCKED = 'CREDIT_UNLOCKED',
  MERCHANT_VALUE_REQUESTED = 'MERCHANT_VALUE_REQUESTED',
  MERCHANT_VALUE_ISSUED = 'MERCHANT_VALUE_ISSUED',
  GIFT_CARD_CREATED = 'GIFT_CARD_CREATED',
  SPEND_AUTHORIZED = 'SPEND_AUTHORIZED',
  SPEND_EXECUTED = 'SPEND_EXECUTED',
  SPEND_SETTLED = 'SPEND_SETTLED',
  SPEND_FAILED = 'SPEND_FAILED',
  USER_REWARD_EARNED = 'USER_REWARD_EARNED',
  CASHBACK_ISSUED = 'CASHBACK_ISSUED',
  BALANCE_RECONCILED = 'BALANCE_RECONCILED',
  AUDIT_LOG_CREATED = 'AUDIT_LOG_CREATED'
}

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
  metadata: Record<string, unknown>;
  blockNumber?: number;
  transactionHash?: string;
}

export interface CreditBalance {
  userId: string;
  available: bigint;
  pending: bigint;
  total: bigint;
  lastUpdated: Date;
}

export interface SpendParams {
  userId: string;
  merchant: MerchantType;
  amount: number;
  metadata: {
    email?: string;
    phone?: string;
    recipientId?: string;
  };
}

export interface SpendResult {
  success: boolean;
  transactionId: string;
  value: {
    type: 'gift_card' | 'virtual_card' | 'direct_credit' | 'voucher';
    code?: string;
    url?: string;
    balance?: number;
  };
  newBalance: bigint;
  attestation: Attestation;
}

export type MerchantType = 'square' | 'stripe' | 'coinbase' | 'visa' | 'tango' | 'instacart';

// ============================================================================
// Narrative Mirror Types (from val/shared/narrative-mirror-bridge.ts)
// ============================================================================

export type NarrativeStatus = 'OBSERVED' | 'RECORDED' | 'FAILED' | 'IGNORED';

export type NarrativeSource = 
  | 'CLEARING_OBSERVATION' 
  | 'ATTESTATION' 
  | 'HONORING_ATTEMPT' 
  | 'HONORING_RESULT' 
  | 'INTERSYSTEM';

export interface NarrativeEntryLine {
  accountId: number;
  type: 'DEBIT' | 'CREDIT';
  amount: bigint;
  description?: string;
}

export interface NarrativeEntry {
  id: string;
  date: string;
  description: string;
  lines: NarrativeEntryLine[];
  source: string;
  status: NarrativeStatus;
  txHash?: string;
  blockNumber?: number;
  eventId?: string;
  attestationHash?: string;
  userId?: string;
}

export interface RecordNarrativeEntryRequest {
  description: string;
  lines: NarrativeEntryLine[];
  source: NarrativeSource | string;
  status?: NarrativeStatus;
  txHash?: string;
  blockNumber?: number;
  eventId?: string;
  attestationHash?: string;
  userId?: string;
}

export interface RecordNarrativeEntryResponse {
  success: boolean;
  narrativeEntryId?: string;
  error?: string;
}

export type AnchorType = 'GROCERY' | 'UTILITY' | 'FUEL' | 'MOBILE' | 'HOUSING' | 'MEDICAL';

export interface AnchorAuthorization {
  eventId: string;
  user: string;
  anchorType: AnchorType;
  units: bigint;
  expiry: number;
}

// ============================================================================
// Merchant Adapter Types (from val/merchant_triggers/adapter_interface.ts)
// ============================================================================

export interface ValueRequest {
  userId: string;
  amount: number;
  currency: string;
  attestation: Attestation;
  metadata: {
    email?: string;
    phone?: string;
    recipientId?: string;
    customData?: Record<string, unknown>;
  };
}

export interface ValueResponse {
  success: boolean;
  transactionId: string;
  value: {
    type: 'gift_card' | 'virtual_card' | 'direct_credit' | 'voucher';
    code?: string;
    url?: string;
    balance?: number;
    expiresAt?: Date;
    redemptionInstructions?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: Date;
}

export interface TransactionStatus {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  value?: ValueResponse['value'];
  error?: ValueResponse['error'];
  updatedAt: Date;
}

export interface WebhookResponse {
  acknowledged: boolean;
  eventType: string;
  processedAt: Date;
}

export class MerchantAdapterError extends Error {
  constructor(
    message: string,
    public code: string,
    public merchantType: MerchantType,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MerchantAdapterError';
  }
}

// ============================================================================
// Account ID Constants (from val/shared/narrative-mirror-bridge.ts)
// ============================================================================

export const NARRATIVE_ACCOUNTS = {
  HONORING_ADAPTER_ODFI: 1000,
  HONORING_ADAPTER_STABLECOIN: 1010,
  HONORING_ADAPTER_ACH: 1050,
  HONORING_ADAPTER_CARD: 1060,
  
  OBSERVED_AP: 2000,
  OBSERVED_ANCHOR_GROCERY_OBLIGATION: 2500,
  OBSERVED_ANCHOR_UTILITY_OBLIGATION: 2501,
  OBSERVED_ANCHOR_FUEL_OBLIGATION: 2502,
  OBSERVED_ANCHOR_MOBILE_OBLIGATION: 2503,
  OBSERVED_ANCHOR_HOUSING_OBLIGATION: 2504,
  OBSERVED_ANCHOR_MEDICAL_OBLIGATION: 2505,

  ANCHOR_GROCERY_AUTHORIZATION_MEMO: 3500,
  ANCHOR_UTILITY_AUTHORIZATION_MEMO: 3501,
  ANCHOR_FUEL_AUTHORIZATION_MEMO: 3502,
  ANCHOR_MOBILE_AUTHORIZATION_MEMO: 3503,
  ANCHOR_HOUSING_AUTHORIZATION_MEMO: 3504,
  ANCHOR_MEDICAL_AUTHORIZATION_MEMO: 3505,
  
  OBSERVED_TOKEN_REALIZATION: 4000,
  OBSERVED_OPS_EXPENSE: 6000,
  OBSERVED_PURCHASE_EXPENSE: 6100,
  OBSERVED_ANCHOR_FULFILLMENT_EXPENSE: 6300,
} as const;
