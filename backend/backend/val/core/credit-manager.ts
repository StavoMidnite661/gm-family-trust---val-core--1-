// SOVR Credit Manager
// Manages net-clearing and credit limits for zero-float honoring adapters
//
// =============================================================================
// SOVR CANON NOTICE
// =============================================================================
// Zero-Float: Adapters use net-clearing, not pre-funding
// Clearing: Net-basis with providers (daily/weekly/monthly)
// Credit Management: Tracks obligations vs. cleared amounts
// =============================================================================

import {
  AnchorType,
} from '../core/e2e-finality-types';
import { getNarrativeMirror, NarrativeMirrorService } from './narrative-mirror-service';

/**
 * Credit Configuration
 */
export interface CreditConfig {
  clearingIntervalMs: number;        // How often clearing occurs (default: daily)
  creditLimitMargin: number;           // Safety margin (e.g., 0.8 = use 80% of credit limit)
  minCreditThreshold: bigint;        // Minimum credit required (in micro-units)
  autoPauseThreshold: number;          // Pause when utilization exceeds this percentage (e.g., 0.95)
}

/**
 * Credit Account
 */
export interface CreditAccount {
  adapterType: AnchorType;
  providerName: string;              // e.g., 'TANGO_CARD', 'ARCUS'
  clearedBalance: bigint;             // Net-cleared balance (in micro-units)
  pendingClearing: bigint;          // Awaiting clearing
  creditLimit: bigint;               // Credit limit from provider
  lastClearingDate: number;
  status: CreditStatus;
}

/**
 * Credit Status
 */
export enum CreditStatus {
  ACTIVE = 'ACTIVE',              // Accepting new obligations
  THROTTLED = 'THROTTLED',      // Temporarily limited
  SUSPENDED = 'SUSPENDED',        // Manually paused
  BLOCKED = 'BLOCKED',             // Compliance block
}

/**
 * Clearing Batch
 */
export interface ClearingBatch {
  batchId: string;
  adapterType: AnchorType;
  providerName: string;
  periodStart: number;
  periodEnd: number;
  totalObligations: bigint;            // Sum of all transfers (in micro-units)
  clearedAmount: bigint;                // Actual amount cleared with provider
  pendingAmount: bigint;                // Uncleared amount
  clearingDate: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  providerReference?: string;            // Provider's clearing reference
}

/**
 * Credit Alert
 */
export interface CreditAlert {
  alertId: string;
  type: 'LOW_CREDIT' | 'HIGH_UTILIZATION' | 'CLEARING_PENDING' | 'PAUSED' | 'BLOCKED';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  adapterType: AnchorType;
  message: string;
  data?: Record<string, any>;
  timestamp: number;
}

/**
 * SOVR Credit Manager
 * Ensures adapters can operate with net-clearing without pre-funding
 */
export class CreditManager {
  private config: CreditConfig;
  private narrativeMirror: NarrativeMirrorService;
  private credits: Map<AnchorType, CreditAccount>;
  private activeClearings: Map<string, ClearingBatch>;
  private alerts: CreditAlert[];

  constructor(config: Partial<CreditConfig> = {}) {
    this.config = {
      clearingIntervalMs: 86400000, // 24 hours
      creditLimitMargin: 0.8,        // Use 80% of credit limit
      minCreditThreshold: 1000000n,  // $1,000 minimum credit
      autoPauseThreshold: 0.95,       // Pause at 95% utilization
      ...config,
    };

    this.narrativeMirror = getNarrativeMirror();
    this.credits = new Map();
    this.activeClearings = new Map();
    this.alerts = [];

    // Initialize credits for standard adapters
    this.initializeDefaultCredits();
  }

  /**
   * Initialize default credit accounts
   */
  private initializeDefaultCredits(): void {
    const defaultCredits: CreditAccount[] = [
      {
        adapterType: AnchorType.GROCERY,
        providerName: 'TANGO_CARD',
        settledBalance: 0n,
        pendingClearing: 0n,
        creditLimit: 100000000000n, // $100,000 in micro-units
        lastClearingDate: Date.now(),
        status: CreditStatus.ACTIVE,
      },
      {
        adapterType: AnchorType.UTILITY,
        providerName: 'ARCUS',
        settledBalance: 0n,
        pendingClearing: 0n,
        creditLimit: 50000000000n, // $50,000 in micro-units
        lastClearingDate: Date.now(),
        status: CreditStatus.ACTIVE,
      },
      {
        adapterType: AnchorType.CASH_OUT,
        providerName: 'MOOV',
        settledBalance: 0n,
        pendingClearing: 0n,
        creditLimit: 25000000000n, // $25,000 in micro-units
        lastClearingDate: Date.now(),
        status: CreditStatus.ACTIVE,
      },
    ];

    defaultCredits.forEach(credit => {
      this.credits.set(credit.adapterType, credit);
    });

    console.log('[CreditManager] Default credits initialized');
  }

