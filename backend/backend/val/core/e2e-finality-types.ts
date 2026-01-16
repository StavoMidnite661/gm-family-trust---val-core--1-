// E2E Finality Core Types
// SOVR Multi-Adapter Dispatcher Type System
//
// =============================================================================
// SOVR CANON NOTICE
// =============================================================================
// E2E Finality: The system remains sovereign. External honoring is OPTIONAL.
// TigerBeetle clearing is FINAL. External failures NEVER reverse clearing.
// =============================================================================

/**
 * Anchor Types define the translation path from ledger units to external value
 */
export enum AnchorType {
  GROCERY = 'GROCERY',      // Tango/Instacart
  UTILITY = 'UTILITY',      // Arcus Mastercard Bill-Pay
  CASH_OUT = 'CASH_OUT',     // Moov Push-to-Card / RTP
  FUEL = 'FUEL',            // Future: Fuel card providers
  MOBILE = 'MOBILE',          // Future: Mobile top-ups
  HOUSING = 'HOUSING',       // Future: Rent payment platforms
  MEDICAL = 'MEDICAL',        // Future: Healthcare providers
}

/**
 * Cleared Transfer from Mechanical Truth (TigerBeetle)
 * This represents FINAL, immutable truth from the clearing authority
 */
export interface ClearedTransfer {
  transferId: string;          // Unique transfer ID from TigerBeetle
  amount: bigint;              // Mathematical result of clearing (in micro-units)
  userAddress: string;         // User who holds the obligation
  anchorType: AnchorType;     // Which translation path to use
  finalityProof: string;       // TigerBeetle state proof (cryptographic hash)
  timestamp: number;            // When clearing occurred
  metadata?: Record<string, any>; // Additional context for adapters
}

/**
 * Honoring Result from External Adapter
 * The adapter provides evidence of external fulfillment
 */
export interface HonoringResult {
  success: boolean;
  anchorType: AnchorType;
  transferId: string;
  status: HonoringStatus;
  externalId?: string;         // External system's reference (e.g., CEP, Confirmation ID)
  proofHash: string;            // Canonical evidence hash
  errorMessage?: string;
  errorDetails?: any;
  fulfilledAt?: number;         // When external system confirmed fulfillment
}

/**
 * Honoring Status Lifecycle
 */
export enum HonoringStatus {
  // Initial states
  DISPATCHED = 'DISPATCHED',        // Transfer sent to adapter
  PENDING = 'PENDING',            // Adapter processing request

  // Terminal states
  HONORED = 'HONORED',          // External fulfillment confirmed
  FAILED_EXTERNAL = 'FAILED_EXTERNAL', // External system rejected
  EXPIRED = 'EXPIRED',           // Timeout without response
  REJECTED = 'REJECTED',           // Policy or compliance rejection

  // Manual intervention states
  MANUAL_REVIEW = 'MANUAL_REVIEW', // Requires human attention
}

/**
 * External Adapter Interface
 * All honoring agents must implement this contract
 */
export interface ExternalAdapter {
  adapterName: string;
  anchorType: AnchorType;

  /**
   * Execute honoring for a cleared obligation
   */
  honorClaim(transfer: ClearedTransfer): Promise<HonoringResult>;
}

/**
 * Honoring Configuration
 */
export interface HonoringConfig {
  maxRetryAttempts: number;          // Max retries per obligation
  retryDelayMs: number;             // Delay between retries
  timeoutMs: number;                 // Adapter timeout
  enableParallel: boolean;           // Allow parallel adapter execution
}

// ReserveAccount, ReserveStatus moved to credit-manager.ts (SOVR-compliant naming)
// These types use "settlement" terminology which violates SOVR_BLACKLIST_V2.md
// Use CreditAccount and CreditStatus from credit-manager.ts instead

/**
 * Fulfillment Proof
 * Canonical evidence that external fulfillment occurred
 */
export interface FulfillmentProof {
  transferId: string;
  proofType: ProofType;
  proofHash: string;                // Cryptographic hash of evidence
  proofData: string;                // Raw evidence (PIN, CEP, Receipt ID, etc.)
  timestamp: number;
  verifiedBy: string;              // Who verified this proof
}

/**
 * Proof Types by Anchor Type
 */
export enum ProofType {
  // GROCERY path
  TANGO_PIN = 'TANGO_PIN',              // Gift card PIN
  TANGO_ORDER_ID = 'TANGO_ORDER_ID', // Order reference

  // UTILITY path
  ARCUS_CEP = 'ARCUS_CEP',            // Customer Enrollment Profile
  ARCUS_RECEIPT = 'ARCUS_RECEIPT', // Payment receipt

  // CASH_OUT path
  MOOV_AUTH_CODE = 'MOOV_AUTH_CODE',   // Network authorization code
  MOOV_TRACE_ID = 'MOOV_TRACE_ID',     // Transaction trace ID

  // Generic
  EXTERNAL_REFERENCE = 'EXTERNAL_REFERENCE', // Any external reference ID
}

/**
 * E2E Finality Event
 * Emitted when a cleared obligation reaches terminal state
 */
export interface E2EFinalityEvent {
  eventId: string;
  transferId: string;
  anchorType: AnchorType;
  previousStatus: HonoringStatus;
  newStatus: HonoringStatus;
  finalityProof?: FulfillmentProof;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Compliance Check Result
 */
export interface ComplianceCheck {
  approved: boolean;
  rejectionReason?: string;
  rejectionCode?: string;
}

/**
 * Dispatcher Configuration
 */
export interface DispatcherConfig {
  enabledAdapters: AnchorType[];
  defaultHonoringConfig: HonoringConfig;
  eventBusUrl?: string;
  narrativeMirrorUrl?: string;
}

/**
 * Error Types
 */
export class HonoringError extends Error {
  constructor(
    message: string,
    public code: string,
    public adapterType?: AnchorType,
    public transferId?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'HonoringError';
  }
}

/**
 * Dispatch Request
 */
export interface DispatchRequest {
  transfer: ClearedTransfer;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

/**
 * Dispatch Response
 */
export interface DispatchResponse {
  requestId: string;
  transferId: string;
  status: HonoringStatus;
  estimatedCompletion?: number; // Unix timestamp
  queuePosition?: number;
}
