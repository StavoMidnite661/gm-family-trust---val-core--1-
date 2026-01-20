// Moov Real-Time Fiat Rails Adapter
// Integrates with Moov for instant fiat disbursements via RTP, Visa Direct, and Mastercard Send
// Enables "Push-to-Card" and "Push-to-Account" for real-time value movement

import { IMerchantValueAdapter, ValueRequest, ValueResponse, TransactionStatus, WebhookResponse, MerchantAdapterError } from '../merchant_triggers/adapter_interface';

export class MoovAdapter implements IMerchantValueAdapter {
  name = 'Moov Real-Time Fiat Rails';
  type = 'moov' as const;
  enabled = true;

  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(apiKey: string, apiSecret: string, sandbox: boolean = true) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = sandbox
      ? 'https://api-sandbox.moov.com/v1'
      : 'https://api.moov.com/v1';
  }

  /**
   * Issue real-time fiat disbursement via Moov API
   */
  async issueValue(request: ValueRequest): Promise<ValueResponse> {
    try {
      console.log(`[MoovAdapter] Processing real-time disbursement for user ${request.userId} ($${request.amount})`);

      // Verify attestation
      if (!request.attestation) {
        throw new MerchantAdapterError(
          'Attestation required',
          'MISSING_ATTESTATION',
          'moov'
        );
      }

      // Extract destination information from metadata
      const destinationType = request.metadata.destinationType || 'card'; // 'card' or 'account'
      const destinationValue = request.metadata.destinationValue; // card number or account/routing

      if (!destinationValue) {
        throw new MerchantAdapterError(
          'Destination information required for fiat disbursement',
          'MISSING_DESTINATION',
          'moov'
        );
      }

      // Step 1: Create or retrieve Moov account for user
      const moovAccountId = await this.getOrCreateMoovAccount(request.userId);

      // Step 2: Initiate transfer
      const transferResult = await this.initiateTransfer(
        moovAccountId,
        destinationType,
        destinationValue,
        request.amount,
        request.userId
      );

      return {
        success: true,
        transactionId: transferResult.transferId,
        value: {
          type: 'fiat_disbursement',
          balance: request.amount,
          redemptionInstructions: `Real-time fiat disbursement initiated. Expected delivery: ${transferResult.estimatedDelivery}`,
          metadata: {
            destinationType: destinationType,
            network: transferResult.network,
            estimatedDelivery: transferResult.estimatedDelivery
          }
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[MoovAdapter] Error:', error);
      return {
        success: false,
        transactionId: '',
        value: { type: 'fiat_disbursement' },
        error: {
          code: 'MOOV_API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get or create Moov account for user
   */
  private async getOrCreateMoovAccount(userId: string): Promise<string> {
    // First try to find existing account
    try {
      const searchResponse = await fetch(`${this.baseUrl}/accounts?metadata.userId=${userId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`
        }
      });

      if (searchResponse.ok) {
        const accounts = await searchResponse.json();
        if (accounts.length > 0) {
          return accounts[0].accountId;
        }
      }
    } catch (error) {
      console.log('[MoovAdapter] Account search failed, creating new account');
    }

    // Create new account if not found
    const createResponse = await fetch(`${this.baseUrl}/accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountType: 'individual',
        profile: {
          individual: {
            name: {
              firstName: 'User',
              lastName: userId
            },
            email: `${userId}@sovr.example.com`
          }
        },
        metadata: {
          userId: userId,
          source: 'SOVR'
        }
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Moov account creation failed: ${createResponse.status}`);
    }

    const accountData = await createResponse.json();
    return accountData.accountId;
  }

  /**
   * Initiate transfer via Moov
   */
  private async initiateTransfer(
    sourceAccountId: string,
    destinationType: string,
    destinationValue: string,
    amount: number,
    userId: string
  ): Promise<{
    transferId: string;
    network: string;
    estimatedDelivery: string;
  }> {
    const transferPayload: any = {
      source: {
        accountId: sourceAccountId
      },
      destination: {},
      amount: {
        value: Math.round(amount * 100), // Convert to cents
        currency: 'USD'
      },
      description: `SOVR Disbursement - ${userId}`
    };

    if (destinationType === 'card') {
      transferPayload.destination.card = {
        number: destinationValue,
        cardOnFile: false
      };
      transferPayload.destination.cardVerification = {
        cvv: '123' // Would come from secure storage in production
      };
    } else if (destinationType === 'account') {
      const [accountNumber, routingNumber] = destinationValue.split(':');
      transferPayload.destination.ach = {
        accountNumber: accountNumber,
        routingNumber: routingNumber,
        accountType: 'checking'
      };
    }

    const response = await fetch(`${this.baseUrl}/transfers`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transferPayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Moov transfer error: ${response.status}`);
    }

    const data = await response.json();
    return {
      transferId: data.transferId,
      network: data.network || 'RTP',
      estimatedDelivery: data.estimatedDelivery || 'Instant'
    };
  }

  /**
   * Check transfer status
   */
  async checkStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/transfers/${transactionId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Moov API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        transactionId,
        status: data.status.toLowerCase(), // 'pending', 'completed', 'failed', 'cancelled'
        updatedAt: new Date(data.updatedAt)
      };
    } catch (error) {
      console.error('[MoovAdapter] Status check error:', error);
      return {
        transactionId,
        status: 'failed',
        updatedAt: new Date()
      };
    }
  }

  /**
   * Handle Moov webhook
   */
  async handleWebhook(payload: any): Promise<WebhookResponse> {
    console.log('[MoovAdapter] Webhook received:', payload);

    return {
      acknowledged: true,
      eventType: payload.eventType || 'transfer_update',
      processedAt: new Date()
    };
  }

  /**
   * Validate Moov configuration
   */
  async validateConfig(): Promise<boolean> {
    return !!(this.apiKey && this.apiSecret);
  }
}
