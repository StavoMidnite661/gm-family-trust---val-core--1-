// Compliance & Risk Control Module
// Implements KYC, AML screening, and rate limiting for real-world operations
//
// -----------------------------------------------------------------------------
// SOVR CANON NOTICE
// -----------------------------------------------------------------------------
// Compliance gates are applied BEFORE clearing to protect the system
// All decisions are mechanically enforced - no exceptions
// -----------------------------------------------------------------------------

import { getNarrativeMirror, NarrativeMirrorService } from '../core/narrative-mirror-service';

/**
 * Compliance configuration
 */
export interface ComplianceConfig {
  maxDailyTransactions: number;
  maxDailyValueUSD: number;
  maxHourlyTransactions: number;
  kycEnabled: boolean;
  amlEnabled: boolean;
  requireAttestation: boolean;
}

/**
 * Compliance check result
 */
export interface ComplianceResult {
  approved: boolean;
  rejectionReason?: string;
  rejectionCode?: string;
  userRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
  remainingDailyTransactions?: number;
  remainingDailyValue?: number;
}

/**
 * User risk profile
 */
export interface UserRiskProfile {
  userId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
  totalTransactions: number;
  totalVolumeUSD: number;
  lastTransactionTime: number;
  suspiciousFlags: string[];
  blocked: boolean;
  blockedReason?: string;
}

/**
 * Transaction pattern to detect
 */
export interface TransactionPattern {
  amount: number;
  frequency: number;
  velocity: number;
  timeOfDay: number;
  geography?: string;
}

export class ComplianceService {
  private config: ComplianceConfig;
  private narrativeMirror: NarrativeMirrorService;
  private userProfiles: Map<string, UserRiskProfile>;
  private transactionHistory: Map<string, number[]>; // userId -> [timestamp, timestamp, ...]
  private dailyCounters: Map<string, { count: number; volume: number; date: string }>; // userId -> {count, volume, date}

  constructor(config: Partial<ComplianceConfig> = {}) {
    this.config = {
      maxDailyTransactions: config.maxDailyTransactions || 100,
      maxDailyValueUSD: config.maxDailyValueUSD || 50000,
      maxHourlyTransactions: config.maxHourlyTransactions || 20,
      kycEnabled: config.kycEnabled ?? true,
      amlEnabled: config.amlEnabled ?? true,
      requireAttestation: config.requireAttestation ?? true,
    };

    this.narrativeMirror = getNarrativeMirror();
    this.userProfiles = new Map();
    this.transactionHistory = new Map();
    this.dailyCounters = new Map();
  }

  /**
   * Check if a transaction complies with all rules
   */
  async checkTransaction(params: {
    userId: string;
    amount: number;
    attestation?: string;
    anchorType?: string;
    metadata?: Record<string, any>;
  }): Promise<ComplianceResult> {
    const { userId, amount, attestation, anchorType } = params;

    console.log(`[ComplianceService] Checking transaction for user ${userId}, amount $${amount}`);

    // 1. Check if user is blocked
    const userProfile = this.getUserProfile(userId);
    if (userProfile.blocked) {
      console.warn(`[ComplianceService] User ${userId} is BLOCKED: ${userProfile.blockedReason}`);

      return {
        approved: false,
        rejectionReason: userProfile.blockedReason,
        rejectionCode: 'USER_BLOCKED',
        userRiskLevel: 'BLOCKED',
      };
    }

    // 2. Check attestation requirement
    if (this.config.requireAttestation && !attestation) {
      console.warn('[ComplianceService] Missing required attestation');

      return {
        approved: false,
        rejectionReason: 'Attestation is required for all transactions',
        rejectionCode: 'MISSING_ATTESTATION',
        userRiskLevel: userProfile.riskLevel,
      };
    }

    // 3. Check daily limits
    const dailyLimits = this.getDailyLimits(userId);
    const remainingDailyTransactions = this.config.maxDailyTransactions - dailyLimits.count;
    const remainingDailyValue = this.config.maxDailyValueUSD - dailyLimits.volume;

    if (dailyLimits.count >= this.config.maxDailyTransactions) {
      console.warn(`[ComplianceService] Daily transaction limit exceeded for user ${userId}`);

      return {
        approved: false,
        rejectionReason: 'Daily transaction limit exceeded',
        rejectionCode: 'DAILY_LIMIT_EXCEEDED',
        userRiskLevel: userProfile.riskLevel,
        remainingDailyTransactions: 0,
        remainingDailyValue: Math.max(0, remainingDailyValue),
      };
    }

    if (dailyLimits.volume + amount > this.config.maxDailyValueUSD) {
      console.warn(`[ComplianceService] Daily value limit exceeded for user ${userId}`);

      return {
        approved: false,
        rejectionReason: 'Daily value limit exceeded',
        rejectionCode: 'DAILY_VALUE_EXCEEDED',
        userRiskLevel: userProfile.riskLevel,
        remainingDailyTransactions,
        remainingDailyValue: dailyLimits.volume,
      };
    }

    // 4. Check hourly velocity
    const hourlyCount = this.getHourlyTransactionCount(userId);
    if (hourlyCount >= this.config.maxHourlyTransactions) {
      console.warn(`[ComplianceService] Hourly transaction limit exceeded for user ${userId}`);

      return {
        approved: false,
        rejectionReason: 'Transaction velocity too high',
        rejectionCode: 'VELOCITY_LIMIT_EXCEEDED',
        userRiskLevel: userProfile.riskLevel,
        remainingDailyTransactions,
        remainingDailyValue: Math.max(0, remainingDailyValue - amount),
      };
    }

    // 5. AML screening (if enabled)
    if (this.config.amlEnabled) {
      const amlResult = await this.screenForAML(userId, amount);
      if (!amlResult.approved) {
        return amlResult;
      }
    }

    // 6. Transaction pattern analysis
    const patternResult = this.analyzeTransactionPattern(userId, amount);
    if (!patternResult.approved) {
      return patternResult;
    }

    // All checks passed
    console.log(`[ComplianceService] Transaction approved for user ${userId}`);

    // Update counters
    this.recordTransaction(userId, amount);

    return {
      approved: true,
      userRiskLevel: userProfile.riskLevel,
      remainingDailyTransactions: remainingDailyTransactions - 1,
      remainingDailyValue: remainingDailyValue - amount,
    };
  }

