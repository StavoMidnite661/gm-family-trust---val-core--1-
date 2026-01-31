
import { 
    IMerchantValueAdapter, 
    ValueRequest, 
    ValueResponse, 
    MerchantType, 
    AnchorType,
    ClearingStatus
} from '../../types';
import { 
    getNarrativeMirror, 
    NarrativeMirrorService 
} from '../core/narrative-mirror-service';
import { 
    createAnchorAuthorizationEntry, 
    createAnchorFulfillmentEntry,
    createClaimAssertionEntry 
} from '../shared/narrative-mirror-bridge';

export class PizzaAdapter implements IMerchantValueAdapter {
    name = 'Toast Pizza Connect';
    type = 'toast' as MerchantType;
    enabled = true;
    
    private narrativeMirror: NarrativeMirrorService;

    constructor() {
        this.narrativeMirror = getNarrativeMirror();
    }

    async issueValue(request: ValueRequest): Promise<ValueResponse> {
        // [DOCTRINE] 1. OBLIGATION: Acknowledgement of debt
        const eventId = `PIZZA-${Date.now()}`;
        const units = BigInt(Math.round(request.amount * 1_000_000));

        console.log(`[PizzaAdapter] 1. Creating Obligation for ${request.userId}`);
        await this.narrativeMirror.recordAnchorAuthorization({
            eventId,
            user: request.userId,
            anchorType: 'GROCERY', // Maps to Food/Grocery anchor
            units,
            expiry: Date.now() + 3600000 // 1 hour expiry
        });

        // [DOCTRINE] 2. INSTRUMENT GENERATION: Derive payment token from Ledger State
        // The "Instrument" is the verifiable proof of the obligation that Toast accepts.
        console.log(`[PizzaAdapter] 2. Generating Ledger-Backed Instrument`);
        const instrument = {
            type: 'LEDGER_PROOF',
            token: `TB-AUTH-${eventId}`, // This would be the "Encrypted Card Blob" in a real scenario
            value: units,
            expiry: Date.now() + 3600000
        };

        // [DOCTRINE] 3. TRANSFER: Movement of value (Simulated via Toast API)
        // We pass the Ledger Instrument to the external system
        console.log(`[PizzaAdapter] 3. Initiating Transfer with Instrument: ${instrument.token}`);
        const orderId = await this.mockToastApiCall(request.amount, instrument);

        // [DOCTRINE] 4. FINALITY: Immutable record of fulfillment
        console.log(`[PizzaAdapter] 4. Recording Finality`);
        await this.narrativeMirror.recordAnchorFulfillment(
            eventId,
            'GROCERY',
            units,
            `TOAST-PROOF-${orderId}`
        );

        // [DOCTRINE] 5. CLAIM: Assertion of rights to goods
        console.log(`[PizzaAdapter] 5. Asserting Claim`);
        await this.narrativeMirror.recordNarrativeEntry(
            createClaimAssertionEntry(
                orderId,
                request.userId,
                `Rights to 1x Large Pepperoni Pizza`,
                eventId
            )
        );

        return {
            success: true,
            transactionId: eventId,
            value: {
                type: 'voucher',
                code: orderId,
                balance: request.amount,
                redemptionInstructions: 'Valid for 1x Pizza at Toast Terminal'
            },
            timestamp: new Date()
        };
    }

    validateConfig(): Promise<boolean> {
        return Promise.resolve(true);
    }

    async checkStatus(transactionId: string): Promise<any> {
        return {
            transactionId,
            status: 'completed',
            updatedAt: new Date()
        };
    }

    async handleWebhook(payload: any): Promise<any> {
        return {
            acknowledged: true,
            eventType: payload.type || 'unknown',
            processedAt: new Date()
        };
    }

    private async mockToastApiCall(amount: number, instrument: any): Promise<string> {
        return new Promise(resolve => {
            console.log(`[ToastAPI] Processing payment with instrument verified by ledger...`);
            setTimeout(() => {
                resolve(`ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
            }, 800);
        });
    }
}
