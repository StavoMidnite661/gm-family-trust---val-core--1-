// Instacart Zero-Float Adapter
// Integrates with Tango Card to fulfill grocery credits without pre-funding.
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

// Tango API Types
interface TangoOrderResult {
  referenceOrderID: string;
  reward: {
    credentials: {
      "PIN": string;
      [key: string]: any;
    };
  };
}

export class InstacartAdapter implements IMerchantValueAdapter {
  name = 'Instacart Zero-Float';
  type = 'instacart' as const;
  enabled = true;
  
  private anchorContractAddress: string;
  private narrativeMirror: NarrativeMirrorService;
  private tangoPlatformName: string;
  private tangoPlatformKey: string;
  private tangoBaseUrl: string;
  
  // Specific UTID for Instacart (From Tango Card catalog)
  private readonly INSTACART_UTID = process.env.INSTACART_UTID || 'U123456'; 
  
  constructor(
    anchorContractAddress: string = '0xANCHOR_CONTRACT_ADDRESS_PLACEHOLDER',
    tangoPlatformName?: string,
    tangoPlatformKey?: string,
    sandbox: boolean = true
  ) {
    this.anchorContractAddress = anchorContractAddress;
    this.narrativeMirror = getNarrativeMirror();
    this.tangoPlatformName = tangoPlatformName || process.env.TANGO_PLATFORM_NAME || 'mock_platform';
    this.tangoPlatformKey = tangoPlatformKey || process.env.TANGO_PLATFORM_KEY || 'mock_key';
    this.tangoBaseUrl = sandbox 
      ? 'https://integration-api.tangocard.com/raas/v2'
      : 'https://api.tangocard.com/raas/v2';
  }
  
  /**
   * Issue Instacart value via Anchor Contract + Tango Card
   * Flow:
   * 1. Log Anchor Authorization in Narrative Mirror (Obligation Creation)
   * 2. Call Tango Card API to issue gift card (Zero-Float)
   * 3. Log Anchor Fulfillment in Narrative Mirror (Obligation Settlement)
   */
  async issueValue(request: ValueRequest): Promise<ValueResponse> {
    const eventId = `AUTH-${Date.now()}-${Math.random().toString(36).substr(2,6)}`;
    
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
      
      // 2. ADAPTER EXECUTION (Tango Card API)
      const tangoResult = await this.callTangoApi(request.amount, request.userId, eventId);
      
      if (!tangoResult.success || !tangoResult.code) {
        throw new Error(tangoResult.error || 'Tango API failed');
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
          url: `https://instacart.com/redeem/${tangoResult.code}`, // Mock URL
          balance: request.amount,
          redemptionInstructions: 'Redeem in Instacart App -> Settings -> Credits. This is a Zero-Float generic credit.'
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('[InstacartAdapter] Error:', error);
      
      return {
        success: false,
        transactionId: eventId,
        value: { type: 'gift_card' },
        error: {
          code: 'INSTACART_FULFILLMENT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Call Tango Card API to issue Instacart gift card
   */
  private async callTangoApi(amount: number, userId: string, refId: string): Promise<{ success: boolean, code?: string, orderId?: string, error?: string }> {
    try {
      console.log(`[InstacartAdapter] Calling Tango API for $${amount}...`);

      const response = await fetch(`${this.tangoBaseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.tangoPlatformName}:${this.tangoPlatformKey}`).toString('base64')}`
        },
        body: JSON.stringify({
          accountIdentifier: userId,
          amount: amount,
          utid: this.INSTACART_UTID,
          recipient: {
            email: 'user@example.com', // Should come from request metadata
            firstName: 'User',
            lastName: 'Test'
          },
          notes: `Instacart grocery credit for ${userId}`,
          referenceOrderID: refId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Tango API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        code: data.reward?.credentials?.PIN || 'N/A',
        orderId: data.referenceOrderID
      };
    } catch (error) {
      console.error('[InstacartAdapter] Tango API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private generateProofHash(orderId: string): string {
    // Determine a hash (simulated)
    // In real world: keccak256(orderId + secret)
    return `0x${Buffer.from(orderId).toString('hex')}`.padEnd(66, '0');
  }
  
  async checkStatus(transactionId: string): Promise<TransactionStatus> {
    return {
      transactionId,
      status: 'completed',
      updatedAt: new Date()
    };
  }
  
  async handleWebhook(payload: any): Promise<WebhookResponse> {
    console.log('[InstacartAdapter] Webhook received', payload);
    return {
      acknowledged: true,
      eventType: 'ORDER_COMPLETED',
      processedAt: new Date()
    };
  }
  
  async validateConfig(): Promise<boolean> {
    return !!(this.tangoPlatformName && this.tangoPlatformKey);
  }
}