  /**
   * Check if an obligation can be honored given current credits
   */
  canHonor(anchorType: AnchorType, amount: bigint): {
    canHonor: boolean;
    reason?: string;
  } {
    const credit = this.credits.get(anchorType);

    if (!credit) {
      return {
        canHonor: false,
        reason: `No credit configured for ${anchorType}`,
      };
    }

    // Calculate available credit (considering cleared vs pending)
    const availableCredit = credit.creditLimit - credit.pendingClearing - credit.clearedBalance;
    const threshold = credit.creditLimit * BigInt(Math.floor(this.config.creditLimitMargin * 100)) / 100n;

    // Check minimum credit threshold
    const remainingAfterObligation = availableCredit - amount;
    if (remainingAfterObligation < this.config.minCreditThreshold) {
      return {
        canHonor: false,
        reason: `Insufficient credit. Available: $${availableCredit / 1_000_000n}, Required: $${amount / 1_000_000n}, Min Credit: $${this.config.minCreditThreshold / 1_000_000n}`,
      };
    }

    // Check auto-pause threshold
    const utilization = amount / availableCredit;
    if (utilization >= Number(this.config.autoPauseThreshold)) {
      return {
        canHonor: false,
        reason: `Auto-pause threshold reached. Utilization: ${(utilization * 100).toFixed(1)}%`,
      };
    }

    return { canHonor: true };
  }

  /**
   * Record an obligation (debit from credit)
   */
  recordObligation(anchorType: AnchorType, amount: bigint, transferId: string): void {
    const credit = this.credits.get(anchorType);

    if (!credit) {
      console.error(`[CreditManager] Cannot record obligation - no credit for ${anchorType}`);
      return;
    }

    credit.pendingClearing += amount;

    console.log(`[CreditManager] Obligation recorded: ${transferId}, Amount: $${amount / 1_000_000n}`);

    this.checkUtilizationAndAlert(anchorType);
  }

  /**
   * Record a clearing (credit to account)
   */
  recordClearing(
    anchorType: AnchorType,
    amount: bigint,
    providerReference?: string
  ): void {
    const credit = this.credits.get(anchorType);

    if (!credit) {
      console.error(`[CreditManager] Cannot record clearing - no credit for ${anchorType}`);
      return;
    }

    // Reduce pending clearing and increase cleared balance
    credit.pendingClearing -= amount;
    credit.clearedBalance += amount;
    credit.lastClearingDate = Date.now();

    console.log(`[CreditManager] Clearing recorded: $${amount / 1_000_000n}, Provider Ref: ${providerReference}`);

    this.checkUtilizationAndAlert(anchorType);
  }

  /**
   * Check utilization and generate alerts
   */
  private checkUtilizationAndAlert(anchorType: AnchorType): void {
    const credit = this.credits.get(anchorType);

    if (!credit) {
      return;
    }

    const availableCredit = credit.creditLimit - credit.pendingClearing - credit.clearedBalance;
    const utilization = availableCredit === 0n
      ? 0
      : Number(credit.clearedBalance) / Number(credit.creditLimit);

    // Generate alert based on thresholds
    if (utilization >= 0.9) {
      this.createAlert({
        type: 'HIGH_UTILIZATION',
        severity: 'WARNING',
        anchorType,
        message: `High utilization: ${(utilization * 100).toFixed(1)}%`,
        data: {
          utilization,
          clearedBalance: credit.clearedBalance.toString(),
          pendingClearing: credit.pendingClearing.toString(),
        },
      });
    }

    if (utilization >= 0.95) {
      this.createAlert({
        type: 'PAUSED',
        severity: 'CRITICAL',
        anchorType,
        message: `Auto-pause threshold exceeded: ${(utilization * 100).toFixed(1)}%`,
        data: { utilization },
      });
    }
  }

  /**
   * Create and store alert
   */
  private createAlert(alert: Omit<CreditAlert, 'alertId'>): void {
    const alertData: CreditAlert = {
      alertId: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      ...alert,
    };

    this.alerts.push(alertData);

    console.log(`[CreditManager] Alert created: ${alertData.type} - ${alertData.message}`);

    // Record to narrative mirror
    this.narrativeMirror.recordCreditAlert(alertData).catch(error => {
      console.error('[CreditManager] Failed to record alert:', error);
    });
  }

