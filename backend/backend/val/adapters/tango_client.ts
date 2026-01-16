// Real-World Tango Card API Client
// Production-ready implementation for gift card issuance
//
// -----------------------------------------------------------------------------
// SOVR CANON NOTICE
// -----------------------------------------------------------------------------
// Zero-Float Fulfillment: No pre-funding required
// Clearing: Net-based (clear what's actually fulfilled)
// -----------------------------------------------------------------------------

/**
 * Tango Card API Configuration
 */
export interface TangoCardConfig {
  platformName: string;
  platformKey: string;
  accountId: string;
  sandbox?: boolean;
  baseUrl?: string;
}

/**
 * Tango Card API Request
 */
interface TangoCardOrderRequest {
  accountIdentifier: string;
  amount: number;
  campaign?: string;
  emailSubject?: string;
  externalRefID: string;
  message?: string;
  recipient?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  reward: {
    brandName: string;
    utid: string;
  };
  sendEmail?: boolean;
}

/**
 * Tango Card API Response
 */
interface TangoCardOrderResponse {
  referenceOrderID: string;
  status: string;
  reward?: {
    credentials: {
      PIN: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Order Status Response
 */
interface TangoCardOrderStatus {
  referenceOrderID: string;
  status: 'NEW' | 'PENDING' | 'FUNDED' | 'PROCESSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  createdTimestamp: string;
  lastUpdatedTimestamp: string;
  amount?: number;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Error Types
 */
export class TangoCardError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'TangoCardError';
  }
}

/**
 * Real-world Tango Card API Client
 */
export class TangoCardClient {
  private config: Required<TangoCardConfig>;
  private baseUrl: string;

  constructor(config: TangoCardConfig) {
    this.config = {
      platformName: config.platformName,
      platformKey: config.platformKey,
      accountId: config.accountId,
      sandbox: config.sandbox ?? false,
    };

    // Set base URL (sandbox vs production)
    this.baseUrl = config.baseUrl ||
      (config.sandbox
        ? 'https://integration-api.tangocard.com/raas/v2'
        : 'https://api.tangocard.com/raas/v2'
      );
  }

  /**
   * Issue a gift card order
   */
  async issueGiftCard(params: {
    amount: number;
    utid: string;
    brandName: string;
    email: string;
    firstName?: string;
    lastName?: string;
    externalRefId?: string;
  }): Promise<{
    success: boolean;
    code?: string;
    orderId?: string;
    error?: string;
  }> {
    try {
      console.log(`[TangoCardClient] Issuing gift card for $${params.amount}`);

      // Validate amount
      if (params.amount <= 0 || params.amount > 10000) {
        throw new Error('Amount must be between $0.01 and $10,000');
      }

      // Validate UTID
      if (!params.utid || params.utid.length < 3) {
        throw new Error('Invalid UTID format');
      }

      const request: TangoCardOrderRequest = {
        accountIdentifier: this.config.accountId,
        amount: params.amount,
        campaign: 'SOVR_GROCERY',
        emailSubject: 'Your Grocery Credit',
        externalRefID: params.externalRefId || `SOVR-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
        message: 'Grocery credit from SOVR',
        recipient: {
          email: params.email,
          firstName: params.firstName,
          lastName: params.lastName,
        },
        reward: {
          brandName: params.brandName,
          utid: params.utid,
        },
        sendEmail: true,
      };

      const response = await this.callAPI<TangoCardOrderResponse>('/orders', {
        method: 'POST',
        body: request,
      });

      // Handle API-level errors
      if (response.error) {
        console.error('[TangoCardClient] API error:', response.error);
        return {
          success: false,
          error: response.error.message || 'Unknown API error',
        };
      }

      // Extract gift card code
      const code = response.reward?.credentials?.PIN;

      if (!code) {
        console.error('[TangoCardClient] No PIN in response');
        return {
          success: false,
          error: 'No gift card code in response',
        };
      }

      console.log(`[TangoCardClient] Order created: ${response.referenceOrderID}`);

      return {
        success: true,
        code: code,
        orderId: response.referenceOrderID,
      };

    } catch (error: any) {
      console.error('[TangoCardClient] Error issuing gift card:', error);

      // Map specific error codes
      if (error instanceof TangoCardError) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Check order status
   */
  async getOrderStatus(orderId: string): Promise<TangoCardOrderStatus> {
    try {
      console.log(`[TangoCardClient] Checking order status: ${orderId}`);

      const response = await this.callAPI<TangoCardOrderStatus>(`/orders/${orderId}`);

      return response;

    } catch (error: any) {
      console.error('[TangoCardClient] Error checking order status:', error);

      if (error instanceof TangoCardError) {
        throw error;
      }

      throw new Error(error.message || 'Unknown error');
    }
  }

  /**
   * Generic API call method with retry logic
   */
  private async callAPI<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST';
      body?: any;
      retries?: number;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, retries = 3 } = options;
    const maxRetries = this.config.sandbox ? 2 : retries; // Fewer retries in sandbox

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        };

        // Add authentication
        const auth = Buffer.from(`${this.config.platformName}:${this.config.platformKey}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;

        const fetchOptions: RequestInit = {
          method,
          headers,
        };

        if (body && method === 'POST') {
          fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);

        // Handle HTTP errors
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;

          // Parse error body if available
          if (response.headers.get('content-type')?.includes('application/json')) {
            try {
              const errorData = await response.json();
              errorMessage = errorData.error?.message || errorMessage;
            } catch (e) {
              // Ignore JSON parse errors
            }
          }

          // Special handling for rate limits
          if (response.status === 429) {
            throw new TangoCardError(
              'Rate limit exceeded. Please retry later.',
              'RATE_LIMIT_EXCEEDED',
              response.status
            );
          }

          // Special handling for unauthorized
          if (response.status === 401 || response.status === 403) {
            throw new TangoCardError(
              'Authentication failed. Check platform credentials.',
              'AUTH_FAILED',
              response.status
            );
          }

          throw new TangoCardError(errorMessage, 'HTTP_ERROR', response.status);
        }

        const data = await response.json();
        return data;

      } catch (error: any) {
        lastError = error;

        // Log retry attempt
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff
          console.warn(`[TangoCardClient] Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);

          await this.sleep(delay);
        } else {
          console.error(`[TangoCardClient] All ${maxRetries} attempts failed`);
          throw error;
        }
      }
    }

    throw lastError || new Error('Unknown error in API call');
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate configuration
   */
  validateConfig(): boolean {
    return !!(
      this.config.platformName &&
      this.config.platformKey &&
      this.config.accountId
    );
  }

  /**
   * Get environment info
   */
  getEnvironment(): { sandbox: boolean; baseUrl: string } {
    return {
      sandbox: this.config.sandbox ?? false,
      baseUrl: this.baseUrl,
    };
  }
}
