/**
 * TigerBeetle Service
 * 
 * Provides high-performance ledger capabilities for the Credit Terminal.
 * Mirrors the Oracle Ledger chart of accounts but optimized for speed.
 * 
 * "Ledgers update, money does not move."
 */

import { createClient, Transfer, Account, Client } from 'tigerbeetle-node';
import { NARRATIVE_ACCOUNTS as ORACLE_ACCOUNTS } from '../../shared/narrative-mirror-bridge';

// Configuration
const TB_CLUSTER_ID = BigInt(process.env.TB_CLUSTER_ID || '0');
const TB_REPLICA_ADDRESSES = [process.env.TB_ADDRESS || '3000'];

// Ledger IDs (from TigerBeetle Ledger Schema)
export const LEDGER_IDS = {
  USD: 1,
  EUR: 2,
  GBP: 3,
  ETH: 100,
  USDC: 101,
  USDT: 102,
  BTC: 103,
  SOVR: 999,
  sFIAT: 998,
  GROCERY_OBLIGATION: 1001,
  UTILITY_OBLIGATION: 1002,
  FUEL_OBLIGATION: 1003,
} as const;

// Account Codes (from TigerBeetle Ledger Schema)
export const ACCOUNT_CODES = {
  USER: 1,
  MERCHANT: 2,
  TREASURY: 3,
  ESCROW: 4,
  FEE_POOL: 5,
  ANCHOR: 6,
  SYSTEM_BUFFER: 7,
} as const;

// Transfer Codes (from TigerBeetle Ledger Schema)
export const TRANSFER_CODES = {
  DEPOSIT: 1,
  WITHDRAWAL: 2,
  PAYMENT: 3,
  REFUND: 4,
  FEE: 5,
  ANCHOR_AUTHORIZATION: 10,
  ANCHOR_FULFILLMENT: 11,
  ANCHOR_EXPIRY: 12,
  ESCROW_LOCK: 20,
  ESCROW_RELEASE: 21,
  ESCROW_VOID: 22,
  SETTLEMENT: 30,
  SETTLEMENT_REVERSAL: 31,
} as const;

// Standard Flags
const TRANSFER_FLAGS = {
  NONE: 0,
  LINKED: 1,
  PENDING: 2,
  POST_PENDING_TRANSFER: 4,
  VOID_PENDING_TRANSFER: 8,
};

export class TigerBeetleService {
  private client!: Client;
  private isConnected: boolean = false;

  constructor() {
    try {
      this.client = createClient({
        cluster_id: TB_CLUSTER_ID,
        replica_addresses: TB_REPLICA_ADDRESSES,
      });
      this.isConnected = true;
      console.log(`[TigerBeetle] Client initialized on cluster ${TB_CLUSTER_ID}`);
    } catch (e) {
      console.error('[TigerBeetle] Failed to initialize client:', e);
      this.isConnected = false;
    }
  }
  
  /**
   * Initialize standard accounts if they don't exist.
   * Mirrors Oracle Ledger constants.
   */
  async initializeReferenceAccounts(): Promise<void> {
    if (!this.isConnected) return;

    const accountsToCreate: Account[] = [];

    // Helper to map Oracle ID format to TB Account
    const mapAccount = (id: number, ledger: number, code: number) => ({
      id: BigInt(id),
      debits_pending: 0n,
      debits_posted: 0n,
      credits_pending: 0n,
      credits_posted: 0n,
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      reserved: 0,
      ledger: ledger,
      code: code,
      flags: 0,
      timestamp: 0n, // Auto-set by TB
    });

    // Create reference accounts based on SOVR specifications
    accountsToCreate.push(
      // Treasury (Root minting source)
      mapAccount(ORACLE_ACCOUNTS.TREASURY_MINT, LEDGER_IDS.SOVR, ACCOUNT_CODES.TREASURY),

      
      // Stablecoin account (user spending power)
      mapAccount(ORACLE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, LEDGER_IDS.SOVR, ACCOUNT_CODES.USER),
      
      // ODFI account (merchant realization)
      mapAccount(ORACLE_ACCOUNTS.HONORING_ADAPTER_ODFI, LEDGER_IDS.SOVR, ACCOUNT_CODES.MERCHANT),
      
      // System buffer (temporary hold during authorization)
      mapAccount(ORACLE_ACCOUNTS.OBSERVED_TOKEN_REALIZATION, LEDGER_IDS.SOVR, ACCOUNT_CODES.SYSTEM_BUFFER),
      
      // Anchor obligation accounts
      mapAccount(ORACLE_ACCOUNTS.OBSERVED_ANCHOR_GROCERY_OBLIGATION, LEDGER_IDS.GROCERY_OBLIGATION, ACCOUNT_CODES.ANCHOR),
      mapAccount(ORACLE_ACCOUNTS.OBSERVED_ANCHOR_UTILITY_OBLIGATION, LEDGER_IDS.UTILITY_OBLIGATION, ACCOUNT_CODES.ANCHOR),
      mapAccount(ORACLE_ACCOUNTS.OBSERVED_ANCHOR_FUEL_OBLIGATION, LEDGER_IDS.FUEL_OBLIGATION, ACCOUNT_CODES.ANCHOR),
      mapAccount(ORACLE_ACCOUNTS.OBSERVED_ANCHOR_MOBILE_OBLIGATION, LEDGER_IDS.sFIAT, ACCOUNT_CODES.ANCHOR),
      mapAccount(ORACLE_ACCOUNTS.OBSERVED_ANCHOR_HOUSING_OBLIGATION, LEDGER_IDS.sFIAT, ACCOUNT_CODES.ANCHOR),
      mapAccount(ORACLE_ACCOUNTS.OBSERVED_ANCHOR_MEDICAL_OBLIGATION, LEDGER_IDS.sFIAT, ACCOUNT_CODES.ANCHOR),
      // mapAccount(ORACLE_ACCOUNTS.OBSERVED_ANCHOR_CASH_OUT_OBLIGATION, LEDGER_IDS.USD, ACCOUNT_CODES.ANCHOR),
      // mapAccount(ORACLE_ACCOUNTS.OBSERVED_ANCHOR_PAYROLL_OBLIGATION, LEDGER_IDS.USD, ACCOUNT_CODES.ANCHOR),
      // mapAccount(ORACLE_ACCOUNTS.OBSERVED_ANCHOR_REMITTANCE_OBLIGATION, LEDGER_IDS.USD, ACCOUNT_CODES.ANCHOR)
    );

    try {
      const errors = await this.client.createAccounts(accountsToCreate);
      if (errors.length > 0) {
        // Filter out "exists" errors, as that's expected on restart
        const realErrors = errors.filter(e => e.result !== 1); // 1 = exists (roughly)
        if (realErrors.length > 0) {
           console.warn('[TigerBeetle] Account creation returned potential errors:', errors);
        }
      }
      console.log(`[TigerBeetle] Ensure ${accountsToCreate.length} reference accounts exist.`);
    } catch (e) {
      console.error('[TigerBeetle] Error creating reference accounts:', e);
    }
  }

