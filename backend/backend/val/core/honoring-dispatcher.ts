// SOVR Multi-Adapter Dispatcher
// Bridges Mechanical Truth (TigerBeetle) to Optional External Honoring
//
// =============================================================================
// SOVR CANON NOTICE
// =============================================================================
// E2E Finality: System remains sovereign. TigerBeetle clearing is FINAL.
// External honoring is OPTIONAL. External failures NEVER reverse clearing.
// =============================================================================

import {
  AnchorType,
  ClearedTransfer,
  ExternalAdapter,
  HonoringResult,
  HonoringStatus,
  HonoringConfig,
  HonoringError,
  DispatchRequest,
  DispatchResponse,
} from './e2e-finality-types';
import { getNarrativeMirror, NarrativeMirrorService } from './narrative-mirror-service';

/**
 * SOVR Multi-Adapter Dispatcher
 * Routes cleared obligations to appropriate honoring adapters
 */
export class HonoringDispatcher {
  private adapters: Map<AnchorType, ExternalAdapter>;
  private config: HonoringConfig;
  private narrativeMirror: NarrativeMirrorService;
  private dispatchQueue: Map<string, DispatchRequest>;
  private activeDispatches: Set<string>;

  constructor(config: Partial<HonoringConfig> = {}) {
    // Initialize with sensible defaults
    this.config = {
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      timeoutMs: 30000,
      enableParallel: false,
      ...config,
    };

    this.adapters = new Map();
    this.dispatchQueue = new Map();
    this.activeDispatches = new Set();
    this.narrativeMirror = getNarrativeMirror();
  }

  /**
   * Register an honoring adapter for a specific anchor type
   */
  registerAdapter(adapter: ExternalAdapter): void {
    this.adapters.set(adapter.anchorType, adapter);
    console.log(`[Dispatcher] Registered ${adapter.adapterName} for ${adapter.anchorType}`);
  }

  /**
   * Unregister an adapter
   */
  unregisterAdapter(anchorType: AnchorType): void {
    this.adapters.delete(anchorType);
    console.log(`[Dispatcher] Unregistered adapter for ${anchorType}`);
  }

  /**
   * Dispatch a cleared transfer to the appropriate honoring adapter
   * This is the MAIN entry point for E2E finality
   */
  async dispatch(request: DispatchRequest): Promise<DispatchResponse> {
    const { transfer } = request;
    const requestId = `DISP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    console.log(`[Dispatcher] Dispatching transfer ${transfer.transferId} to ${transfer.anchorType}`);

    // Check if adapter exists
    const adapter = this.adapters.get(transfer.anchorType);

    if (!adapter) {
      console.error(`[Dispatcher] No adapter registered for ${transfer.anchorType}`);

      const errorMsg = `No honoring adapter available for ${transfer.anchorType}`;
      await this.recordDispatchFailure(requestId, transfer, errorMsg);

      return {
        requestId,
        transferId: transfer.transferId,
        status: HonoringStatus.REJECTED,
        errorMessage: errorMsg,
      };
    }

    // Check for duplicate dispatch (idempotency)
    if (this.activeDispatches.has(transfer.transferId)) {
      console.warn(`[Dispatcher] Transfer ${transfer.transferId} already being processed`);

      return {
        requestId,
        transferId: transfer.transferId,
        status: HonoringStatus.PENDING,
        estimatedCompletion: Date.now() + 60000, // 1 minute
        queuePosition: this.getQueuePosition(transfer.transferId),
      };
    }

    // Queue the dispatch
    this.dispatchQueue.set(requestId, request);
    this.activeDispatches.add(transfer.transferId);

    try {
      // Execute adapter with retry logic
      const result = await this.executeWithRetry(adapter, transfer);

      // Remove from active dispatches
      this.activeDispatches.delete(transfer.transferId);

      // Record finality event
      await this.recordFinalityEvent(transfer, result);

      // Update queue
      this.dispatchQueue.delete(requestId);

      return {
        requestId,
        transferId: transfer.transferId,
        status: result.status,
        estimatedCompletion: result.fulfilledAt,
      };

    } catch (error: any) {
      this.activeDispatches.delete(transfer.transferId);
      this.dispatchQueue.delete(requestId);

      const honError = error instanceof HonoringError
        ? error
        : new HonoringError(error.message, 'DISPATCH_ERROR', transfer.anchorType, transfer.transferId);

      console.error(`[Dispatcher] Dispatch failed:`, honError);

      await this.recordDispatchFailure(requestId, transfer, error.message);

      return {
        requestId,
        transferId: transfer.transferId,
        status: HonoringStatus.FAILED_EXTERNAL,
        errorMessage: honError.message,
      };
    }
  }

  /**
   * Execute adapter with automatic retry logic
   */
  private async executeWithRetry(
    adapter: ExternalAdapter,
    transfer: ClearedTransfer
  ): Promise<HonoringResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetryAttempts; attempt++) {
      try {
        console.log(`[Dispatcher] Attempt ${attempt}/${this.config.maxRetryAttempts} for ${transfer.transferId}`);

        const result = await adapter.honorClaim(transfer);

        // Check if result is definitive (success or non-retryable failure)
        if (result.success || !this.isRetryable(result)) {
          return result;
        }

        lastError = new Error(result.errorMessage || 'Unknown error');

      } catch (error) {
        lastError = error as Error;
        console.error(`[Dispatcher] Attempt ${attempt} error:`, error);
      }

      // Wait before retry (exponential backoff)
      if (attempt < this.config.maxRetryAttempts) {
        const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1);
        const cappedDelay = Math.min(delay, 10000); // Max 10s between retries

        console.log(`[Dispatcher] Retrying in ${cappedDelay}ms...`);
        await this.sleep(cappedDelay);
      }
    }

    // All retries failed
    throw lastError || new Error('All retry attempts exhausted');
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryable(result: HonoringResult): boolean {
    // Non-retryable errors
    const nonRetryableCodes = [
      'AUTH_FAILED',
      'INVALID_ACCOUNT',
      'INSUFFICIENT_FUNDS',
      'COMPLIANCE_REJECTION',
      'PERMANENT_FAILURE',
    ];

    if (result.errorMessage && nonRetryableCodes.some(code => result.errorMessage.includes(code))) {
      return false;
    }

    // Timeout and network errors are retryable
    if ([HonoringStatus.EXPIRED, HonoringStatus.FAILED_EXTERNAL].includes(result.status)) {
      return true;
    }

    return false;
  }

  /**
   * Record finality event in Narrative Mirror
   */
  private async recordFinalityEvent(
    transfer: ClearedTransfer,
    result: HonoringResult
  ): Promise<void> {
    try {
      const event = {
        eventId: `E2E-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        transferId: transfer.transferId,
        anchorType: transfer.anchorType,
        userId: transfer.userAddress,
        amount: transfer.amount,
        status: result.status,
        externalId: result.externalId,
        proofHash: result.proofHash,
        fulfilledAt: result.fulfilledAt,
        metadata: {
          errorMessage: result.errorMessage,
          errorDetails: result.errorDetails,
          adapterName: this.adapters.get(transfer.anchorType)?.adapterName,
        },
        timestamp: Date.now(),
      };

