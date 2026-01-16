// Arcus Utility Honoring Agent
// Translates CLEARED UTILITY obligations into Arcus Bill-Pay payments
//
// =============================================================================
// SOVR CANON NOTICE
// =============================================================================
// Zero-Float: Adapter uses net-clearing via CreditManager
// Clearing: Net-based with Arcus
// Failure Autonomy: Arcus failures DO NOT reverse TigerBeetle clearing
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
 * Arcus Configuration
 */
export interface ArcusConfig {
  merchantId: string;           // Arcus merchant ID
  secretKey: string;           // API secret key
  sandbox: boolean;            // Sandbox mode
  apiUrl: string;              // Base API URL
}

/**
 * Arcus Biller (Utility Provider)
 */
export interface ArcusBiller {
  billerId: string;            // Arcus biller ID
  name: string;                // Display name (e.g., "Electric Company")
  accountNumber?: string;         // User's account with biller
  billerType: 'ELECTRIC' | 'GAS' | 'WATER' | 'TELECOM';
}

/**
 * Arcus Bill-Pay API Response
 */
export interface ArcusPaymentResponse {
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'INSUFFICIENT_FUNDS';
  cep?: string;                 // Customer Enrollment Profile
  confirmationId?: string;       // Payment confirmation/receipt ID
  paymentId?: string;            // Arcus payment ID
  referenceNumber?: string;       // Bank reference number
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Arcus Utility Adapter
 * Honors UTILITY anchor obligations via Arcus Bill-Pay
 */
export class ArcusUtilityAdapter implements ExternalAdapter {
  adapterName = 'Arcus Bill-Pay';
  anchorType = AnchorType.UTILITY;

  private config: ArcusConfig;
  private billers: Map<string, ArcusBiller>;

  constructor(config: ArcusConfig) {
    this.config = config;
    this.billers = new Map();

    // Initialize known billers
    this.initializeBillers();
  }

  /**
   * Initialize standard utility billers
   */
  private initializeBillers(): void {
    const standardBillers: ArcusBiller[] = [
      {
        billerId: 'ELECTRIC_COMPANY_A',
        name: 'Electric Company',
        billerType: 'ELECTRIC',
      },
      {
        billerId: 'GAS_COMPANY_A',
        name: 'Gas Company',
        billerType: 'GAS',
      },
      {
        billerId: 'WATER_UTILITY',
        name: 'Water Utility',
        billerType: 'WATER',
      },
      {
        billerId: 'TELECOM_PROVIDER_A',
        name: 'Telecom Provider',
        billerType: 'TELECOM',
      },
    ];

    standardBillers.forEach(biller => {
      this.billers.set(biller.billerId, biller);
    });
  }

  /**
   * Honor a cleared UTILITY obligation
   * Main implementation of ExternalAdapter interface
   */
  async honorClaim(transfer: ClearedTransfer): Promise<HonoringResult> {
    const startTime = Date.now();

    console.log(`[ArcusAdapter] Honoring UTILITY claim ${transfer.transferId}`);

    try {
      // 1. Extract biller information from metadata
      const billerId = transfer.metadata?.billerId;
      const accountNumber = transfer.metadata?.accountNumber;

      if (!billerId) {
        throw new HonoringError(
          'Biller ID required for UTILITY anchor type',
          'MISSING_BILLER',
          AnchorType.UTILITY,
          transfer.transferId
        );
      }

      const biller = this.billers.get(billerId);

      if (!biller) {
        throw new HonoringError(
          `Unknown biller ID: ${billerId}`,
          'UNKNOWN_BILLER',
          AnchorType.UTILITY,
          transfer.transferId
        );
      }

      // 2. Translate micro-units to USD (1 unit = $0.000001)
      const amountUSD = Number(transfer.amount) / 1_000_000;

      // 3. Call Arcus Bill-Pay API
      const paymentResult = await this.executeBillPayment({
        biller,
        accountNumber,
        amount: amountUSD,
        transferId: transfer.transferId,
      });

      // 4. Generate fulfillment proof
      const proofHash = this.generateProofHash(paymentResult);

      // 5. Map Arcus status to SOVR HonoringStatus
      const statusMap: Record<string, HonoringStatus> = {
        'SUCCESS': HonoringStatus.HONORED,
        'PENDING': HonoringStatus.PENDING,
        'FAILED': HonoringStatus.FAILED_EXTERNAL,
        'INSUFFICIENT_FUNDS': HonoringStatus.MANUAL_REVIEW,
      };

      const status = statusMap[paymentResult.status] || HonoringStatus.MANUAL_REVIEW;

      console.log(`[ArcusAdapter] Payment ${paymentResult.paymentId}: ${status}`);

      return {
        success: status === HonoringStatus.HONORED,
        anchorType: AnchorType.UTILITY,
        transferId: transfer.transferId,
        status,
        externalId: paymentResult.cep || paymentResult.confirmationId || paymentResult.paymentId,
        proofHash,
        errorMessage: paymentResult.error?.message,
        errorDetails: paymentResult.error,
        fulfilledAt: status === HonoringStatus.HONORED ? Date.now() : undefined,
      };

    } catch (error) {
      const honError = error instanceof HonoringError
        ? error
        : new HonoringError(
            error instanceof Error ? error.message : 'Unknown error',
            'ARCUS_ADAPTER_ERROR',
            AnchorType.UTILITY,
            transfer.transferId,
            error
          );

      console.error('[ArcusAdapter] Error honoring claim:', honError);

      return {
        success: false,
        anchorType: AnchorType.UTILITY,
        transferId: transfer.transferId,
        status: HonoringStatus.FAILED_EXTERNAL,
        errorMessage: honError.message,
      };
    }
  }

