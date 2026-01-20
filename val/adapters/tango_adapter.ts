// Tango Card Adapter
// Integrates with Tango Card API for universal gift card issuance

import { IMerchantValueAdapter, ValueRequest, ValueResponse, TransactionStatus, WebhookResponse, MerchantAdapterError } from '../merchant_triggers/adapter_interface';

export class TangoAdapter implements IMerchantValueAdapter {
  name = 'Tango Card';
  type = 'tango' as const;
  enabled = true;
  
  private platformName: string;
  private platformKey: string;
  private baseUrl: string;
  
  constructor(platformName: string, platformKey: string, sandbox: boolean = false) {
    this.platformName = platformName;
    this.platformKey = platformKey;
    this.baseUrl = sandbox 
      ? 'https://integration-api.tangocard.com/raas/v2'
      : 'https://api.tangocard.com/raas/v2';
  }
  
  /**
   * Issue gift card via Tango Card API
   */
  async issueValue(request: ValueRequest): Promise<ValueResponse> {
    try {
      console.log(`[TangoAdapter] Issuing $${request.amount} gift card`);
      
      // Verify attestation
      if (!request.attestation) {
        throw new MerchantAdapterError(
          'Attestation required',
          'MISSING_ATTESTATION',
          'tango'
        );
      }

      // Call actual Tango Card API
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.platformName}:${this.platformKey}`).toString('base64')}`
        },
        body: JSON.stringify({
          accountIdentifier: request.userId,
          amount: request.amount,
          utid: 'U123456', // Default UTID - should be configured per merchant
          recipient: {
            email: request.metadata.email || `${request.userId}@example.com`,
            firstName: 'User',
            lastName: 'Test'
          },
          notes: `Issued via SOVR Credit Terminal - ${request.metadata.merchant || 'Generic'}`
        })
      });

      if (!response.ok) {
        throw new Error(`Tango API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Extract gift card details from Tango response
      const giftCard = data.reward;
      
      return {
        success: true,
        transactionId: data.referenceOrderID,
        value: {
          type: 'gift_card',
          code: giftCard.credentials?.PIN || 'N/A',
          balance: request.amount,
          url: giftCard.credentials?.REDEMPTION_URL || `https://www.tangocard.com/redeem/${data.referenceOrderID}`,
          redemptionInstructions: 'Click the link to redeem your gift card'
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[TangoAdapter] Error:', error);
      return {
        success: false,
        transactionId: '',
        value: { type: 'gift_card' },
        error: {
          code: 'TANGO_API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Check order status
   */
  async checkStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${transactionId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.platformName}:${this.platformKey}`).toString('base64')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Tango API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        transactionId,
        status: data.status || 'completed',
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('[TangoAdapter] Status check error:', error);
      return {
        transactionId,
        status: 'failed',
        updatedAt: new Date()
      };
    }
  }
  
  /**
   * Handle Tango webhook
   */
  async handleWebhook(payload: any): Promise<WebhookResponse> {
    console.log('[TangoAdapter] Webhook received:', payload);
    
    return {
      acknowledged: true,
      eventType: payload.eventType || 'unknown',
      processedAt: new Date()
    };
  }
  
  /**
   * Validate Tango configuration
   */
  async validateConfig(): Promise<boolean> {
    return !!(this.platformName && this.platformKey);
  }
}