      await this.narrativeMirror.recordE2EFinalityEvent(event);

      console.log(`[Dispatcher] E2E event recorded: ${event.eventId}`);

    } catch (error) {
      console.error('[Dispatcher] Failed to record finality event:', error);
    }
  }

  /**
   * Record dispatch failure
   */
  private async recordDispatchFailure(
    requestId: string,
    transfer: ClearedTransfer,
    error: string
  ): Promise<void> {
    try {
      await this.narrativeMirror.recordE2EFinalityEvent({
        eventId: `E2E-FAIL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        transferId: transfer.transferId,
        anchorType: transfer.anchorType,
        userId: transfer.userAddress,
        amount: transfer.amount,
        status: HonoringStatus.REJECTED,
        errorMessage: error,
        timestamp: Date.now(),
      } as any);
    } catch (err) {
      console.error('[Dispatcher] Failed to record dispatch failure:', err);
    }
  }

  /**
   * Get queue position for monitoring
   */
  private getQueuePosition(transferId: string): number {
    const entries = Array.from(this.dispatchQueue.entries());
    const position = entries.findIndex(([_, req]) => req.transfer.transferId === transferId);

    return position >= 0 ? position + 1 : 0;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get dispatch statistics
   */
  getStatistics(): {
    activeDispatches: number;
    queuedDispatches: number;
    registeredAdapters: number;
    adapterStatus: Record<string, { active: boolean; type: AnchorType }>;
  } {
    const adapterStatus: Record<string, { active: boolean; type: AnchorType }> = {};

    for (const [type, adapter] of this.adapters.entries()) {
      adapterStatus[adapter.adapterName] = {
        active: this.activeDispatches.has(type),
        type,
      };
    }

    return {
      activeDispatches: this.activeDispatches.size,
      queuedDispatches: this.dispatchQueue.size - this.activeDispatches.size,
      registeredAdapters: this.adapters.size,
      adapterStatus,
    };
  }

  /**
   * Enable/disable an adapter dynamically
   */
  setAdapterEnabled(anchorType: AnchorType, enabled: boolean): void {
    const adapter = this.adapters.get(anchorType);

    if (!adapter) {
      console.warn(`[Dispatcher] Cannot set enabled for ${anchorType} - adapter not found`);
      return;
    }

    // This would need to be implemented on the adapter interface
    console.log(`[Dispatcher] Setting ${anchorType} adapter enabled=${enabled}`);
  }
}

export { HonoringDispatcher };
