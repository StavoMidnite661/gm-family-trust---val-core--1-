/**
 * Toast GraphQL Types
 * Type definitions for Toast POS GraphQL API interactions.
 * Generated/inferred from traffic inspection via gql-rip.
 */

// =========================================================================
// API Configuration
// =========================================================================

export interface ToastApiConfig {
    endpoint: string;
    headers: Record<string, string>;
    restaurantId: string;
    restaurantGuid: string;
}

// =========================================================================
// Menu & Product Types
// =========================================================================

export interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    modifierGroups?: ModifierGroup[];
}

export interface ModifierGroup {
    id: string;
    name: string;
    selectionType: 'SINGLE' | 'MULTI';
    modifiers: Modifier[];
}

export interface Modifier {
    id: string;
    name: string;
    priceAdjustment: number;
}

export interface PizzaConfiguration {
    size: 'SMALL' | 'MEDIUM' | 'LARGE';
    crust: 'THIN' | 'REGULAR' | 'THICK';
    toppings: string[]; // Modifier IDs
    quantity: number;
}

// =========================================================================
// Cart Types
// =========================================================================

export interface CartItem {
    menuItemId: string;
    quantity: number;
    modifiers: string[]; // Modifier IDs
    specialInstructions?: string;
}

export interface Cart {
    id: string;
    restaurantId: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
}

export interface CreateCartInput {
    restaurantId: string;
}

export interface AddItemToCartInput {
    cartId: string;
    item: CartItem;
}

// =========================================================================
// Payment Types
// =========================================================================

export interface PaymentMethod {
    id: string;
    type: 'CARD' | 'LEDGER_PROOF';
    // For CARD: This is the encrypted blob captured from browser
    encryptedPayload?: string;
    // For LEDGER_PROOF: This is the TigerBeetle-derived token
    ledgerToken?: string;
}

export interface PaymentIntent {
    id: string;
    cartId: string;
    amount: number;
    currency: string;
    status: 'CREATED' | 'REQUIRES_CONFIRMATION' | 'CONFIRMED' | 'FAILED';
}

export interface CreatePaymentIntentInput {
    cartId: string;
    paymentMethodId: string;
}

export interface ConfirmPaymentInput {
    paymentIntentId: string;
}

// =========================================================================
// Order Types
// =========================================================================

export interface Order {
    id: string;
    cartId: string;
    paymentIntentId: string;
    status: 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
}

export interface PlaceOrderInput {
    cartId: string;
    paymentIntentId: string;
}

// =========================================================================
// GraphQL Payload Templates
// =========================================================================

export const GRAPHQL_QUERIES = {
    GET_RESTAURANT: `
        query GetRestaurant($id: ID!) {
            restaurant(id: $id) {
                id
                name
                address
                isOpen
            }
        }
    `,
    GET_MENU: `
        query GetMenu($restaurantId: ID!) {
            menu(restaurantId: $restaurantId) {
                items {
                    id
                    name
                    price
                    modifierGroups {
                        id
                        name
                        modifiers { id name priceAdjustment }
                    }
                }
            }
        }
    `,
};

export const GRAPHQL_MUTATIONS = {
    CREATE_CART: `
        mutation CreateCart($input: CreateCartInput!) {
            createCart(input: $input) {
                id
                restaurantId
            }
        }
    `,
    ADD_ITEM_TO_CART: `
        mutation AddItemToCart($input: AddItemToCartInput!) {
            addItemToCart(input: $input) {
                id
                items { menuItemId quantity }
                total
            }
        }
    `,
    CREATE_PAYMENT_INTENT: `
        mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {
            createPaymentIntent(input: $input) {
                id
                amount
                status
            }
        }
    `,
    CONFIRM_PAYMENT: `
        mutation ConfirmPayment($input: ConfirmPaymentInput!) {
            confirmPayment(input: $input) {
                id
                status
            }
        }
    `,
    PLACE_ORDER: `
        mutation PlaceOrder($input: PlaceOrderInput!) {
            placeOrder(input: $input) {
                id
                status
                createdAt
            }
        }
    `,
};
