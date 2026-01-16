// Instacart Zero-Float Adapter (Real-World Integration)
// Integrates with Tango Card API to fulfill grocery credits without pre-funding.
// Wire: Credit Terminal -> Narrative Mirror -> Tango API
//
// -----------------------------------------------------------------------------
// SOVR CANON NOTICE
// -----------------------------------------------------------------------------
// Honoring Agent: External, Non-Authoritative
// This component interacts with hostile external systems.
// -----------------------------------------------------------------------------

import {
  IMerchantValueAdapter,
  ValueRequest,
  ValueResponse,
  TransactionStatus,
  WebhookResponse,
  MerchantAdapterError
} from '../merchant_triggers/adapter_interface';
import {
  getNarrativeMirror,
  NarrativeMirrorService
} from '../core/narrative-mirror-service';
import { AnchorType } from '../shared/narrative-mirror-bridge';
import { TangoCardClient } from './tango_client';

export class InstacartAdapter implements IMerchantValueAdapter {
  name = 'Instacart Zero-Float';
  type = 'instacart' as const;
  enabled = true;

  private anchorContractAddress: string;
  private narrativeMirror: NarrativeMirrorService;
  private tangoClient: TangoCardClient;

  // Specific UTID for Instacart (Configurable via env)
  private readonly INSTACART_UTID = process.env.INSTACART_UTID || 'U123456';

  constructor(anchorContractAddress: string = '0xANCHOR_CONTRACT_ADDRESS_PLACEHOLDER') {
    this.anchorContractAddress = anchorContractAddress;
    this.narrativeMirror = getNarrativeMirror();

    // Initialize real Tango Card client
    this.tangoClient = new TangoCardClient({
      platformName: process.env.TANGO_PLATFORM_NAME || 'SOVR_SANDBOX',
      platformKey: process.env.TANGO_PLATFORM_KEY || '',
      accountId: process.env.TANGO_ACCOUNT_ID || 'SOVR_DEFAULT',
      sandbox: process.env.USE_SANDBOX === 'true',
    });
  }

