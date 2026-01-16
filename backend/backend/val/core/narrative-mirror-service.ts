/**
 * ⚠️ NARRATIVE MIRROR SERVICE - NOT A LEDGER ⚠️ (DOCTRINE ALIGNED)
 * 
 * AUTHORITY LEVEL: ZERO
 * 
 * This service is an OBSERVER ONLY. It records cleared events from TigerBeetle.
 * It has NO clearing authority. It CANNOT override mechanical truth.
 * 
 * HIERARCHY:
 * 1. TigerBeetle = SOLE CLEARING AUTHORITY (mechanical truth)
 * 2. This service = Narrative Mirror (observation only)
 */

import { Pool, PoolConfig } from 'pg';
import type {
  INarrativeMirror,
  RecordNarrativeEntryRequest,
  RecordNarrativeEntryResponse,
  NarrativeEntry,
  AnchorAuthorization,
  AnchorType,
  NarrativeLine,
} from '../shared/narrative-mirror-bridge';

import {
  NARRATIVE_ACCOUNTS,
  createAnchorAuthorizationEntry,
  createAnchorFulfillmentEntry,
  createAnchorExpiryObservationEntry,
  createAttestationEntry,
} from '../shared/narrative-mirror-bridge';

// =============================================================================
// CONFIGURATION
// =============================================================================

interface NarrativeMirrorConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  postgres?: PoolConfig;
}

const DEFAULT_CONFIG: NarrativeMirrorConfig = {
  baseUrl: process.env.NARRATIVE_MIRROR_URL || 'http://localhost:3001',
  apiKey: process.env.NARRATIVE_MIRROR_API_KEY,
  timeout: 30000,
  postgres: process.env.POSTGRES_URL ? { connectionString: process.env.POSTGRES_URL } : {
    user: process.env.POSTGRES_USER || 'sovr_admin',
    password: process.env.POSTGRES_PASSWORD || 'sovereignty_is_mechanical',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'sovr_narrative',
  }
};

// =============================================================================
// NARRATIVE MIRROR IMPLEMENTATION (OBSERVER ONLY)
// =============================================================================

export class NarrativeMirrorService implements INarrativeMirror {
  private config: NarrativeMirrorConfig;
  private narrativeIdCounter: number = 0;
  private pool: Pool | null = null;
  private isPostgresConnected: boolean = false;
  
  // Memory fallback storage (observation records, NOT authoritative balances)
  private narrativeRecords: Map<string, NarrativeEntry> = new Map();
  private observedBalances: Map<number, bigint> = new Map();

  constructor(config: Partial<NarrativeMirrorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeObservedBalances();
    this.initializePostgres();
  }

  private async initializePostgres() {
    try {
      this.pool = new Pool(this.config.postgres);
      const client = await this.pool.connect();
      this.isPostgresConnected = true;
      console.log('[NARRATIVE MIRROR] Connected to Postgres Narrative Storage');
      client.release();
    } catch (e) {
      console.warn('[NARRATIVE MIRROR] Postgres connection failed, falling back to memory:', e);
      this.isPostgresConnected = false;
    }
  }

  private initializeObservedBalances(): void {
    // These are OBSERVED values, not authoritative
    this.observedBalances.set(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI, 5000000000n);
    this.observedBalances.set(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, 2500000000n);
    this.observedBalances.set(NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_GROCERY_OBLIGATION, 0n);
  }

  private generateNarrativeId(): string {
    this.narrativeIdCounter++;
    return `NM-${Date.now()}-${this.narrativeIdCounter.toString().padStart(4, '0')}`;
  }

  // ===========================================================================
  // NARRATIVE RECORDING (OBSERVATION ONLY - NEVER AUTHORITATIVE)
  // ===========================================================================

  private stringifyWithBigInt(obj: any): string {
    return JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  }

