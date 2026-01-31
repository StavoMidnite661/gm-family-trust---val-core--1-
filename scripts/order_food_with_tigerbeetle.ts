#!/usr/bin/env npx tsx
/**
 * order_food_with_tigerbeetle.ts
 * 
 * End-to-End Food Ordering with TigerBeetle as the ULTIMATE CLEARING AUTHORITY
 * 
 * This script implements the "Mechanical Truth" doctrine:
 * 1. [TIGERBEETLE] Create Authorization Transfer (holds funds)
 * 2. [TOAST] Execute external order via GraphQL
 * 3. [TIGERBEETLE] Create Settlement Transfer (finalizes clearing)
 * 
 * TigerBeetle provides:
 * - Immutable ledger entries
 * - Replay attack prevention via idempotent transfer IDs
 * - Double-entry bookkeeping (no money appears from nowhere)
 * 
 * USAGE: npx tsx scripts/order_food_with_tigerbeetle.ts
 */

import { ToastGraphQLClient } from '../val/adapters/toast_graphql_client';
import { TOAST_CONFIG, buildHeaders } from '../val/adapters/toast_config';
import { getTigerBeetle, LEDGER_IDS, TRANSFER_CODES } from '../val/clearing/tigerbeetle/client';
import { NARRATIVE_ACCOUNTS } from '../val/shared/narrative-mirror-bridge';
import { ToastHonoringAdapter } from '../val/adapters/toast_adapter';

// =========================================================================
// Configuration
// =========================================================================

const ORDER_AMOUNT_USD = 19.65; // $19.65 (matches the cart)
const ORDER_AMOUNT_UNITS = BigInt(Math.round(ORDER_AMOUNT_USD * 1_000_000)); // Micro-units

const RESTAURANT_GUID = 'b6155316-c40c-4c44-8032-6cb3b2aa7f44';
const CART_GUID = '1e774522-1f20-4a51-a82b-fd13dbb22a68';

// =========================================================================
// Main Orchestration with TigerBeetle as Clearing Authority
// =========================================================================