  /**
   * Create a clearing batch for net-clearing
   */
  createClearingBatch(
    adapterType: AnchorType,
    periodStart: number,
    periodEnd: number
  ): ClearingBatch {
    const credit = this.credits.get(adapterType);

    if (!credit) {
      throw new Error(`No credit configured for ${adapterType}`);
    }

    const batch: ClearingBatch = {
      batchId: `CLEAR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      adapterType,
      providerName: credit.providerName,
      periodStart,
      periodEnd,
      totalObligations: credit.pendingClearing,
      clearedAmount: 0n, // Will be updated as clearings occur
      pendingAmount: credit.pendingClearing,
      clearingDate: 0,
      status: 'PENDING',
    };

    this.activeClearings.set(batch.batchId, batch);

    console.log(`[CreditManager] Clearing batch created: ${batch.batchId}`);

    return batch;
  }

  /**
   * Process clearing batch
   */
  async processClearingBatch(batchId: string): Promise<void> {
    const batch = this.activeClearings.get(batchId);

    if (!batch) {
      throw new Error(`Clearing batch ${batchId} not found`);
    }

    console.log(`[CreditManager] Processing clearing batch: ${batchId}`);

    batch.status = 'PROCESSING';
    this.activeClearings.set(batchId, batch);

    try {
      // TODO: Call provider's clearing API
      // For now, simulate clearing
      await this.sleep(2000);

      // Update credit
      const credit = this.credits.get(batch.adapterType);
      if (credit) {
        const clearedAmount = batch.totalObligations - batch.pendingAmount;
        credit.pendingClearing -= clearedAmount;
        credit.clearedBalance += clearedAmount;
      }

      batch.status = 'COMPLETED';
      batch.clearingDate = Date.now();
      batch.pendingAmount = 0n;

      this.activeClearings.set(batchId, batch);

      console.log(`[CreditManager] Clearing batch completed: ${batchId}`);

    } catch (error) {
      console.error(`[CreditManager] Clearing batch failed: ${batchId}`, error);

      batch.status = 'FAILED';

      this.activeClearings.set(batchId, batch);

      this.createAlert({
        type: 'CLEARING_PENDING',
        severity: 'CRITICAL',
        anchorType: batch.adapterType,
        message: `Clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { batchId, error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  /**
   * Get credit status for all adapters
   */
  getAllCredits(): CreditAccount[] {
    return Array.from(this.credits.values());
  }

  /**
   * Get credit for specific adapter type
   */
  getCredit(anchorType: AnchorType): CreditAccount | undefined {
    return this.credits.get(anchorType);
  }

  /**
   * Get active clearings
   */
  getActiveClearings(): ClearingBatch[] {
    return Array.from(this.activeClearings.values());
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit?: number): CreditAlert[] {
    if (limit) {
      return this.alerts.slice(-limit);
    }
    return this.alerts.slice(-50); // Last 50 alerts
  }

  /**
   * Pause an adapter (manual or auto)
   */
  pauseAdapter(anchorType: AnchorType, reason: string): void {
    const credit = this.credits.get(anchorType);

    if (!credit) {
      console.warn(`[CreditManager] Cannot pause - no credit for ${anchorType}`);
      return;
    }

    credit.status = CreditStatus.SUSPENDED;

    this.createAlert({
      type: 'PAUSED',
      severity: 'WARNING',
      anchorType,
      message: `Adapter paused: ${reason}`,
      data: { reason },
    });

    console.log(`[CreditManager] Adapter ${anchorType} paused: ${reason}`);
  }

  /**
   * Resume a paused adapter
   */
  resumeAdapter(anchorType: AnchorType, reason: string): void {
    const credit = this.credits.get(anchorType);

    if (!credit) {
      console.warn(`[CreditManager] Cannot resume - no credit for ${anchorType}`);
      return;
    }

    credit.status = CreditStatus.ACTIVE;

    console.log(`[CreditManager] Adapter ${anchorType} resumed: ${reason}`);
  }

  /**
   * Update credit configuration
   */
  updateCredit(anchorType: AnchorType, updates: Partial<CreditAccount>): void {
    const credit = this.credits.get(anchorType);

    if (!credit) {
      console.warn(`[CreditManager] Cannot update - no credit for ${anchorType}`);
      return;
    }

    Object.assign(credit, updates);
    this.credits.set(anchorType, credit);

    console.log(`[CreditManager] Credit updated for ${anchorType}:`, updates);
  }

  /**
   * Start clearing timer
   */
  startClearingTimer(): void {
    console.log(`[CreditManager] Clearing timer started (interval: ${this.config.clearingIntervalMs}ms)`);

    setInterval(async () => {
      console.log('[CreditManager] Running clearing cycle...');

      for (const [anchorType, credit] of this.credits.entries()) {
        if (credit.pendingClearing > 0) {
          try {
            const batch = this.createClearingBatch(
              anchorType,
              Date.now() - this.config.clearingIntervalMs,
              Date.now()
            );

            await this.processClearingBatch(batch.batchId);

          } catch (error) {
            console.error(`[CreditManager] Clearing failed for ${anchorType}:`, error);
          }
        }
      }

    }, this.config.clearingIntervalMs);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export { CreditManager, CreditConfig, CreditAccount, ClearingBatch, CreditAlert, CreditStatus };
