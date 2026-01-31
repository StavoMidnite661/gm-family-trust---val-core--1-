#!/usr/bin/env npx tsx
/**
 * test_toast_connection.ts
 * Quick test to verify Toast API connection with persisted queries
 */

import { ToastGraphQLClient } from '../val/adapters/toast_graphql_client';
import { TOAST_CONFIG, buildHeaders } from '../val/adapters/toast_config';

async function main() {
    console.log('='.repeat(60));
    console.log('🔌 Testing Toast API Connection');
    console.log('='.repeat(60));

    const config = {
        endpoint: TOAST_CONFIG.endpoint,
        headers: buildHeaders(),
        restaurantId: TOAST_CONFIG.restaurantGuid,
    };

    const client = new ToastGraphQLClient(config);

    const restaurantGuid = 'b6155316-c40c-4c44-8032-6cb3b2aa7f44';
    const cartGuid = '1e774522-1f20-4a51-a82b-fd13dbb22a68';

    console.log(`\nRestaurant GUID: ${restaurantGuid}`);
    console.log(`Cart GUID: ${cartGuid}`);
    console.log(`Endpoint: ${TOAST_CONFIG.endpoint}`);

    try {
        console.log('\n[TEST] Calling RankedPromoOffer with persisted query...');
        const result = await client.testConnection(restaurantGuid, cartGuid);
        
        console.log('\n✅ SUCCESS! API responded:');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('\n❌ Failed:', error);
        process.exit(1);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Toast API connection verified!');
    console.log('='.repeat(60));
}

main();