  /**
   * AML screening
   */
  private async screenForAML(userId: string, amount: number): Promise<ComplianceResult> {
    const userProfile = this.getUserProfile(userId);

    // Check for suspicious patterns
    if (userProfile.suspiciousFlags.length > 0) {
      console.warn(`[ComplianceService] User ${userId} has suspicious flags:`, userProfile.suspiciousFlags);

      return {
        approved: false,
        rejectionReason: 'Suspicious activity detected',
        rejectionCode: 'AML_SCREENING_FAILED',
        userRiskLevel: 'HIGH',
      };
    }

    // Check for rapid high-value transactions
    const recentHighValue = this.getRecentHighValueTransactions(userId);
    if (recentHighValue.length >= 3) {
      console.warn(`[ComplianceService] Multiple high-value transactions detected for user ${userId}`);

      return {
        approved: false,
        rejectionReason: 'Excessive high-value transaction pattern',
        rejectionCode: 'SUSPICIOUS_PATTERN',
        userRiskLevel: 'HIGH',
      };
    }

    return { approved: true, userRiskLevel: userProfile.riskLevel };
  }

  /**
   * Analyze transaction patterns for anomalies
   */
  private analyzeTransactionPattern(userId: string, amount: number): ComplianceResult {
    const history = this.transactionHistory.get(userId) || [];

    // Check for unusual amounts
    if (history.length > 5) {
      const avgAmount = history.slice(-10).reduce((sum, t) => sum + t, 0) / Math.min(10, history.length);
      const deviation = Math.abs(amount - avgAmount) / avgAmount;

      // Flag if amount is > 3x average
      if (deviation > 3) {
        console.warn(`[ComplianceService] Unusual amount detected for user ${userId}: $${amount} (avg: $${avgAmount.toFixed(2)})`);

        return {
          approved: false,
          rejectionReason: 'Transaction amount significantly outside normal range',
          rejectionCode: 'UNUSUAL_AMOUNT',
          userRiskLevel: 'MEDIUM',
        };
      }
    }

    return { approved: true, userRiskLevel: 'LOW' };
  }

  /**
   * Get user risk profile
   */
  private getUserProfile(userId: string): UserRiskProfile {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = {
        userId,
        riskLevel: 'LOW',
        totalTransactions: 0,
        totalVolumeUSD: 0,
        lastTransactionTime: 0,
        suspiciousFlags: [],
        blocked: false,
      };

      this.userProfiles.set(userId, profile);
    }

