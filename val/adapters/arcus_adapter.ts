// Arcus Utility Bill Pay Adapter
// Integrates with Mastercard's Arcus platform for utility bill payments
// Handles electricity, water, gas, and other recurring bill payments

import { IMerchantValueAdapter, ValueRequest, ValueResponse, TransactionStatus, WebhookResponse, MerchantAdapterError } from '../merchant_triggers/adapter_interface';

export class ArcusAdapter implements IMerchantValueAdapter {
  name = 'Arcus Utility Bill Pay';
  type = 'arcus' as const;
  enabled = true;

  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(apiKey: string, apiSecret: string, sandbox: boolean = true) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = sandbox
      ? 'https://api-sandbox.arcusfi.com/v1'
      : 'https://api.arcusfi.com/v1';
  }

  /**
   * Issue utility bill payment via Arcus API
   */
  async issueValue(request: ValueRequest): Promise<ValueResponse> {
    try {
      console.log(`[ArcusAdapter] Processing utility bill payment for user ${request.userId} ($${request.amount})`);

      // Verify attestation
      if (!request.attestation) {
        throw new MerchantAdapterError(
          'Attestation required',
          'MISSING_ATTESTATION',
          'arcus'
        );
      }

      // Extract biller information from metadata
      const billerId = request.metadata.billerId || 'UNKNOWN';
      const accountNumber = request.metadata.accountNumber || 'UNKNOWN';

      if (billerId === 'UNKNOWN' || accountNumber === 'UNKNOWN') {
        throw new MerchantAdapterError(
          'Biller ID and account number required for utility payments',
          'MISSING_BILLER_INFO',
          'arcus'
        );
      }

      // Step 1: Fetch bill details
      const billDetails = await this.fetchBillDetails(billerId, accountNumber);

      // Step 2: Validate payment amount matches bill
      if (Math.abs(billDetails.amountDue - request.amount) > 0.01) {
        throw new MerchantAdapterError(
          `Payment amount $${request.amount} does not match bill amount $${billDetails.amountDue}`,
          'AMOUNT_MISMATCH',
          'arcus'
        );
      }

      // Step 3: Initiate payment
      const paymentResult = await this.initiatePayment(billerId, accountNumber, request.amount, request.userId);

      return {
        success: true,
        transactionId: paymentResult.paymentId,
        value: {
          type: 'utility_payment',
          balance: request.amount,
          redemptionInstructions: `Utility bill payment processed. Confirmation: ${paymentResult.confirmationId}`,
          metadata: {
            billerName: billDetails.billerName,
            accountNumber: accountNumber,
            serviceAddress: billDetails.serviceAddress,
            dueDate: billDetails.dueDate
          }
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[ArcusAdapter] Error:', error);
      return {
        success: false,
        transactionId: '',
        value: { type: 'utility_payment' },
        error: {
          code: 'ARCUS_API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Fetch bill details from Arcus
   */
  private async fetchBillDetails(billerId: string, accountNumber: string): Promise<{
    amountDue: number;
    billerName: string;
    serviceAddress: string;
    dueDate: string;
  }> {
    const response = await fetch(`${this.baseUrl}/billers/${billerId}/accounts/${accountNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Arcus API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      amountDue: data.amountDue,
      billerName: data.billerName,
      serviceAddress: data.serviceAddress,
      dueDate: data.dueDate
    };
  }

  /**
   * Initiate payment via Arcus
   */
  private async initiatePayment(billerId: string, accountNumber: string, amount: number, userId: string): Promise<{
    paymentId: string;
    confirmationId: string;
  }> {
    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        billerId: billerId,
        accountNumber: accountNumber,
        amount: amount,
        customerId: userId,
        paymentMethod: 'ACH', // Could be configurable
        memo: `SOVR Utility Payment - ${userId}`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Arcus payment error: ${response.status}`);
    }

    const data = await response.json();
    return {
      paymentId: data.paymentId,
      confirmationId: data.confirmationId
    };
  }

  /**
   * Check payment status
   */
  async checkStatus(transactionId: string): Promise<TransactionStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${transactionId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Arcus API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        transactionId,
        status: data.status.toLowerCase(), // 'initiated', 'processing', 'completed', 'failed'
        updatedAt: new Date(data.updatedAt)
      };
    } catch (error) {
      console.error('[ArcusAdapter] Status check error:', error);
      return {
        transactionId,
        status: 'failed',
        updatedAt: new Date()
      };
    }
  }

  /**
   * Handle Arcus webhook
   */
  async handleWebhook(payload: any): Promise<WebhookResponse> {
    console.log('[ArcusAdapter] Webhook received:', payload);

    return {
      acknowledged: true,
      eventType: payload.eventType || 'payment_update',
      processedAt: new Date()
    };
  }

  /**
   * Validate Arcus configuration
   */
  async validateConfig(): Promise<boolean> {
    return !!(this.apiKey && this.apiSecret);
  }
}
