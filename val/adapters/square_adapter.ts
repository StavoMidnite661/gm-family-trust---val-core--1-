// Square Gift Card Adapter
// Integrates with Square Gift Cards API for value issuance

import { IMerchantValueAdapter, ValueRequest, ValueResponse, TransactionStatus, WebhookResponse, MerchantAdapterError } from '../merchant_triggers/adapter_interface';

export class SquareAdapter implements IMerchantValueAdapter {
  name = 'Square Gift Cards';
  type = 'square' as const;
  enabled = true;
  
  private apiKey: string;
  private locationId: string;
  private baseUrl: string;
  
  constructor(apiKey: string, locationId: string, sandbox: boolean = true) {
    this.apiKey = apiKey;
    this.locationId = locationId;
    this.baseUrl = sandbox 
      ? 'https://connect.squareupsandbox.com/v2'
      : 'https://connect.squareup.com/v2';
  }
  
  /**
   * Issue gift card via Square API
   */
  async issueValue(request: ValueRequest): Promise<ValueResponse> {
    try {
      console.log(`[SquareAdapter] Issuing $${request.amount} gift card`);
      
      // Verify attestation
      if (!request.attestation) {
        throw new MerchantAdapterError(
          'Attestation required',
          'MISSING_ATTESTATION',
          'square'
        );
      }
      
      // Call Square API to create gift card
      const createResponse = await fetch(`${this.baseUrl}/gift-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Square-Version': '2024-01-18'
        },
        body: JSON.stringify({
          idempotency_key: `giftcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          gift_card: {
            type: 'DIGITAL',
            location_id: this.locationId
          }
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.errors?.[0]?.detail || `Square API error: ${createResponse.status}`);
      }

      const createData = await createResponse.json();
      const giftCardId = createData.gift_card?.id;

      // Add balance to the gift card
      const balanceResponse = await fetch(`${this.baseUrl}/gift-cards/${giftCardId}/balances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Square-Version': '2024-01-18'
        },
        body: JSON.stringify({
          idempotency_key: `balance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          balance_money: {
            amount: Math.round(request.amount * 100), // Square uses cents
            currency: 'USD'
          }
        })
      });

      if (!balanceResponse.ok) {
        const errorData = await balanceResponse.json();
        throw new Error(errorData.errors?.[0]?.detail || `Square API error: ${balanceResponse.status}`);
      }

      const balanceData = await balanceResponse.json();
      
      return {
        success: true,
        transactionId: createData.gift_card?.gan,
        value: {
          type: 'gift_card',
          code: createData.gift_card?.gan,
          balance: request.amount,
          url: `https://squareup.com/gift/${createData.gift_card?.gan}`,
          redemptionInstructions: 'Present this code at any Square merchant location'
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[SquareAdapter] Error:', error);
      return {
        success: false,
        transactionId: '',
        value: { type: 'gift_card' },
        error: {
          code: 'SQUARE_API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Check gift card status
   */
  async checkStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/gift-cards?gan=${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Square-Version': '2024-01-18'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.detail || `Square API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        transactionId,
        status: 'completed', // Square gift cards are active immediately
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('[SquareAdapter] Status check error:', error);
      return {
        transactionId,
        status: 'failed',
        updatedAt: new Date()
      };
    }
  }
  
  /**
   * Handle Square webhook
   */
  async handleWebhook(payload: any): Promise<WebhookResponse> {
    console.log('[SquareAdapter] Webhook received:', payload);
    
    return {
      acknowledged: true,
      eventType: payload.type || 'unknown',
      processedAt: new Date()
    };
  }
  
  /**
   * Validate Square configuration
   */
  async validateConfig(): Promise<boolean> {
    return !!(this.apiKey && this.locationId);
  }
}
