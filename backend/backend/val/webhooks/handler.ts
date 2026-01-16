// Webhook Handler Mini-Service
// Receives webhook notifications from anchor adapters (Tango, Square, etc.)
//
// -----------------------------------------------------------------------------
// SOVR CANON NOTICE
// -----------------------------------------------------------------------------
// Webhooks are for OBSERVATION ONLY - they never affect ledger state
// All authoritative state is in TigerBeetle
// -----------------------------------------------------------------------------

import express from 'express';
import crypto from 'crypto';

interface WebhookConfig {
  port: number;
  secret: string;
  verifySignatures: boolean;
}

export class WebhookService {
  private app: express.Express;
  private config: WebhookConfig;
  private adapters: Map<string, any>;

  constructor(config: WebhookConfig) {
    this.config = config;
    this.adapters = new Map();

    this.app = express();

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Register an adapter to handle specific webhook events
   */
  registerAdapter(name: string, adapter: any): void {
    this.adapters.set(name, adapter);
    console.log(`[WebhookService] Registered adapter: ${name}`);
  }

  /**
   * Setup middleware for security and logging
   */
  private setupMiddleware(): void {
    // JSON parsing
    this.app.use(express.json({ limit: '1mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      console.log(`[WebhookService] ${req.method} ${req.path} from ${req.ip}`);

      // Attach start time to request
      (req as any).startTime = startTime;

      next();
    });

    // Response logging
    this.app.use((req, res, next) => {
      const startTime = (req as any).startTime;

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[WebhookService] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
      });

      next();
    });
  }

  /**
   * Setup webhook routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date() });
    });

    // Generic webhook endpoint for all adapters
    this.app.post('/webhook/:adapter', async (req, res) => {
      const adapterName = req.params.adapter;
      const payload = req.body;

      console.log(`[WebhookService] Received webhook for ${adapterName}:`, {
        type: payload.eventType || payload.type,
        id: payload.id || payload.referenceOrderID,
      });

      try {
        // Verify signature if enabled
        if (this.config.verifySignatures) {
          const signature = req.headers['x-webhook-signature'] as string;
          if (!this.verifySignature(signature, JSON.stringify(payload))) {
            console.warn('[WebhookService] Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
          }
        }

        // Route to appropriate adapter
        const adapter = this.adapters.get(adapterName);

        if (!adapter) {
          console.warn(`[WebhookService] No adapter registered for: ${adapterName}`);
          return res.status(404).json({ error: 'Adapter not found' });
        }

        // Forward to adapter handler
        if (typeof adapter.handleWebhook === 'function') {
          const result = await adapter.handleWebhook(payload);

          if (result.acknowledged) {
            res.status(200).json({
              received: true,
              processedAt: result.processedAt,
            });
          } else {
            res.status(500).json({
              error: 'Failed to process webhook',
            });
          }
        } else {
          console.warn(`[WebhookService] Adapter ${adapterName} does not implement handleWebhook`);
          res.status(500).json({ error: 'Adapter method not implemented' });
        }

      } catch (error: any) {
        console.error('[WebhookService] Error processing webhook:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message,
        });
      }
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(signature: string | undefined, payload: string): boolean {
    if (!signature || !this.config.secret) {
      // If no secret configured, skip verification
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.config.secret)
      .update(payload)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(signature, expectedSignature);
  }

  /**
   * Start the webhook service
   */
  start(): void {
    const port = this.config.port;
    this.app.listen(port, () => {
      console.log(`[WebhookService] Webhook service listening on port ${port}`);
      console.log(`[WebhookService] Signature verification: ${this.config.verifySignatures ? 'ENABLED' : 'DISABLED'}`);
      console.log(`[WebhookService] Registered adapters: ${Array.from(this.adapters.keys()).join(', ')}`);
    });
  }

  /**
   * Get Express app (for testing or integration)
   */
  getApp(): express.Express {
    return this.app;
  }
}

// ============================================================================
// SERVICE ENTRY POINT
// ============================================================================

if (require.main === module) {
  const webhookService = new WebhookService({
    port: parseInt(process.env.WEBHOOK_PORT || '3002'),
    secret: process.env.WEBHOOK_SECRET || 'change_me_in_production',
    verifySignatures: process.env.VERIFY_WEBHOOK_SIGNATURES === 'true',
  });

  webhookService.start();
}

export { WebhookService };