  /**
   * Execute payment via Arcus Bill-Pay API (with retry logic)
   */
  private async executeBillPayment(params: {
    biller: ArcusBiller;
    accountNumber?: string;
    amount: number;
    transferId: string;
  }): Promise<ArcusPaymentResponse> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[ArcusAdapter] Payment attempt ${attempt}/${maxRetries} for ${params.transferId}`);

        const response = await this.callArcusAPI({
          method: 'POST',
          endpoint: '/v1/payments/billpay',
          body: {
            merchantId: this.config.merchantId,
            secretKey: this.config.secretKey,
            billerId: params.biller.billerId,
            accountNumber: params.accountNumber,
            amount: params.amount,
            currency: 'USD',
            externalReference: params.transferId,
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
          console.log(`[ArcusAdapter] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }

      } catch (error) {
        lastError = error as Error;
        console.error(`[ArcusAdapter] Attempt ${attempt} exception:`, error);

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('All retry attempts exhausted');
  }

  /**
   * Call Arcus API
   */
  private async callArcusAPI(params: {
    method: string;
    endpoint: string;
    body: any;
  }): Promise<ArcusPaymentResponse> {
    const url = `${this.config.apiUrl}${params.endpoint}`;
    const authHeader = Buffer.from(`${this.config.merchantId}:${this.config.secretKey}`).toString('base64');

    const response = await fetch(url, {
      method: params.method as any,
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
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
   * Determine if error is retryable
   */
  private isNonRetryableError(response: ArcusPaymentResponse): boolean {
    const nonRetryableCodes = [
      'AUTH_FAILED',
      'INVALID_MERCHANT',
      'INVALID_BILLER',
      'INVALID_ACCOUNT',
      'COMPLIANCE_REJECTED',
    ];

    if (response.error?.code && nonRetryableCodes.includes(response.error.code)) {
      return true;
    }

    return false;
  }

  /**
   * Generate cryptographic proof hash
   */
  private generateProofHash(paymentResult: ArcusPaymentResponse): string {
    const proofData = {
      transferId: paymentResult.paymentId,
      cep: paymentResult.cep,
      confirmationId: paymentResult.confirmationId,
      status: paymentResult.status,
      timestamp: Date.now(),
      provider: 'ARCUS',
    };

    // In production: keccak256(JSON.stringify(proofData))
    return `0x${Buffer.from(JSON.stringify(proofData)).toString('hex')}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add or update biller
   */
  addBiller(biller: ArcusBiller): void {
    this.billers.set(biller.billerId, biller);
    console.log(`[ArcusAdapter] Added biller: ${biller.name} (${biller.billerId})`);
  }

  /**
   * Get all billers
   */
  getBillers(): ArcusBiller[] {
    return Array.from(this.billers.values());
  }

  /**
   * Validate configuration
   */
  validateConfig(): boolean {
    return !!(
      this.config.merchantId &&
      this.config.secretKey &&
      this.config.apiUrl
    );
  }
}

export { ArcusUtilityAdapter, ArcusConfig, ArcusBiller, ArcusPaymentResponse };
