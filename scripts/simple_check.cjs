
const { createClient } = require('tigerbeetle-node');

// Configuration
const TB_CLUSTER_ID = 0n;
const TB_REPLICA_ADDRESSES = ['3000'];

// Account IDs
const ACCOUNTS = {
    ODFI: 1000n,
    USER: 1010n,
    GROCERY: 1001n,
    TREASURY: 9999n,
};

async function main() {
    console.log('='.repeat(60));
    console.log('🔍 TigerBeetle Final Balance Audit');
    console.log('='.repeat(60));

    const client = createClient({
        cluster_id: TB_CLUSTER_ID,
        replica_addresses: TB_REPLICA_ADDRESSES,
    });

    try {
        const ids = Object.values(ACCOUNTS);
        const accounts = await client.lookupAccounts(ids);
        
        console.log('\nAccount Status:');
        for (const [name, id] of Object.entries(ACCOUNTS)) {
            const acc = accounts.find(a => a.id === id);
            if (acc) {
                const bal = acc.credits_posted - acc.debits_posted;
                console.log(`    [${name.padEnd(8)}] ID ${id.toString().padEnd(5)}: ${bal.toString().padStart(12)} units ($${(Number(bal) / 1000000).toFixed(2)})`);
            } else {
                console.log(`    [${name.padEnd(8)}] ID ${id.toString().padEnd(5)}: NOT FOUND`);
            }
        }
    } catch (e) {
        console.error('❌ Audit Failed:', e);
    }

    console.log('\n' + '='.repeat(60));
    process.exit(0);
}

main();
