
import { IMerchantValueAdapter, ValueRequest, ValueResponse, MerchantType } from '../types';

export class BaseMerchantAdapter implements IMerchantValueAdapter {
    protected configValidated: boolean = false;
    public lastValidatedAt?: Date;

    constructor(
        public name: string,
        public type: MerchantType,
        public enabled: boolean = true,
        public configParams: Record<string, string> = {}
    ) {}

    async validateConfig(): Promise<boolean> {
        console.log(`[${this.name}] Validating configuration...`);
        // Simulate environment and API key check
        this.configValidated = true;
        this.lastValidatedAt = new Date();
        return true;
    }

    async issueValue(request: ValueRequest): Promise<ValueResponse> {
        if (!this.configValidated) {
            throw new Error(`[${this.name}] Configuration not validated. Cannot execute honoring.`);
        }

        // Simulate network latency for external API call
        await new Promise(resolve => setTimeout(resolve, 1200)); 

        const prefix = this.type.slice(0, 3).toUpperCase();
        const mockCode = `${prefix}-${Math.random().toString(36).substr(2, 10).toUpperCase()}`;

        return {
            success: true,
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            value: {
                type: 'gift_card',
                code: mockCode,
                balance: request.amount,
                url: `https://sovr.network/redeem/${mockCode}`,
                redemptionInstructions: `Mechanical fulfillment complete. Credit of ${request.amount} ${request.currency} available for ${this.name}.`
            },
            timestamp: new Date()
        };
    }
}

export class InstacartZeroFloatAdapter extends BaseMerchantAdapter {
    constructor() {
        super('Instacart Zero-Float', 'instacart', true, {
            mode: 'zero-float',
            anchor: 'GROCERY',
            settlement: 'atomic'
        });
    }

    async issueValue(request: ValueRequest): Promise<ValueResponse> {
        console.log(`[Instacart] Issuing Zero-Float Grocery Credit: $${request.amount}`);
        const response = await super.issueValue(request);
        response.value.redemptionInstructions = "Apply to Instacart 'Credits' section in account settings. This is a pre-funded sovereign unit.";
        return response;
    }
}

export class AmazonAdapter extends BaseMerchantAdapter {
    constructor() {
        super('Amazon Fulfillment', 'amazon', true, {
            rail: 'tango-api',
            region: 'GLOBAL',
            catalog_id: 'AMZ-US-500'
        });
    }

    async issueValue(request: ValueRequest): Promise<ValueResponse> {
        console.log(`[Amazon] Clearing Mechanical Intent for Goods: $${request.amount}`);
        const response = await super.issueValue(request);
        response.value.redemptionInstructions = "Enter this claim code at amazon.com/gc/redeem. This intent is cryptographically signed by VAL-CORE.";
        return response;
    }
}

export class WalmartAdapter extends BaseMerchantAdapter {
    constructor() {
        super('Walmart Direct', 'walmart', true, {
            api_v: 'v1.4',
            distributor_id: 'SOVR-VAL-01'
        });
    }

    async issueValue(request: ValueRequest): Promise<ValueResponse> {
        console.log(`[Walmart] Authorizing Household Goods Fulfillment: $${request.amount}`);
        const response = await super.issueValue(request);
        response.value.redemptionInstructions = "Scan this barcode at any Walmart self-checkout or enter the PIN on walmart.com.";
        return response;
    }
}

export const defaultAdapters: IMerchantValueAdapter[] = [
    new BaseMerchantAdapter('Square Terminal', 'square', true, {
        environment: 'production',
        auth: 'oauth2'
    }),
    new BaseMerchantAdapter('Tango Global', 'tango', true, {
        platform: 'tangocard-r2',
        account: 'sovr-master'
    }),
    new InstacartZeroFloatAdapter(),
    new AmazonAdapter(),
    new WalmartAdapter()
];
