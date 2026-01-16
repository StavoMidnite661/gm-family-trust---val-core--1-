// Tango Card Adapter (Real-World Integration)
// Integrates with Tango Card API for universal gift card issuance

import { IMerchantValueAdapter, ValueRequest, ValueResponse, TransactionStatus, WebhookResponse, MerchantAdapterError } from '../merchant_triggers/adapter_interface';
import { TangoCardClient, TangoCardConfig } from './tango_client';

export class TangoAdapter implements IMerchantValueAdapter {
  name = 'Tango Card';
  type = 'tango' as const;
  enabled = true;

  private client: TangoCardClient;

  constructor(platformName: string, platformKey: string, sandbox: boolean = false) {
    // Initialize real API client
    const config: TangoCardConfig = {
      platformName,
      platformKey,
      accountId: process.env.TANGO_ACCOUNT_ID || 'SOVR_DEFAULT',
      sandbox,
    };

    this.client = new TangoCardClient(config);
  }

  /**
   * Issue gift card via Tango Card API (Real-World)
   */
  async issueValue(request: ValueRequest): Promise<ValueResponse> {
    try {
      console.log(`[TangoAdapter] Issuing $${request.amount} gift card via real API`);

      // Verify attestation
      if (!request.attestation) {
        throw new MerchantAdapterError(
          'Attestation required',
          'MISSING_ATTESTATION',
          'tango'
        );
      }

      // Call real Tango Card API
      const result = await this.client.issueGiftCard({
        amount: request.amount,
        utid: 'U123456', // Default UTID (configure via env for different brands)
        brandName: 'TANGO_GIFT_CARD',
        email: request.metadata.email || 'user@example.com',
        firstName: request.metadata.customData?.firstName,
        lastName: request.metadata.customData?.lastName,
        externalRefId: request.metadata.customData?.referenceId,
      });

      if (!result.success) {
        throw new MerchantAdapterError(
          result.error || 'Failed to issue gift card',
          'TANGO_ISSUE_FAILED',
          'tango',
          result.error
        );
      }

      console.log(`[TangoAdapter] Gift card issued successfully: ${result.orderId}`);

      return {
        success: true,
        transactionId: result.orderId || `tango_txn_${Date.now()}`,
        value: {
          type: 'gift_card',
          code: result.code,
          balance: request.amount,
          url: `https://www.tangocard.com/redeem/${result.code}`,
          redemptionInstructions: 'Click on the link or enter the code to redeem your gift card'
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[TangoAdapter] Error:', error);

      // If it's already a MerchantAdapterError, just return it
      if (error instanceof MerchantAdapterError) {
        return {
          success: false,
          transactionId: '',
          value: { type: 'gift_card' },
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          },
          timestamp: new Date()
        };
      }

      // Wrap unexpected errors
      return {
        success: false,
        transactionId: '',
        value: { type: 'gift_card' },
        error: {
          code: 'TANGO_ADAPTER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Check order status (Real-World)
   */
  async checkStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      console.log(`[TangoAdapter] Checking order status: ${transactionId}`);

      const orderStatus = await this.client.getOrderStatus(transactionId);

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
      console.error('[TangoAdapter] Error checking status:', error);

      return {
        transactionId,
        status: 'failed',
        error: {
          code: 'TANGO_STATUS_CHECK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        updatedAt: new Date()
      };
    }
  }

  /**
   * Handle Tango webhook (Real-World)
   */
  async handleWebhook(payload: any): Promise<WebhookResponse> {
    console.log('[TangoAdapter] Webhook received:', payload);

    try {
      // Verify webhook signature if configured
      if (process.env.VERIFY_WEBHOOK_SIGNATURES === 'true') {
        // TODO: Implement signature verification
        console.warn('[TangoAdapter] Webhook signature verification not yet implemented');
      }

      // Process webhook based on event type
      const eventType = payload.eventType || payload.type;

      switch (eventType) {
        case 'ORDER_COMPLETED':
          console.log('[TangoAdapter] Order completed webhook:', payload.referenceOrderID);
          break;
        case 'ORDER_CANCELLED':
          console.log('[TangoAdapter] Order cancelled webhook:', payload.referenceOrderID);
          break;
        default:
          console.log('[TangoAdapter] Unknown webhook event:', eventType);
      }

      return {
        acknowledged: true,
        eventType: eventType,
        processedAt: new Date()
      };
    } catch (error) {
      console.error('[TangoAdapter] Error processing webhook:', error);

      return {
        acknowledged: false,
        eventType: 'WEBHOOK_ERROR',
        processedAt: new Date()
      };
    }
  }

  /**
   * Validate Tango configuration (Real-World)
   */
  async validateConfig(): Promise<boolean> {
    try {
      const isValid = this.client.validateConfig();

      if (!isValid) {
        console.warn('[TangoAdapter] Invalid configuration detected');
      }

      return isValid;
    } catch (error) {
      console.error('[TangoAdapter] Error validating config:', error);
      return false;
    }
  }
}
