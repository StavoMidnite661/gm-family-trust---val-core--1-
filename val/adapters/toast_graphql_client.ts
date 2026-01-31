/**
 * Toast GraphQL Client
 * Handles all HTTP interactions with the Toast POS GraphQL API.
 * Uses Apollo Persisted Queries format per CJ's method.
 */

import {
    ToastApiConfig,
    Cart,
    MenuItem,
    PaymentIntent,
    Order,
} from './toast_graphql_types';

// Known Persisted Query Hashes (captured from browser traffic)
// Known Persisted Query Hashes (captured from browser traffic)
const PERSISTED_QUERIES = {
    RANKED_PROMO_OFFER: 'b3da12e0a17bcb40df8b871b23205e2c52a43f80',
    PAGINATED_MENU_ITEMS: 'd25b55329e4d12c563e9e68935d797aef1580b92',
    MENU_ITEM_DETAILS: 'eae28864828810902ed1058f9857621f47fc842e',
    ADD_TO_CART: '4c2522284d144f3ec2f9d3d2518985353681ccc2',
    GET_CART: '421fb02609f76cbbe51155634828237e59261b36',
    RESTAURANT: '525542dec492a54f5b7112b1fbb8d71b1c1210a8',
    // PLACE_ORDER? Still missing, but we can verify integration with above first.
};

export class ToastGraphQLClient {
    private config: ToastApiConfig;

    constructor(config: ToastApiConfig) {
        this.config = config;
    }

    /**
     * Generic GraphQL request executor using Persisted Query format
     */
    private async executePersistedQuery<T>(
        operationName: string, 
        variables: Record<string, unknown>,
        sha256Hash: string,
        operationHeader?: string
    ): Promise<T> {
        const payload = [{
            operationName,
            variables,
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash
                }
            }
        }];

        const headers = {
            ...this.config.headers,
            'toast-graphql-operation': operationHeader || operationName,
            'toast-persistent-query-hash': sha256Hash,
        };

        const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        // Handle array response (batch format)
        const data = Array.isArray(result) ? result[0] : result;
        
        if (data.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        return data.data;
    }

    /**
     * Test the connection with a known working query
     */
    async testConnection(restaurantGuid: string, cartGuid: string): Promise<unknown> {
        return this.executePersistedQuery(
            'RankedPromoOffer',
            {
                input: {
                    restaurantGuid,
                    requestSource: 'online_ordering',
                    cartGuid
                }
            },
            PERSISTED_QUERIES.RANKED_PROMO_OFFER
        );
    }

    // =========================================================================
    // Menu Operations - Placeholder (need to capture persisted query hash)
    // =========================================================================

    async getMenu(): Promise<MenuItem[]> {
        const response = await this.executePersistedQuery<any>(
            'PaginatedMenuItemsWithPopularItems',
            {
                input: {
                    restaurantGuid: this.config.restaurantGuid,
                    requestSource: 'online_ordering',
                    visibility: 'ONLINE',
                    salesCategoryIds: []
                },
                offset: 0,
                limit: 50
            },
            PERSISTED_QUERIES.PAGINATED_MENU_ITEMS
        );

        // Map the complex GraphQL response to simple MenuItem objects
        // Structure assumption: items[] or similar in response
        // Based on hash capture name, likely paginated format
        try {
            const items = response?.items || response?.menuItems || [];
            return items.map((i: any) => ({
                id: i.guid,
                name: i.name,
                price: i.price?.amount || 0,
                description: i.description,
            }));
        } catch (e) {
            console.warn('Failed to parse menu response', e);
            return [];
        }
    }

    // =========================================================================
    // Cart Operations - Placeholder
    // =========================================================================

    async createCart(): Promise<Cart> {
        // Placeholder - need to capture the CreateCart persisted query
        return { id: 'placeholder', restaurantId: '', items: [], subtotal: 0, tax: 0, total: 0 };
    }

    async addItemToCart(cartId: string, menuItemId: string, quantity: number, modifiers: string[] = []): Promise<Cart> {
        return this.executePersistedQuery<Cart>(
            'AddToCart',
            {
                input: {
                    cartGuid: cartId,
                    itemInput: {
                        itemGuid: menuItemId,
                        quantity,
                        modifierGuids: modifiers, // Check if API expects this format
                        courseGuid: null,
                        diningOptionGuid: null
                    }
                }
            },
            PERSISTED_QUERIES.ADD_TO_CART
        );
    }

    // =========================================================================
    // Payment Operations - Placeholder
    // =========================================================================

    async createPaymentIntent(cartId: string, paymentMethodId: string): Promise<PaymentIntent> {
        return { id: 'placeholder', cartId, amount: 0, currency: 'USD', status: 'CREATED' };
    }

    async confirmPayment(paymentIntentId: string): Promise<PaymentIntent> {
        return { id: paymentIntentId, cartId: '', amount: 0, currency: 'USD', status: 'CONFIRMED' };
    }

    // =========================================================================
    // Order Finalization - Placeholder
    // =========================================================================

    async placeOrder(cartId: string, paymentIntentId: string): Promise<Order> {
        return { id: 'placeholder', cartId, paymentIntentId, status: 'PLACED', createdAt: new Date().toISOString() };
    }
}

