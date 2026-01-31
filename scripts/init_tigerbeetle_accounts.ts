#!/usr/bin/env npx tsx
/**
 * init_tigerbeetle_accounts.ts
 * 
 * Initialize TigerBeetle accounts for SOVR clearing.
 * Uses explicit account IDs that match NARRATIVE_ACCOUNTS.
 * 
 * USAGE: npx tsx scripts/init_tigerbeetle_accounts.ts
 */

import { getTigerBeetle, LEDGER_IDS, ACCOUNT_CODES } from '../val/clearing/tigerbeetle/client';

// Hardcoded account IDs from NARRATIVE_ACCOUNTS
const ACCOUNTS = {
    HONORING_ADAPTER_ODFI: 1000,
    HONORING_ADAPTER_STABLECOIN: 1010,
    OBSERVED_ANCHOR_GROCERY_OBLIGATION: 1001,
    OBSERVED_TOKEN_REALIZATION: 4000,
};

async function main() {
    console.log('='.repeat(60));
    console.log('🔧 TigerBeetle Account Initialization');
    console.log('='.repeat(60));

    const tigerBeetle = getTigerBeetle();
    
    console.log('\n[1/2] Creating reference accounts...');
    // Use the service's built-in reference account initialization
    // which includes TREASURY, USER, MERCHANT, and ANCHORS
    await tigerBeetle.initializeReferenceAccounts();
    console.log('    Reference account initialization completed.');

    // Verify balances for key accounts to ensure they exist
    const accountsToCheck = [
        { id: BigInt(ACCOUNTS.HONORING_ADAPTER_STABLECOIN), name: 'User Stablecoin' },
        { id: BigInt(ACCOUNTS.HONORING_ADAPTER_ODFI), name: 'Merchant ODFI' },
        { id: BigInt(ACCOUNTS.OBSERVED_ANCHOR_GROCERY_OBLIGATION), name: 'Grocery Obligation' }
    ];

    console.log('\n[2/2] Verifying balances...');
    for (const acc of accountsToCheck) {
        const balance = await tigerBeetle.getAccountBalance(acc.id);
        console.log(`    Account ${acc.name} (${acc.id}): ${balance.available} available`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TigerBeetle accounts ready!');
    console.log('='.repeat(60));
}

main().catch(console.error);

