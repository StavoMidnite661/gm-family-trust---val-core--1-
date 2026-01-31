#!/usr/bin/env npx tsx
import { getTigerBeetle, LEDGER_IDS } from '../val/clearing/tigerbeetle/client';

const ACCOUNTS = {
    USER: 1010n,
    MERCHANT: 1000n,
    OBLIGATION: 1001n,
    TREASURY: 9999n
};

async function main() {
    const tigerBeetle = getTigerBeetle();
    console.log('='.repeat(60));
    console.log('🏛️ TigerBeetle Final Balance Audit');
    console.log('='.repeat(60));

    for (const [name, id] of Object.entries(ACCOUNTS)) {
        const balance = await tigerBeetle.getAccountBalance(id);
        const usd = Number(balance.available) / 1_000_000;
        console.log(`${name.padEnd(12)} (${id}): ${balance.available.toString().padStart(15)} units ($${usd.toFixed(2)})`);
    }
    console.log('='.repeat(60));
}

main().catch(console.error);
