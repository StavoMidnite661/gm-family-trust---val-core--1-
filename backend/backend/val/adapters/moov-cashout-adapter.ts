// Moov Cash-Out Adapter (Push-to-Card)
// Translates CLEARED CASH_OUT obligations into Moov push-to-card payments
//
// =============================================================================
// SOVR CANON NOTICE
// =============================================================================
// Zero-Float: Adapter uses net-clearing via CreditManager
// Clearing: Net-based with Moov
// Failure Autonomy: Moov failures DO NOT reverse TigerBeetle clearing
// =============================================================================

import {
  AnchorType,
  ClearedTransfer,
  ExternalAdapter,
  HonoringResult,
  HonoringStatus,
  HonoringError,
  ProofType,
} from '../core/e2e-finality-types';

/**
 * Moov Configuration
 */
export interface MoovConfig {
  apiKey: string;              // Moov API key
  apiUrl: string;              // Base API URL (sandbox or production)
  partnerId: string;           // Moov partner ID
  sandbox?: boolean;            // Sandbox mode flag
}

/**
 * Moov Push-to-Card Request
 */
interface MoovPushRequest {
  amount: number;              // Amount in USD
  cardLast4: string;          // Last 4 digits of card number
  cardHolderName: string;     // Cardholder's full name
  externalReference: string;   // Our transfer ID for tracking
  description?: string;        // Optional description
}

/**
 * Moov API Response
 */
interface MoovPushResponse {
  transactionId: string;       // Moov transaction ID
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REJECTED';
  networkAuthCode?: string;   // Network authorization code
  traceId?: string;          // Transaction trace ID
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Moov Transaction Status Check
 */
interface MoovTransactionStatus {
  transactionId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REJECTED' | 'CANCELLED';
  processedAt?: string;        // ISO 8601 timestamp
  completedAt?: string;       // ISO 8601 timestamp
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Moov Cash-Out Adapter
 * Honors CASH_OUT anchor obligations via Moov Push-to-Card
 */
export class MoovCashOutAdapter implements ExternalAdapter {
  adapterName = 'Moov Push-to-Card';
  anchorType = AnchorType.CASH_OUT;

  private config: MoovConfig;
  private rateLimitMs: number = 1000; // Rate limit: 1 request per second

  constructor(config: MoovConfig) {
    this.config = {
      sandbox: false,
      ...config,
    };

    if (!this.config.apiKey) {
      throw new Error('Moov API key is required');
    }

    if (!this.config.partnerId) {
      throw new Error('Moov partner ID is required');
    }
  }

  /**
   * Honor a cleared CASH_OUT obligation
   * Main implementation of ExternalAdapter interface
   */
  async honorClaim(transfer: ClearedTransfer): Promise<HonoringResult> {
    const startTime = Date.now();

    console.log(`[MoovAdapter] Honoring CASH_OUT claim ${transfer.transferId}`);

    try {
      // 1. Extract payment details from metadata
      const cardLast4 = transfer.metadata?.cardLast4;
      const cardHolderName = transfer.metadata?.cardHolderName;
      const description = transfer.metadata?.description;

      if (!cardLast4) {
        throw new HonoringError(
          'Card last 4 digits required for CASH_OUT anchor type',
          'MISSING_CARD_INFO',
          AnchorType.CASH_OUT,
          transfer.transferId
        );
      }

      if (!cardHolderName) {
        throw new HonoringError(
          'Cardholder name required for CASH_OUT anchor type',
          'MISSING_CARDHOLDER',
          AnchorType.CASH_OUT,
          transfer.transferId
        );
      }

      // 2. Translate micro-units to USD (1 unit = $0.000001)
      const amountUSD = Number(transfer.amount) / 1_000_000;

      // 3. Validate amount
      if (amountUSD <= 0 || amountUSD > 10000) {
        throw new HonoringError(
          'Amount must be between $0.01 and $10,000',
          'INVALID_AMOUNT',
          AnchorType.CASH_OUT,
          transfer.transferId
        );
      }

      // 4. Call Moov Push-to-Card API with retry logic
      const pushResult = await this.executePushToCard({
        amount: amountUSD,
        cardLast4,
        cardHolderName,
        externalReference: transfer.transferId,
        description,
      });

      // 5. Generate fulfillment proof
      const proofHash = this.generateProofHash(pushResult);

      // 6. Map Moov status to SOVR HonoringStatus
      const statusMap: Record<string, HonoringStatus> = {
        'SUCCESS': HonoringStatus.HONORED,
        'PENDING': HonoringStatus.PENDING,
        'FAILED': HonoringStatus.FAILED_EXTERNAL,
        'REJECTED': HonoringStatus.REJECTED,
      };

      const status = statusMap[pushResult.status] || HonoringStatus.MANUAL_REVIEW;

      console.log(`[MoovAdapter] Push transaction ${pushResult.transactionId}: ${status}`);

      return {
        success: status === HonoringStatus.HONORED || status === HonoringStatus.PENDING,
        anchorType: AnchorType.CASH_OUT,
        transferId: transfer.transferId,
        status,
        externalId: pushResult.transactionId,
        proofHash,
        errorMessage: pushResult.error?.message,
        errorDetails: pushResult.error,
        fulfilledAt: status === HonoringStatus.HONORED ? Date.now() : undefined,
      };

    } catch (error) {
      const honError = error instanceof HonoringError
        ? error
        : new HonoringError(
            error instanceof Error ? error.message : 'Unknown error',
            'MOOV_ADAPTER_ERROR',
            AnchorType.CASH_OUT,
            transfer.transferId,
            error
          );

      console.error('[MoovAdapter] Error honoring claim:', honError);

      return {
        success: false,
        anchorType: AnchorType.CASH_OUT,
        transferId: transfer.transferId,
        status: HonoringStatus.FAILED_EXTERNAL,
        errorMessage: honError.message,
        errorDetails: honError.details,
      };
    }
  }

