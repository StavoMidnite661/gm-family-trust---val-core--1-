// VAL System Entry Point
// Initializes and exports the Value Attestation Layer, E2E Finality System
//
// =============================================================================
// SOVR CANON NOTICE
// =============================================================================
// E2E Finality: Multi-Adapter Dispatcher bridges Mechanical Truth to Optional Honoring
// TigerBeetle clearing is FINAL. External failures NEVER reverse clearing.
// =============================================================================

import { ethers } from 'ethers';
import { AttestationEngine } from './core/attestation';
import { SpendEngine } from './core/spend_engine';
import { EventLogger } from './events/logger';
import { SquareAdapter } from './adapters/square_adapter';
import { TangoAdapter } from './adapters/tango_adapter';
import { InstacartAdapter } from './adapters/instacart_adapter';
import { getTigerBeetle } from './clearing/tigerbeetle/client';

// E2E Finality imports
import { HonoringDispatcher, DispatchRequest } from './core/honoring-dispatcher';
import { ArcusUtilityAdapter } from './adapters/arcus-utility-adapter';
import { MoovCashOutAdapter } from './adapters/moov-cashout-adapter';
import { CreditManager, CreditConfig } from './core/credit-manager';

export class VALSystem {
  private attestationEngine: AttestationEngine;
  private spendEngine: SpendEngine;
  private eventLogger: EventLogger;
  private honoringDispatcher: HonoringDispatcher;
  private creditManager: CreditManager;
  
  constructor(
    attestorPrivateKey: string,
    provider: ethers.Provider,
    config: {
      square?: { apiKey: string; locationId: string };
      tango?: { platformName: string; platformKey: string; sandbox?: boolean };
      creditConfig?: Partial<CreditConfig>;
    }
  ) {
    // Initialize core components
    this.attestationEngine = new AttestationEngine(attestorPrivateKey, provider);
    this.eventLogger = new EventLogger();
    this.spendEngine = new SpendEngine(this.attestationEngine, this.eventLogger);
    
    // Initialize E2E Finality System
    this.honoringDispatcher = new HonoringDispatcher();
    this.creditManager = new CreditManager(config.creditConfig || {});
    
    // Register merchant adapters with dispatcher
    if (config.square) {
      const squareAdapter = new SquareAdapter(
        config.square.apiKey,
        config.square.locationId
      );
      this.honoringDispatcher.registerAdapter(squareAdapter);
    }
    
    if (config.tango) {
      const tangoAdapter = new TangoAdapter(
        config.tango.platformName,
        config.tango.platformKey,
        config.tango.sandbox
      );
      this.honoringDispatcher.registerAdapter(tangoAdapter);
    }

    // Register Instacart Adapter (Zero-Float)
    const instacartAdapter = new InstacartAdapter();
    this.honoringDispatcher.registerAdapter(instacartAdapter);

    // Register Arcus Utility Adapter
    const arcusAdapter = new ArcusUtilityAdapter({
      merchantId: process.env.ARCUS_MERCHANT_ID || 'default_merchant',
      secretKey: process.env.ARCUS_SECRET_KEY || 'default_secret',
      sandbox: process.env.ARCUS_SANDBOX !== 'false',
      apiUrl: process.env.ARCUS_API_URL || 'https://api.arcus.com',
    });
    this.honoringDispatcher.registerAdapter(arcusAdapter);

    // Register Moov Cash-Out Adapter
    const moovAdapter = new MoovCashOutAdapter({
      apiKey: process.env.MOOV_API_KEY || 'default_key',
      apiUrl: process.env.MOOV_API_URL || 'https://api.moov.io',
      partnerId: process.env.MOOV_PARTNER_ID || 'default_partner',
      sandbox: process.env.MOOV_SANDBOX !== 'false',
    });
    this.honoringDispatcher.registerAdapter(moovAdapter);
  }
  
  /**
   * Initialize async components (TigerBeetle Accounts, Credit Manager)
   */
  async initialize(): Promise<void> {
    console.log('[VAL] Initializing VAL System...');

    // Initialize TigerBeetle
    const tb = getTigerBeetle();
    await tb.initializeReferenceAccounts();

    // Start credit manager clearing timer
    this.creditManager.startClearingTimer();
    
    console.log('[VAL] VAL System initialized successfully');
  }
  
  /**
   * Get spend engine instance
   */
  getSpendEngine(): SpendEngine {
    return this.spendEngine;
  }
  
  /**
   * Get attestation engine instance
   */
  getAttestationEngine(): AttestationEngine {
    return this.attestationEngine;
  }
  
  /**
   * Get event logger instance
   */
  getEventLogger(): EventLogger {
    return this.eventLogger;
  }

  /**
   * Get honoring dispatcher instance
   */
  getHonoringDispatcher(): HonoringDispatcher {
    return this.honoringDispatcher;
  }

  /**
   * Get credit manager instance
   */
  getCreditManager(): CreditManager {
    return this.creditManager;
  }
}

// Export all types and classes
export * from './events/types';
export * from './core/attestation';
export * from './core/spend_engine';
export * from './core/oracle-ledger-bridge-service.ts';
export * from './clearing/tigerbeetle/client';
export * from './merchant_triggers/adapter_interface';
export * from './adapters/square_adapter';
export * from './adapters/tango_adapter';
export * from './adapters/instacart_adapter';
export * from './core/e2e-finality-types';
export * from './core/honoring-dispatcher';
export * from './core/credit-manager';
export * from './adapters/arcus-utility-adapter';
export * from './adapters/moov-cashout-adapter';