  async recordNarrativeEntry(
    request: RecordNarrativeEntryRequest
  ): Promise<RecordNarrativeEntryResponse> {
    try {
      // Validate narrative consistency (debits must equal credits for double-entry recording)
      const totalDebits = request.lines
        .filter(l => l.type === 'DEBIT')
        .reduce((sum, l) => sum + l.amount, 0n);
      
      const totalCredits = request.lines
        .filter(l => l.type === 'CREDIT')
        .reduce((sum, l) => sum + l.amount, 0n);

      if (totalDebits !== totalCredits) {
        return {
          success: false,
          error: `Narrative record does not balance: Debits=${totalDebits}, Credits=${totalCredits}`,
        };
      }

      // Record the narrative entry observation
      const narrativeEntry: NarrativeEntry = {
        id: this.generateNarrativeId(),
        date: new Date().toISOString().split('T')[0],
        description: request.description,
        lines: request.lines,
        source: request.source,
        status: request.status || 'OBSERVED',
        txHash: request.txHash,
        blockNumber: request.blockNumber,
        eventId: request.eventId,
        attestationHash: request.attestationHash,
        userId: request.userId
      };

      if (this.isPostgresConnected && this.pool) {
        // Persist to Postgres
        const client = await this.pool.connect();
        try {
          await client.query('BEGIN');
          
          await client.query(
            `INSERT INTO journal_entries 
            (id, date, description, source, status, event_id, user_id, attestation_hash, tx_hash, raw_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              narrativeEntry.id,
              narrativeEntry.date,
              narrativeEntry.description,
              narrativeEntry.source,
              narrativeEntry.status,
              narrativeEntry.eventId,
              narrativeEntry.userId,
              narrativeEntry.attestationHash,
              narrativeEntry.txHash,
              this.stringifyWithBigInt(narrativeEntry)
            ]
          );

          for (const line of narrativeEntry.lines) {
            await client.query(
              `INSERT INTO journal_lines (journal_id, account_id, type, amount) VALUES ($1, $2, $3, $4)`,
              [narrativeEntry.id, line.accountId, line.type, line.amount.toString()]
            );
          }

          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK');
          console.error('[NARRATIVE MIRROR] Postgres write failed:', e);
          throw e;
        } finally {
          client.release();
        }
      } 
      
      // Always update in-memory cache/fallback
      this.narrativeRecords.set(narrativeEntry.id, narrativeEntry);

      // Update observed balances (NOT authoritative)
      for (const line of narrativeEntry.lines) {
        const observed = this.observedBalances.get(line.accountId) || 0n;
        const delta = line.type === 'DEBIT' ? line.amount : -line.amount;
        this.observedBalances.set(line.accountId, observed + delta);
      }

      console.log(`[NARRATIVE MIRROR] Recorded cleared event observation: ${narrativeEntry.id}`);

      return {
        success: true,
        narrativeEntryId: narrativeEntry.id,
      };
    } catch (error) {
      console.error('[NARRATIVE MIRROR] Error recording event observation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getNarrativeEntry(id: string): Promise<NarrativeEntry | null> {
    if (this.isPostgresConnected && this.pool) {
      const res = await this.pool.query('SELECT raw_data FROM journal_entries WHERE id = $1', [id]);
      if (res.rows.length > 0) {
        const entry = res.rows[0].raw_data;
        // Rehydrate BigInts from JSON string
        entry.lines = entry.lines.map((l: any) => ({ ...l, amount: BigInt(l.amount) }));
        return entry;
      }
      return null;
    }
    return this.narrativeRecords.get(id) || null;
  }

  async getNarrativeEntriesByEventId(eventId: string): Promise<NarrativeEntry[]> {
    if (this.isPostgresConnected && this.pool) {
      const res = await this.pool.query('SELECT raw_data FROM journal_entries WHERE event_id = $1', [eventId]);
      return res.rows.map(row => {
        const entry = row.raw_data;
        entry.lines = entry.lines.map((l: any) => ({ ...l, amount: BigInt(l.amount) }));
        return entry;
      });
    }
    return Array.from(this.narrativeRecords.values())
      .filter(entry => entry.eventId === eventId);
  }

  async getAllNarrativeEntries(): Promise<NarrativeEntry[]> {
    if (this.isPostgresConnected && this.pool) {
      const res = await this.pool.query('SELECT raw_data FROM journal_entries ORDER BY date DESC, created_at DESC LIMIT 100');
      return res.rows.map(row => {
        const entry = row.raw_data;
        entry.lines = entry.lines.map((l: any) => ({ ...l, amount: BigInt(l.amount) }));
        return entry;
      });
    }
    return Array.from(this.narrativeRecords.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  // Accessor for the memory map (used by server.ts demo seeder logic fallback)
  // This helps maintain compatibility with existing demo code while we transition
  public getMemoryRecords(): Map<string, NarrativeEntry> {
    return this.narrativeRecords;
  }

  // ===========================================================================
  // OBSERVED BALANCE QUERIES (READ-ONLY)
  // ===========================================================================

  async getObservedAccountBalance(accountId: number): Promise<bigint> {
    // In a real implementation, this would query a materialized view in Postgres.
    // For now, we rely on the memory cache which is updated on every record call (even if PG is active)
    return this.observedBalances.get(accountId) || 0n;
  }

  async getObservedAccountBalances(accountIds: number[]): Promise<Record<number, bigint>> {
    const balances: Record<number, bigint> = {};
    for (const id of accountIds) {
      balances[id] = this.observedBalances.get(id) || 0n;
    }
    return balances;
  }

  // ===========================================================================
  // ANCHOR OBSERVATION RECORDING
  // ===========================================================================

  async recordAnchorAuthorization(
    auth: AnchorAuthorization
  ): Promise<RecordNarrativeEntryResponse> {
    const request = createAnchorAuthorizationEntry(auth);
    return this.recordNarrativeEntry(request);
  }

  async recordAnchorFulfillment(
    eventId: string,
    anchorType: AnchorType,
    units: bigint,
    proofHash: string
  ): Promise<RecordNarrativeEntryResponse> {
    const request = createAnchorFulfillmentEntry(eventId, anchorType, units, proofHash);
    return this.recordNarrativeEntry(request);
  }

  async recordAnchorExpiry(
    eventId: string,
    anchorType: AnchorType,
    units: bigint,
    user: string
  ): Promise<RecordNarrativeEntryResponse> {
    const request = createAnchorExpiryObservationEntry(eventId, anchorType, units, user);
    return this.recordNarrativeEntry(request);
  }

  // ===========================================================================
  // ATTESTATION OBSERVATION RECORDING
  // ===========================================================================

  async recordAttestationVerified(
    orderId: string,
    amount: bigint,
    recipient: string,
    attestor: string,
    txHash: string
  ): Promise<RecordNarrativeEntryResponse> {
    const request = createAttestationEntry(orderId, amount, recipient, attestor, txHash);
    return this.recordNarrativeEntry(request);
  }

  // ===========================================================================
  // E2E FINALITY OBSERVATION RECORDING
  // ===========================================================================

  /**
   * Record E2E Finality event (Honoring completion/failure)
   */
  async recordE2EFinalityEvent(event: {
    eventId: string;
    transferId: string;
    anchorType: any;
    userId: string;
    amount: bigint;
    status: any;
    externalId?: string;
    proofHash: string;
    fulfilledAt?: number;
    errorMessage?: string;
    timestamp: number;
    metadata?: Record<string, any>;
  }): Promise<RecordNarrativeEntryResponse> {
    try {
      const narrativeEntry: NarrativeEntry = {
        id: event.eventId,
        date: new Date(event.timestamp).toISOString().split('T')[0],
        description: `E2E Finality: ${event.status} for ${event.transferId}`,
        lines: [
          {
            accountId: NARRATIVE_ACCOUNTS.E2E_HONORING_LEDGER,
            type: 'CREDIT',
            amount: event.amount,
          },
        ],
        source: 'E2E_FINALITY' as any,
        status: event.status || 'OBSERVED',
        txHash: event.proofHash,
        eventId: event.eventId,
        attestationHash: '',
        userId: event.userId,
      };

      if (this.isPostgresConnected && this.pool) {
        const client = await this.pool.connect();

        try {
          await client.query('BEGIN');

          await client.query(
            `INSERT INTO journal_entries 
            (id, date, description, source, status, event_id, user_id, attestation_hash, tx_hash, raw_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              narrativeEntry.id,
              narrativeEntry.date,
              narrativeEntry.description,
              narrativeEntry.source,
              narrativeEntry.status,
              narrativeEntry.eventId,
              narrativeEntry.userId,
              narrativeEntry.attestationHash,
              narrativeEntry.txHash,
              this.stringifyWithBigInt({ ...event.metadata, externalId: event.externalId, fulfilledAt: event.fulfilledAt }),
            ]
          );

          await client.query('COMMIT');

          console.log(`[NarrativeMirror] E2E event recorded: ${narrativeEntry.id}`);

        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      }

      // Always update in-memory cache
      this.narrativeRecords.set(narrativeEntry.id, narrativeEntry);

      return {
        success: true,
        narrativeEntryId: narrativeEntry.id,
      };
    } catch (error) {
      console.error('[NarrativeMirror] Error recording E2E event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Record credit alert (low credit, high utilization, pause, block)
   */
  async recordCreditAlert(alert: {
    alertId: string;
    type: string;
    severity: string;
    anchorType: any;
    message: string;
    data?: Record<string, any>;
    timestamp: number;
  }): Promise<void> {
    try {
      const eventId = `CREDIT-ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      const narrativeEntry: NarrativeEntry = {
        id: eventId,
        date: new Date(alert.timestamp).toISOString().split('T')[0],
        description: `Credit Alert: ${alert.type} - ${alert.message}`,
        lines: [],
        source: 'CREDIT_MANAGEMENT' as any,
        status: alert.severity,
        eventId: eventId,
        attestationHash: '',
        userId: 'SYSTEM',
        txHash: alert.alertId,
      };

      if (this.isPostgresConnected && this.pool) {
        const client = await this.pool.connect();

        try {
          await client.query('BEGIN');

          await client.query(
            `INSERT INTO journal_entries 
            (id, date, description, source, status, event_id, user_id, attestation_hash, tx_hash, raw_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              narrativeEntry.id,
              narrativeEntry.date,
              narrativeEntry.description,
              narrativeEntry.source,
              narrativeEntry.status,
              narrativeEntry.eventId,
              narrativeEntry.userId,
              narrativeEntry.attestationHash,
              narrativeEntry.txHash,
              this.stringifyWithBigInt(alert.data),
            ]
          );

          await client.query('COMMIT');

          console.log(`[NarrativeMirror] Reserve alert recorded: ${eventId}`);

        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      }

      this.narrativeRecords.set(eventId, narrativeEntry);

    } catch (error) {
      console.error('[NarrativeMirror] Error recording reserve alert:', error);
    }
  }

  async ping(): Promise<boolean> {
    return true;
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

let mirrorInstance: NarrativeMirrorService | null = null;

export function getNarrativeMirror(
  config?: Partial<NarrativeMirrorConfig>
): NarrativeMirrorService {
  if (!mirrorInstance) {
    mirrorInstance = new NarrativeMirrorService(config);
  }
  return mirrorInstance;
}

// Legacy export for backward compatibility (Deprecated)
// We align legacy consumers to use the new service pattern
export function getOracleLedgerBridge(
  config?: Partial<NarrativeMirrorConfig>
): NarrativeMirrorService {
  return getNarrativeMirror(config);
}

export default NarrativeMirrorService;