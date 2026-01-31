
const { createClient } = require('tigerbeetle-node');

// Configuration
const TB_CLUSTER_ID = 0n;
const TB_REPLICA_ADDRESSES = ['3000'];

// Ledger IDs
const LEDGER_IDS = {
  SOVR: 999,
};

// Account Codes
const ACCOUNT_CODES = {
  USER: 1,
  MERCHANT: 2,
  TREASURY: 3,
};

// Transfer Codes
const TRANSFER_CODES = {
  DEPOSIT: 1,
};

// Account IDs
const MINT_ACCOUNT = 9999n;
const USER_STABLECOIN = 1010n;
const FUND_AMOUNT = 100_000_000_000n; // $100,000

async function main() {
    console.log('='.repeat(60));
    console.log('💰 Fund User Account from Treasury (Simple JS)');
    console.log('='.repeat(60));

    const client = createClient({
        cluster_id: TB_CLUSTER_ID,
        replica_addresses: TB_REPLICA_ADDRESSES,
    });

    // Step 1: Create Mint/Treasury account
    console.log('\n[1/3] Creating Treasury/Mint account...');
    const mintAccount = {
        id: MINT_ACCOUNT,
        debits_pending: 0n, debits_posted: 0n,
        credits_pending: 0n, credits_posted: 0n,
        user_data_128: 0n, user_data_64: 0n, user_data_32: 0, reserved: 0,
        ledger: LEDGER_IDS.SOVR,
        code: ACCOUNT_CODES.TREASURY,
        flags: 0, // Allow debits to exceed credits
        timestamp: 0n,
    };

    try {
        const errors = await client.createAccounts([mintAccount]);
        if (errors.length > 0) {
             // If error is "exists" (usually 1 or 21), ignore it
             console.log(`    ⚠️ Account creation note: ${JSON.stringify(errors)}`);
        } else {
            console.log('    ✅ Treasury account created.');
        }
    } catch (e) {
        console.error('    ❌ Error creating treasury:', e);
    }

    // Step 2: Transfer from Mint to User
    console.log('\n[2/3] Transferring funds to user...');
    
    const transferId = (BigInt(Date.now()) * 10000n + BigInt(Math.floor(Math.random() * 10000)));
    const transfer = {
        id: transferId,
        debit_account_id: MINT_ACCOUNT,
        credit_account_id: USER_STABLECOIN,
        amount: FUND_AMOUNT,
        pending_id: 0n,
        user_data_128: 0n, user_data_64: 0n, user_data_32: 0,
        timeout: 0,
        ledger: LEDGER_IDS.SOVR,
        code: TRANSFER_CODES.DEPOSIT,
        flags: 0,
        timestamp: 0n,
    };

    try {
        const transferErrors = await client.createTransfers([transfer]);
        if (transferErrors.length > 0) {
            console.error('    ❌ Transfer failed:', transferErrors);
        } else {
            console.log('    ✅ Transfer SUCCESS');
        }
    } catch (e) {
        console.error('    ❌ Transfer exception:', e);
    }

    // Step 3: Verify balances
    console.log('\n[3/3] Verifying balances...');
    try {
        const accounts = await client.lookupAccounts([USER_STABLECOIN, MINT_ACCOUNT]);
        
        // Helper to find account
        const getBal = (id) => {
            const acc = accounts.find(a => a.id === id);
            return acc ? (acc.credits_posted - acc.debits_posted) : 'NOT FOUND';
        };

        const userBal = getBal(USER_STABLECOIN);
        const mintBal = getBal(MINT_ACCOUNT);

        console.log(`    User Stablecoin: ${userBal} (${Number(userBal) / 1_000_000} USD)`);
        console.log(`    Treasury/Mint:   ${mintBal} (should be negative)`);
        
    } catch (e) {
        console.error('    ❌ Lookup failed:', e);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Funding complete!');
    console.log('='.repeat(60));
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
