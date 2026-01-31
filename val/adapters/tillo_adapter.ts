// Tillo Adapter
// Integrates with Tillo API for gift cards and prepaid Visas (Reward Pass)

import crypto from 'crypto';
import { IMerchantValueAdapter, ValueRequest, ValueResponse, TransactionStatus, WebhookResponse, MerchantAdapterError } from '../merchant_triggers/adapter_interface';

// Generate proper UUID v4 for client_request_id
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export class TilloAdapter implements IMerchantValueAdapter {
  name = 'Tillo';
  type = 'tillo' as any; // Cast to any if 'tillo' is not in MerchantType union yet
  enabled = true;
  
  private apiKey: string;
  private apiSecret: string;
  private sector: string;
  private baseUrl: string;
  private isSandbox: boolean;
  
  constructor(apiKey: string, apiSecret: string, isSandbox = false, sector = '') {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.isSandbox = isSandbox;
    this.baseUrl = isSandbox ? 'https://sandbox.tillo.dev/api/v2' : 'https://hub.tillo.tech/api/v2';
    this.sector = sector || process.env.TILLO_SECTOR || '';
  }
  
  /**
   * Generate Tillo HMAC Signature
   */
  private generateSignature(
    method: string,
    endpoint: string,
    clientRequestId: string,
    brand: string,
    currencyIsoCode: string,
    amount: string | number,
    timestamp: number
  ): string {
    let signatureString = '';
    
    if (method === 'GET') {
      // Common parts: API Key, Method, Endpoint String
      // Tillo V2 GET Signature: API Key - Method - Endpoint - [Reference] - [Brand] - [Sector] - Timestamp
      // IMPORTANT: Only include parts that are actually part of the request.
      
      const parts = [this.apiKey, method, endpoint];
      
      // Reference (clientRequestId)
      if (clientRequestId && clientRequestId !== 'none') {
          parts.push(clientRequestId);
      }

      // Brand
      if (brand && brand !== 'none') {
          parts.push(brand);
      }
      
      // Timestamp
      parts.push(timestamp.toString());
      signatureString = parts.join('-');
    } else {
      // POST signature: APIKey-POST-endpoint-ID-brand-currency-amount-timestamp
      signatureString = `${this.apiKey}-${method}-${endpoint}-${clientRequestId}-${brand}-${currencyIsoCode}-${amount}-${timestamp}`;
    }
    
    console.log(`[TilloAdapter] Signature String: ${signatureString}`);
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Issue gift card or Reward Pass via Tillo API
   */
  async issueValue(request: ValueRequest): Promise<ValueResponse> {
    try {
      console.log(`[TilloAdapter] Issuing ${request.currency} ${request.amount} to Tillo`);
      
      const endpoint = '/digital/issue';
      const signatureEndpoint = 'digital-issue';
      const requestId = request.metadata.transferId || generateUUID();
      const brand = request.metadata.customData?.brand || 'open-sync-us'; // Verified sandbox brand
      const currency = request.currency || 'GBP';
      const amount = request.amount;
      const timestamp = Date.now();
      
      const isPrepaid = brand === 'reward-pass' || request.metadata.customData?.isPrepaidCard;

      // Construct payload
      const payload: any = {
        client_request_id: requestId,
        brand: brand,
        face_value: {
          amount: amount,
          currency: currency
        },
        delivery_method: 'url',
        fulfilment_by: 'partner',
        sector: this.sector
      };

      // Handle KYC/Recipient for Prepaid Visa/Mastercard
      if (isPrepaid) {
        if (!request.metadata.customData?.firstName || !request.metadata.customData?.lastName || !request.metadata.email) {
            throw new MerchantAdapterError(
                'First Name, Last Name, and Email are required for Prepaid Cards (KYC)',
                'MISSING_KYC_DATA',
                'tillo' as any
            );
        }
        payload.personalisation = {
            recipient: {
                first_name: request.metadata.customData.firstName,
                last_name: request.metadata.customData.lastName,
                email: request.metadata.email
            }
        };
      } else if (request.metadata.customData?.firstName && request.metadata.customData?.lastName) {
          // Optional personalization for gift cards
          payload.personalisation = {
              to_name: `${request.metadata.customData.firstName} ${request.metadata.customData.lastName}`,
              from_name: 'SOVR',
              message: 'Thank you for being part of the SOVR network!'
          };
      }

      const signature = this.generateSignature('POST', signatureEndpoint, requestId, brand, currency, amount, timestamp);

      console.log(`[TilloAdapter] Sending request to ${this.baseUrl}${endpoint}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'API-Key': this.apiKey,
          'Signature': signature,
          'Timestamp': timestamp.toString(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || data.code !== '000') {
        throw new Error(`Tillo API error: ${data.code} - ${data.message || response.statusText}`);
      }

      return {
        success: true,
        transactionId: data.data?.reference || data.reference,
        value: {
          type: brand === 'reward-pass' ? 'virtual_card' : 'gift_card',
          code: data.data?.code || 'N/A',
          url: data.data?.url || data.reward?.url || '',
          balance: request.amount,
          redemptionInstructions: data.data?.instructions || 'Visit the URL to redeem your gift card.'
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[TilloAdapter] Error:', error);
      return {
        success: false,
        transactionId: '',
        value: { type: 'gift_card' },
        error: {
          code: 'TILLO_API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Check transaction status
   */
  async checkStatus(transactionId: string): Promise<TransactionStatus> {
    try {
        const endpoint = '/digital/issue/' + transactionId;
        const signatureEndpoint = 'digital-issue'; 
        const timestamp = Date.now();
        
        // For status check: Key-GET-digital-issue-{reference}-Timestamp
        const signature = this.generateSignature('GET', signatureEndpoint, transactionId, 'none', 'none', 0, timestamp);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: {
            'API-Key': this.apiKey,
            'Signature': signature,
            'Timestamp': timestamp.toString(),
            'Content-Type': 'application/json'
          }
        });
  
        if (!response.ok) {
          throw new Error(`Tillo API error: ${response.status}`);
        }
  
        const data = await response.json();
  
        return {
          transactionId,
          status: data.code === '000' ? 'completed' : 'pending',
          updatedAt: new Date()
        };
      } catch (error) {
        console.error('[TilloAdapter] Status check error:', error);
        return {
          transactionId,
          status: 'failed',
          updatedAt: new Date()
        };
      }
  }
  
  /**
   * Handle Webhook
   */
  async handleWebhook(payload: any): Promise<WebhookResponse> {
    console.log('[TilloAdapter] Webhook received:', payload);
    return {
      acknowledged: true,
      eventType: payload.event || 'unknown',
      processedAt: new Date()
    };
  }
  
  /**
   * Validate configuration
   */
  async validateConfig(): Promise<boolean> {
    return !!(this.apiKey && this.apiSecret);
  }
}