  /**
   * Execute push-to-card via Moov API (with retry logic)
   */
  private async executePushToCard(params: {
    amount: number;
    cardLast4: string;
    cardHolderName: string;
    externalReference: string;
    description?: string;
  }): Promise<MoovPushResponse> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[MoovAdapter] Push attempt ${attempt}/${maxRetries} for ${params.externalReference}`);

        const response = await this.callMoovAPI({
          method: 'POST',
          endpoint: '/v1/push-to-card',
          body: {
            partnerId: this.config.partnerId,
            amount: params.amount,
            currency: 'USD',
            cardLast4: params.cardLast4,
            cardHolderName: params.cardHolderName,
            externalReference: params.externalReference,
            description: params.description || 'SOVR Cash-Out',
          },
        });

        // Check for non-retryable errors
        if (this.isNonRetryableError(response)) {
          return response;
        }

        lastError = new Error(response.error?.message || 'Unknown API error');

        // Exponential backoff before retry
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`[MoovAdapter] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }

      } catch (error) {
        lastError = error as Error;
        console.error(`[MoovAdapter] Attempt ${attempt} exception:`, error);

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('All retry attempts exhausted');
  }

  /**
   * Call Moov API
   */
  private async callMoovAPI(params: {
    method: string;
    endpoint: string;
    body: any;
  }): Promise<MoovPushResponse> {
    const url = `${this.config.apiUrl}${params.endpoint}`;

    const response = await fetch(url, {
      method: params.method as any,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Partner-ID': this.config.partnerId,
      },
      body: JSON.stringify(params.body),
      // 30 second timeout
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // Ignore JSON parse errors
      }

      return {
        transactionId: '',
        status: 'FAILED',
        error: {
          code: `HTTP_${response.status}`,
          message: errorMessage,
        },
      };
    }

    return await response.json();
  }

  /**
   * Check transaction status via Moov API
   */
  async checkStatus(transactionId: string): Promise<MoovTransactionStatus> {
    try {
      console.log(`[MoovAdapter] Checking transaction status: ${transactionId}`);

      const response = await this.callMoovAPI({
        method: 'GET',
        endpoint: `/v1/transactions/${transactionId}`,
      });

      return response;

    } catch (error) {
      console.error('[MoovAdapter] Error checking transaction status:', error);

      return {
        transactionId,
        status: 'FAILED',
        error: {
          code: 'STATUS_CHECK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Determine if error is retryable
   */
  private isNonRetryableError(response: MoovPushResponse): boolean {
    const nonRetryableCodes = [
      'AUTH_FAILED',
      'INVALID_PARTNER',
      'INVALID_CARD',
      'INSUFFICIENT_FUNDS',
      'COMPLIANCE_REJECTED',
      'CARD_DECLINED',
      'DUPLICATE_TRANSACTION',
    ];

    if (response.error?.code && nonRetryableCodes.includes(response.error.code)) {
      return true;
    }

    // Timeout and network errors are retryable
    if (['FAILED', 'REJECTED'].includes(response.status)) {
      return false;
    }

    return false;
  }

  /**
   * Generate cryptographic proof hash
   */
  private generateProofHash(pushResult: MoovPushResponse): string {
    const proofData = {
      transactionId: pushResult.transactionId,
      networkAuthCode: pushResult.networkAuthCode,
      traceId: pushResult.traceId,
      status: pushResult.status,
      timestamp: Date.now(),
      provider: 'MOOV',
    };

    // In production: keccak256(JSON.stringify(proofData))
    return `0x${Buffer.from(JSON.stringify(proofData)).toString('hex')}`;
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate configuration
   */
  validateConfig(): boolean {
    return !!(
      this.config.apiKey &&
      this.config.partnerId &&
      this.config.apiUrl
    );
  }

  /**
   * Get environment info
   */
  getEnvironment(): { sandbox: boolean; apiUrl: string } {
    return {
      sandbox: this.config.sandbox ?? false,
      apiUrl: this.config.apiUrl,
    };
  }
}

export { MoovCashOutAdapter, MoovConfig, MoovPushResponse, MoovTransactionStatus };
