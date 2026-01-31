#!/usr/bin/env npx tsx
/**
 * fund_user_account.ts
 * 
 * Fund the user stablecoin account from a treasury/mint for testing.
 * 
 * USAGE: npx tsx scripts/fund_user_account.ts
 */

import { getTigerBeetle, LEDGER_IDS, ACCOUNT_CODES, TRANSFER_CODES } from '../val/clearing/tigerbeetle/client';

// Account IDs
const MINT_ACCOUNT = 9999n; // Treasury/Mint (can have unlimited credits)
const USER_STABLECOIN = 1010n;

const FUND_AMOUNT = 100_000_000_000n; // $100,000 in micro-units

async function main() {
    console.log('='.repeat(60));
    console.log('💰 Fund User Account from Treasury');
    console.log('='.repeat(60));

    const tigerBeetle = getTigerBeetle();
    
    // Step 1: Create Mint/Treasury account with debits_must_not_exceed_credits flag OFF
    console.log('\n[1/3] Creating Treasury/Mint account...');
    const mintAccount = {
        id: MINT_ACCOUNT,
        debits_pending: 0n, debits_posted: 0n,
        credits_pending: 0n, credits_posted: 0n,
        user_data_128: 0n, user_data_64: 0n, user_data_32: 0, reserved: 0,
        ledger: LEDGER_IDS.SOVR,
        code: ACCOUNT_CODES.TREASURY,
        flags: 0, // Allow debits to exceed credits (it's a mint!)
        timestamp: 0n,
    };
    
    await tigerBeetle.createAccounts([mintAccount]);
    console.log('    ✅ Treasury account created (or exists)');

    // Step 2: Transfer from Mint to User
    console.log('\n[2/3] Transferring funds to user...');
    const success = await tigerBeetle.createTransfer(
        MINT_ACCOUNT,
        USER_STABLECOIN,
        FUND_AMOUNT,
        LEDGER_IDS.SOVR,
        TRANSFER_CODES.DEPOSIT
    );
    console.log(`    Transfer: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Step 3: Verify balances
    console.log('\n[3/3] Verifying balances...');
    const userBalance = await tigerBeetle.getAccountBalance(USER_STABLECOIN);
    const mintBalance = await tigerBeetle.getAccountBalance(MINT_ACCOUNT);
    
    console.log(`    User Stablecoin: ${userBalance.available} (${Number(userBalance.available) / 1_000_000} USD)`);
    console.log(`    Treasury/Mint:   ${mintBalance.available} (should be negative)`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ User account funded!');
    console.log('='.repeat(60));
}

main().catch(console.error);