  /**
   * Create accounts directly (for setup/testing)
   */
  async createAccounts(accounts: Account[]): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      const errors = await this.client.createAccounts(accounts);
      if (errors.length > 0) {
        // Filter out "exists" (1) if redundant
        const realErrors = errors.filter(e => e.result !== 1);
        if (realErrors.length > 0) {
          console.error('[TigerBeetle] Account creation failed:', realErrors);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error('[TigerBeetle] Account creation exception:', e);
      return false;
    }
  }

  async createTransfer(
    debitAccount: bigint,
    creditAccount: bigint,
    amount: bigint,
    ledger: number = LEDGER_IDS.SOVR,
    code: number = TRANSFER_CODES.PAYMENT,
    id?: bigint
  ): Promise<{ success: boolean; error?: number }> {
    if (!this.isConnected) return { success: false, error: 999 }; // 999 = Client Offline

    const transferId = id || (BigInt(Date.now()) * 10000n + BigInt(Math.floor(Math.random() * 10000)));

    const transfer: Transfer = {
      id: transferId,
      debit_account_id: debitAccount,
      credit_account_id: creditAccount,
      amount: amount,
      pending_id: 0n,
      user_data_128: 0n,
      user_data_64: 0n,
      user_data_32: 0,
      timeout: 0,
      ledger: ledger,
      code: code,
      flags: 0,
      timestamp: 0n,
    };

    try {
      const errors = await this.client.createTransfers([transfer]);
      if (errors.length > 0) {
        // Idempotency Check:
        // Error 46 = exists (transfer with this ID already exists)
        const realErrors = errors.filter(e => e.result !== 46);
        
        if (realErrors.length > 0) {
          const firstError = realErrors[0].result;
          console.error('[TigerBeetle] Transfer failed:', realErrors);
          return { success: false, error: firstError };
        } else {
          console.warn(`[TigerBeetle] Transfer ${transferId} already exists (Idempotent success)`);
          return { success: true };
        }
      }
      return { success: true };
    } catch (e) {
      console.error('[TigerBeetle] Transfer exception:', e);
      return { success: false, error: 998 }; // 998 = Exception
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: bigint): Promise<{ available: bigint; pending: bigint }> {
    if (!this.isConnected) return { available: 0n, pending: 0n };

    try {
      const accounts = await this.client.lookupAccounts([accountId]);
      if (accounts.length === 0) return { available: 0n, pending: 0n };
      
      const acc = accounts[0];
      
      return {
        available: acc.credits_posted - acc.debits_posted,
        pending: acc.credits_pending - acc.debits_pending
      };
    } catch (e) {
      console.error('[TigerBeetle] Lookup exception:', e);
      return { available: 0n, pending: 0n };
    }
  }
}

// Singleton
let instance: TigerBeetleService | null = null;
export function getTigerBeetle(): TigerBeetleService {
  if (!instance) instance = new TigerBeetleService();
  return instance;
}

// Helpers
function nr(n: number): number { return n; }