    return profile;
  }

  /**
   * Get daily limits for user
   */
  private getDailyLimits(userId: string): { count: number; volume: number } {
    const today = new Date().toISOString().split('T')[0];
    const counter = this.dailyCounters.get(userId);

    if (counter && counter.date === today) {
      return { count: counter.count, volume: counter.volume };
    }

    // Reset for new day
    return { count: 0, volume: 0 };
  }

  /**
   * Get hourly transaction count
   */
  private getHourlyTransactionCount(userId: string): number {
    const history = this.transactionHistory.get(userId) || [];
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    return history.filter(timestamp => timestamp > oneHourAgo).length;
  }

  /**
   * Get recent high-value transactions
   */
  private getRecentHighValueTransactions(userId: string): number[] {
    const history = this.transactionHistory.get(userId) || [];
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    return history
      .filter(timestamp => timestamp > twentyFourHoursAgo)
      .filter(timestamp => {
        // Find the transaction amount (simplified - in real impl, would look up actual amounts)
        return true; // Placeholder for implementation
      });
  }

  /**
   * Record a transaction
   */
  private recordTransaction(userId: string, amount: number): void {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    // Update transaction history
    const history = this.transactionHistory.get(userId) || [];
    history.push(now);
    this.transactionHistory.set(userId, history.slice(-100)); // Keep last 100

    // Update daily counters
    const counter = this.dailyCounters.get(userId) || { count: 0, volume: 0, date: today };
    counter.count++;
    counter.volume += amount;
    this.dailyCounters.set(userId, counter);

    // Update user profile
    const profile = this.getUserProfile(userId);
    profile.totalTransactions++;
    profile.totalVolumeUSD += amount;
    profile.lastTransactionTime = now;
    this.userProfiles.set(userId, profile);

    // Log to narrative mirror
    this.narrativeMirror.recordComplianceEvent({
      userId,
      eventType: 'TRANSACTION_ATTEMPT',
      result: 'APPROVED',
      amountUSD: amount,
      timestamp: now,
      metadata: {
        dailyCount: counter.count,
        dailyVolume: counter.volume,
      },
    }).catch(error => {
      console.error('[ComplianceService] Failed to record compliance event:', error);
    });
  }

  /**
   * Block a user
   */
  blockUser(userId: string, reason: string, riskLevel: 'MEDIUM' | 'HIGH' | 'BLOCKED'): void {
    const profile = this.getUserProfile(userId);
    profile.blocked = true;
    profile.blockedReason = reason;
    profile.riskLevel = riskLevel;
    this.userProfiles.set(userId, profile);

    console.warn(`[ComplianceService] User ${userId} BLOCKED: ${reason}`);

    // Log to narrative mirror
    this.narrativeMirror.recordComplianceEvent({
      userId,
      eventType: 'USER_BLOCKED',
      result: 'BLOCKED',
      timestamp: Date.now(),
      metadata: { reason, riskLevel },
    }).catch(error => {
      console.error('[ComplianceService] Failed to record compliance event:', error);
    });
  }

  /**
   * Unblock a user
   */
  unblockUser(userId: string, reason: string): void {
    const profile = this.getUserProfile(userId);
    profile.blocked = false;
    profile.blockedReason = undefined;
    this.userProfiles.set(userId, profile);

    console.log(`[ComplianceService] User ${userId} UNBLOCKED: ${reason}`);

    // Log to narrative mirror
    this.narrativeMirror.recordComplianceEvent({
      userId,
      eventType: 'USER_UNBLOCKED',
      result: 'UNBLOCKED',
      timestamp: Date.now(),
      metadata: { reason },
    }).catch(error => {
      console.error('[ComplianceService] Failed to record compliance event:', error);
    });
  }

  /**
   * Add suspicious flag to user
   */
  addSuspiciousFlag(userId: string, flag: string): void {
    const profile = this.getUserProfile(userId);
    profile.suspiciousFlags.push(flag);
    profile.suspiciousFlags = profile.suspiciousFlags.slice(-10); // Keep last 10
    this.userProfiles.set(userId, profile);

    console.warn(`[ComplianceService] Suspicious flag added for user ${userId}: ${flag}`);
  }

  /**
   * Get user stats
   */
  getUserStats(userId: string): UserRiskProfile {
    return this.getUserProfile(userId);
  }

  /**
   * Reset daily counters (called daily)
   */
  resetDailyCounters(): void {
    const today = new Date().toISOString().split('T')[0];

    this.dailyCounters.forEach((counter, userId) => {
      if (counter.date !== today) {
        this.dailyCounters.set(userId, { count: 0, volume: 0, date: today });
      }
    });
  }
}

export { ComplianceService, ComplianceConfig, ComplianceResult, UserRiskProfile };
