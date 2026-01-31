
const { createClient } = require('tigerbeetle-node');

// Configuration
const TB_CLUSTER_ID = 0n;
const TB_REPLICA_ADDRESSES = ['3000'];

// Ledger IDs
const LEDGER_IDS = { SOVR: 999 };

// Transfer Codes
const TRANSFER_CODES = {
  ANCHOR_AUTHORIZATION: 10,
  SETTLEMENT: 30,
};

// Account IDs
const USER_STABLECOIN = 1010n;
const GROCERY_OBLIGATION = 1001n;
const MERCHANT_ODFI = 1000n;

const ORDER_AMOUNT_USD = 19.65;
const ORDER_AMOUNT_UNITS = BigInt(Math.round(ORDER_AMOUNT_USD * 1_000_000));

async function main() {
    console.log('='.repeat(70));
    console.log('🍜 SOVR Food Ordering - TigerBeetle Clearing Authority (Simple JS)');
    console.log('='.repeat(70));
    console.log(`Order Amount: $${ORDER_AMOUNT_USD} (${ORDER_AMOUNT_UNITS} micro-units)`);

    const client = createClient({
        cluster_id: TB_CLUSTER_ID,
        replica_addresses: TB_REPLICA_ADDRESSES,
    });

    // Generate unique transfer ID
    const transferId = BigInt(Date.now()) * 10000n + BigInt(Math.floor(Math.random() * 10000));
    console.log(`
[TIGERBEETLE] Transfer ID: ${transferId}`);

    try {
        // =====================================================================
        // PHASE 1: TIGERBEETLE AUTHORIZATION
        // =====================================================================
        console.log('\n[PHASE 1] AUTHORIZATION - Creating Obligation');
        
        const authTransfer = {
            id: transferId,
            debit_account_id: USER_STABLECOIN,
            credit_account_id: GROCERY_OBLIGATION,
            amount: ORDER_AMOUNT_UNITS,
            pending_id: 0n,
            user_data_128: 0n, user_data_64: 0n, user_data_32: 0, timeout: 0,
            ledger: LEDGER_IDS.SOVR,
            code: TRANSFER_CODES.ANCHOR_AUTHORIZATION,
            flags: 0, timestamp: 0n,
        };

        const authErrors = await client.createTransfers([authTransfer]);
        if (authErrors.length > 0) throw new Error(`Auth failed: ${JSON.stringify(authErrors)}`);
        console.log(`    ✅ Authorization recorded. Funds moved to Obligation.`);

        // =====================================================================
        // PHASE 2: EXTERNAL API (Skipped - Missing Hashes)
        // =====================================================================
        console.log('\n[PHASE 2] TOAST API');
        console.log('    ⚠️ Skipping external call (Persisted Query Hashes missing).');
        console.log('    📝 Assuming external success for Mechanical Truth demonstration.');

        // =====================================================================
        // PHASE 3: TIGERBEETLE SETTLEMENT
        // =====================================================================
        console.log('\n[PHASE 3] SETTLEMENT - Finalizing Clearing');

        const settlementId = transferId + 1n;
        const settleTransfer = {
            id: settlementId,
            debit_account_id: GROCERY_OBLIGATION,
            credit_account_id: MERCHANT_ODFI,
            amount: ORDER_AMOUNT_UNITS,
            pending_id: 0n,
            user_data_128: 0n, user_data_64: 0n, user_data_32: 0, timeout: 0,
            ledger: LEDGER_IDS.SOVR,
            code: TRANSFER_CODES.SETTLEMENT,
            flags: 0, timestamp: 0n,
        };

        const settleErrors = await client.createTransfers([settleTransfer]);
        if (settleErrors.length > 0) throw new Error(`Settlement failed: ${JSON.stringify(settleErrors)}`);
        console.log(`    ✅ Settlement recorded. Obligation cleared to Merchant.`);

        // =====================================================================
        // VERIFY BALANCES
        // =====================================================================
        console.log('\n[VERIFICATION] Account Balances');
        
        const accounts = await client.lookupAccounts([USER_STABLECOIN, GROCERY_OBLIGATION, MERCHANT_ODFI]);
        const getBal = (id) => {
            const acc = accounts.find(a => a.id === id);
            return acc ? (acc.credits_posted - acc.debits_posted) : 'NOT FOUND';
        };

        console.log(`    User Stablecoin:    ${getBal(USER_STABLECOIN)}`);
        console.log(`    Grocery Obligation: ${getBal(GROCERY_OBLIGATION)} (Should be 0)`);
        console.log(`    Merchant ODFI:      ${getBal(MERCHANT_ODFI)} (Should be ${ORDER_AMOUNT_UNITS})`);

        console.log('\n' + '═'.repeat(70));
        console.log('🎉 ORDER COMPLETE - MECHANICAL TRUTH RECORDED');
        console.log('═'.repeat(70));
        process.exit(0);

    } catch (e) {
        console.error('\n❌ ORDER FAILED:', e);
        process.exit(1);
    }
}

main();