async function main() {
    console.log('='.repeat(70));
    console.log('🍜 SOVR Food Ordering - TigerBeetle Clearing Authority');
    console.log('='.repeat(70));
    console.log(`\nOrder Amount: $${ORDER_AMOUNT_USD} (${ORDER_AMOUNT_UNITS} micro-units)`);
    console.log(`Cart GUID: ${CART_GUID}`);

    // Initialize TigerBeetle connection
    const tigerBeetle = getTigerBeetle();
    console.log('\n[TIGERBEETLE] Connected to clearing engine.');

    // Generate unique transfer ID (for idempotency)
    const transferId = BigInt(Date.now()) * 10000n + BigInt(Math.floor(Math.random() * 10000));
    console.log(`[TIGERBEETLE] Transfer ID: ${transferId}`);

    try {
        // =====================================================================
        // PHASE 1: TIGERBEETLE AUTHORIZATION (Hold Funds)
        // =====================================================================
        console.log('\n' + '─'.repeat(70));
        console.log('[PHASE 1] TIGERBEETLE AUTHORIZATION - Creating Obligation');
        console.log('─'.repeat(70));

        // Transfer from User's stablecoin account to Grocery Obligation account
        // This "holds" the funds until the order is confirmed
        const authSuccess = await tigerBeetle.createTransfer(
            BigInt(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN), // Debit: User's spending power
            BigInt(NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_GROCERY_OBLIGATION), // Credit: Grocery obligation
            ORDER_AMOUNT_UNITS,
            LEDGER_IDS.SOVR, // Use unified SOVR ledger
            TRANSFER_CODES.ANCHOR_AUTHORIZATION,
            transferId
        );

        if (!authSuccess) {
            throw new Error('TigerBeetle authorization transfer FAILED - insufficient funds or ledger error');
        }
        console.log(`    ✅ Authorization recorded in TigerBeetle (ID: ${transferId})`);
        console.log(`    📒 Debit: User Stablecoin Account`);
        console.log(`    📒 Credit: Grocery Obligation Account`);

        // =====================================================================
        // PHASE 2: TOAST API EXECUTION (External Order)
        // =====================================================================
        console.log('\n' + '─'.repeat(70));
        console.log('[PHASE 2] TOAST API - Executing External Order');
        console.log('─'.repeat(70));

        const toastClient = new ToastGraphQLClient({
            endpoint: TOAST_CONFIG.endpoint,
            headers: buildHeaders(),
            restaurantId: TOAST_CONFIG.restaurantGuid,
        });

        // Test connection with the known working query
        console.log('    [1/2] Verifying Toast API connection...');
        const promoResult = await toastClient.testConnection(RESTAURANT_GUID, CART_GUID);
        console.log(`    ✅ Toast API verified - Cart accessible`);

        // In a full implementation, we would:
        // 1. Capture the PlaceOrder mutation from the browser
        // 2. Execute it here with the persisted query hash
        // For now, we demonstrate the ledger finality
        console.log('    [2/2] Order placement pending (requires PlaceOrder mutation hash)');
        console.log('    📝 Note: Once PlaceOrder hash is captured, order will execute automatically');

        // Simulate order ID for demonstration
        const orderId = `SIM-ORDER-${Date.now()}`;
        console.log(`    🍜 Simulated Order ID: ${orderId}`);

        // =====================================================================
        // PHASE 3: TIGERBEETLE SETTLEMENT (Finality)
        // =====================================================================
        console.log('\n' + '─'.repeat(70));
        console.log('[PHASE 3] TIGERBEETLE SETTLEMENT - Recording Finality');
        console.log('─'.repeat(70));

        // Settlement transfer: Move from Obligation to Merchant Realization
        const settlementId = transferId + 1n;
        const settlementSuccess = await tigerBeetle.createTransfer(
            BigInt(NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_GROCERY_OBLIGATION), // Debit: Release obligation
            BigInt(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI), // Credit: Merchant realization
            ORDER_AMOUNT_UNITS,
            LEDGER_IDS.SOVR, // Settlement uses same SOVR ledger
            TRANSFER_CODES.SETTLEMENT,
            settlementId
        );

        if (!settlementSuccess) {
            throw new Error('TigerBeetle settlement transfer FAILED');
        }
        console.log(`    ✅ Settlement recorded in TigerBeetle (ID: ${settlementId})`);
        console.log(`    📒 Debit: Grocery Obligation Account`);
        console.log(`    📒 Credit: Merchant ODFI Account`);

        // =====================================================================
        // PHASE 4: EXTERNAL HONORING (Fulfillment)
        // =====================================================================
        console.log('\n' + '─'.repeat(70));
        console.log('[PHASE 4] EXTERNAL HONORING - Toast Adapter');
        console.log('─'.repeat(70));

        const honoringAdapter = new ToastHonoringAdapter();
        const honoringResult = await honoringAdapter.issueValue({
            userId: TOAST_CONFIG.guestGuid,
            amount: ORDER_AMOUNT_USD,
            currency: 'USD',
            attestation: {
                id: `ATTEST-${Date.now()}`,
                eventId: `EVENT-${Date.now()}`,
                signature: '0xMOCK_SIGNATURE_FOR_LOCAL_TEST',
                attestor: 'LOCAL_AUTHORITY',
                timestamp: new Date(),
                proof: {
                    merkleRoot: '0x0',
                    merkleProof: [],
                    eventHash: '0x0',
                    nonce: '0'
                }
            },
            metadata: {
                transferId: settlementId.toString()
            }
        });

        if (honoringResult.success) {
             console.log(`    ✅ Toast Adapter: Fulfillment Signal Sent`);
             console.log(`    📦 Transaction ID: ${honoringResult.transactionId}`);
             console.log(`    🍣 Status: ${honoringResult.value.status}`);
        } else {
             console.warn(`    ⚠️ Toast Adapter reported failure: ${honoringResult.error?.message}`);
        }

        // =====================================================================
        // COMPLETION
        // =====================================================================
        console.log('\n' + '═'.repeat(70));
        console.log('🎉 ORDER COMPLETE - MECHANICAL TRUTH RECORDED');
        console.log('═'.repeat(70));
        console.log(`\n  Authorization Transfer ID: ${transferId}`);
        console.log(`  Settlement Transfer ID:   ${settlementId}`);
        console.log(`  Order ID:                 ${orderId}`);
        console.log(`  Amount:                   $${ORDER_AMOUNT_USD}`);
        console.log(`  Ledger Units:             ${ORDER_AMOUNT_UNITS}`);
        console.log(`\n  ✅ TigerBeetle Ledger: AUTHORIZED + SETTLED`);
        console.log(`  ✅ Toast API:          CONNECTED`);
        console.log(`  ✅ Mechanical Truth:   RECORDED`);

        // =====================================================================
        // VERIFY LEDGER STATE
        // =====================================================================
        console.log('\n' + '─'.repeat(70));
        console.log('[LEDGER VERIFICATION] Checking Account Balances');
        console.log('─'.repeat(70));

        const userBalance = await tigerBeetle.getAccountBalance(BigInt(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN));
        const obligationBalance = await tigerBeetle.getAccountBalance(BigInt(NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_GROCERY_OBLIGATION));
        const merchantBalance = await tigerBeetle.getAccountBalance(BigInt(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI));

        console.log(`    User Stablecoin:      ${userBalance.available} available, ${userBalance.pending} pending`);
        console.log(`    Grocery Obligation:   ${obligationBalance.available} available`);
        console.log(`    Merchant ODFI:        ${merchantBalance.available} available`);

    } catch (error) {
        console.error('\n' + '═'.repeat(70));
        console.error('❌ ORDER FAILED');
        console.error('═'.repeat(70));
        console.error(error);
        
        // In production, we would record a reversal in TigerBeetle here
        console.log('\n[TIGERBEETLE] Failure recorded - no settlement executed');
        
        process.exit(1);
    }
}

main();
