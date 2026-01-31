
const { createClient } = require('tigerbeetle-node');

// Configuration
const TB_CLUSTER_ID = 0n;
const TB_REPLICA_ADDRESSES = ['3000'];

// Ledger IDs
const LEDGER_IDS = {
  USD: 1,
  SOVR: 999,
  GROCERY_OBLIGATION: 1001,
};

// Account Codes
const ACCOUNT_CODES = {
  USER: 1,
  MERCHANT: 2,
  TREASURY: 3,
  ANCHOR: 6,
};

// Hardcoded account IDs from NARRATIVE_ACCOUNTS
const ACCOUNTS = {
    HONORING_ADAPTER_ODFI: 1000,
    HONORING_ADAPTER_STABLECOIN: 1010,
    OBSERVED_ANCHOR_GROCERY_OBLIGATION: 1001,
    OBSERVED_TOKEN_REALIZATION: 4000,
};

async function main() {
    console.log('='.repeat(60));
    console.log('🔧 TigerBeetle Account Initialization (Simple JS)');
    console.log('='.repeat(60));

    console.log(`Connecting to cluster ${TB_CLUSTER_ID} at ${TB_REPLICA_ADDRESSES}...`);
    
    const client = createClient({
        cluster_id: TB_CLUSTER_ID,
        replica_addresses: TB_REPLICA_ADDRESSES,
    });

    // Create accounts manually
    // DOCTRINE: For the clearing flow (User -> Obligation -> Merchant), 
    // all accounts must share the same Ledger ID (999) in TigerBeetle.
    const accounts = [
        // User Stablecoin (spending power)
        {
            id: BigInt(ACCOUNTS.HONORING_ADAPTER_STABLECOIN),
            debits_pending: 0n, debits_posted: 0n,
            credits_pending: 0n, credits_posted: 0n,
            user_data_128: 0n, user_data_64: 0n, user_data_32: 0, reserved: 0,
            ledger: LEDGER_IDS.SOVR,
            code: ACCOUNT_CODES.USER,
            flags: 0, timestamp: 0n,
        },
        // Merchant ODFI (realization)
        {
            id: BigInt(ACCOUNTS.HONORING_ADAPTER_ODFI),
            debits_pending: 0n, debits_posted: 0n,
            credits_pending: 0n, credits_posted: 0n,
            user_data_128: 0n, user_data_64: 0n, user_data_32: 0, reserved: 0,
            ledger: LEDGER_IDS.SOVR,
            code: ACCOUNT_CODES.MERCHANT,
            flags: 0, timestamp: 0n,
        },
        // Grocery Obligation
        {
            id: BigInt(ACCOUNTS.OBSERVED_ANCHOR_GROCERY_OBLIGATION),
            debits_pending: 0n, debits_posted: 0n,
            credits_pending: 0n, credits_posted: 0n,
            user_data_128: 0n, user_data_64: 0n, user_data_32: 0, reserved: 0,
            ledger: LEDGER_IDS.SOVR,
            code: ACCOUNT_CODES.ANCHOR,
            flags: 0, timestamp: 0n,
        },
    ];

    console.log('\n[1/2] Creating accounts...');
    try {
        const errors = await client.createAccounts(accounts);
        if (errors.length > 0) {
            console.log('⚠️ Account creation reported errors (may already exist):');
            console.log(errors);
        } else {
            console.log('✅ SUCCESS: Accounts created.');
        }
    } catch (e) {
        console.error('❌ CRITICAL ERROR:', e);
    }
    
    console.log('\n[2/2] Verifying balances...');
    for (const acc of accounts) {
        try {
            const result = await client.lookupAccounts([acc.id]);
            if (result.length > 0) {
                const balance = result[0];
                const available = balance.credits_posted - balance.debits_posted;
                console.log(`    Account ${acc.id}: ${available} available`);
            } else {
                console.log(`    Account ${acc.id}: NOT FOUND`);
            }
        } catch (e) {
            console.error(`    Account ${acc.id}: Lookup failed`, e);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TigerBeetle accounts ready!');
    console.log('='.repeat(60));
    
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