  /**
   * Issue Instacart value via Anchor Contract + Tango Card API (Real-World)
   * Flow:
   * 1. Log Anchor Authorization in Narrative Mirror (Obligation Creation)
   * 2. Call Tango Card API to issue gift card (Zero-Float)
   * 3. Log Anchor Fulfillment in Narrative Mirror (Obligation Clearing)
   */
  async issueValue(request: ValueRequest): Promise<ValueResponse> {
    const eventId = `AUTH-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    try {
      console.log(`[InstacartAdapter] Processing request for user ${request.userId} ($${request.amount})`);

      // Amount in micro-units (1e6)
      const units = BigInt(Math.round(request.amount * 1_000_000));

      // 1. RECORD AUTHORIZATION (Narrative Mirror)
      // Records intent to honor, does not touch Clearing Authority (TigerBeetle)
      await this.narrativeMirror.recordAnchorAuthorization({
        eventId: eventId,
        user: request.userId,
        anchorType: 'GROCERY' as AnchorType,
        units: units,
        expiry: Date.now() + 86400000 // 24h
      });
      console.log(`[InstacartAdapter] Intent Observation recorded: ${eventId}`);

      // 2. ADAPTER EXECUTION (Tango Card API - Real)
      const tangoResult = await this.tangoClient.issueGiftCard({
        amount: request.amount,
        utid: this.INSTACART_UTID,
        brandName: 'Instacart',
        email: request.metadata.email,
        firstName: request.metadata.customData?.firstName,
        lastName: request.metadata.customData?.lastName,
        externalRefId: eventId,
      });

      if (!tangoResult.success || !tangoResult.code) {
        // Fulfillment failed - DO NOT retry per SOVR doctrine
        // Log failure and halt
        console.error(`[InstacartAdapter] Fulfillment failed: ${tangoResult.error}`);

        return {
          success: false,
          transactionId: eventId,
          value: { type: 'gift_card' },
          error: {
            code: 'INSTACART_FULFILLMENT_ERROR',
            message: tangoResult.error || 'Tango API fulfillment failed'
          },
          timestamp: new Date()
        };
      }

      // 3. RECORD FULFILLMENT (Narrative Mirror)
      // Records observation of mechanical fulfillment.
      const proofHash = this.generateProofHash(tangoResult.orderId || 'UNKNOWN');

      await this.narrativeMirror.recordAnchorFulfillment(
        eventId,
        'GROCERY' as AnchorType,
        units,
        proofHash
      );
      console.log(`[InstacartAdapter] Fulfillment Observation recorded: ${tangoResult.orderId}`);

      return {
        success: true,
        transactionId: eventId,
        value: {
          type: 'gift_card',
          code: tangoResult.code,
          url: `https://instacart.com/redeem/${tangoResult.code}`,
          balance: request.amount,
          redemptionInstructions: 'Redeem in Instacart App -> Settings -> Credits. This is a Zero-Float generic credit.'
        },
        timestamp: new Date()
      };

    } catch (error) {
      console.error('[InstacartAdapter] Error:', error);

      // If authorization succeeded but fulfillment failed, we log the failure
      // Per SOVR doctrine: Do NOT retry blindly. The anchor halts.

      return {
        success: false,
        transactionId: eventId,
        value: { type: 'gift_card' },
        error: {
          code: 'INSTACART_ADAPTER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Check order status via Tango Card API (Real-World)
   */
  async checkStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      const orderStatus = await this.tangoClient.getOrderStatus(transactionId);

      // Map Tango status to our TransactionStatus
      const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled'> = {
        'NEW': 'pending',
        'PENDING': 'pending',
        'FUNDED': 'pending',
        'PROCESSED': 'pending',
        'COMPLETED': 'completed',
        'CANCELLED': 'cancelled',
        'FAILED': 'failed',
      };

      return {
        transactionId,
        status: statusMap[orderStatus.status] || 'pending',
        updatedAt: new Date(orderStatus.lastUpdatedTimestamp)
      };
    } catch (error) {
      console.error('[InstacartAdapter] Error checking status:', error);

      return {
        transactionId,
        status: 'failed',
        error: {
          code: 'INSTACART_STATUS_CHECK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        updatedAt: new Date()
      };
    }
  }

  /**
   * Handle webhook from Tango Card API (Real-World)
   */
  async handleWebhook(payload: any): Promise<WebhookResponse> {
    console.log('[InstacartAdapter] Webhook received from Tango:', payload);

    try {
      // Verify webhook signature if configured
      if (process.env.VERIFY_WEBHOOK_SIGNATURES === 'true') {
        // TODO: Implement signature verification
        console.warn('[InstacartAdapter] Webhook signature verification not yet implemented');
      }

      // Process webhook based on event type
      const eventType = payload.eventType || payload.type;

      switch (eventType) {
        case 'ORDER_COMPLETED':
          console.log('[InstacartAdapter] Order completed - update Narrative Mirror');
          // TODO: Update Narrative Mirror with completion confirmation
          break;
        case 'ORDER_CANCELLED':
          console.log('[InstacartAdapter] Order cancelled - log failure');
          // TODO: Handle cancellation in Narrative Mirror
          break;
        default:
          console.log('[InstacartAdapter] Unknown webhook event:', eventType);
      }

      return {
        acknowledged: true,
        eventType: eventType,
        processedAt: new Date()
      };
    } catch (error) {
      console.error('[InstacartAdapter] Error processing webhook:', error);

      return {
        acknowledged: false,
        eventType: 'WEBHOOK_ERROR',
        processedAt: new Date()
      };
    }
  }

  private generateProofHash(orderId: string): string {
    // In production: keccak256(orderId + secret)
    return `0x${Buffer.from(orderId).toString('hex')}`.padEnd(66, '0');
  }

  async validateConfig(): Promise<boolean> {
    try {
      const isValid = this.tangoClient.validateConfig();

      if (!isValid) {
        console.warn('[InstacartAdapter] Invalid Tango configuration detected');
      }

      return isValid;
    } catch (error) {
      console.error('[InstacartAdapter] Error validating config:', error);
      return false;
    }
  }
}
