
import fs from 'fs';
import { ToastGraphQLClient } from '../val/adapters/toast_graphql_client';
import { TOAST_CONFIG } from '../val/adapters/toast_config';
import { getTigerBeetle, LEDGER_IDS, ACCOUNT_CODES, TRANSFER_CODES } from '../val/clearing/tigerbeetle/client';
import { NARRATIVE_ACCOUNTS } from '../val/shared/narrative-mirror-bridge';

// --- CONFIGURATION ---
const COOKIE_LOG_PATH = 'd:/SOVR_Development_Holdings_LLC/AntiGravity/browser-vision-server/toast_capture_full.log';
const TEST_ITEM_GUID = '89808386-814d-4522-834c-6a759082729e'; // "Fountain medium" from previous logs if identifiable, else we rely on adapter defaults or random
// Actually, using a random GUID worked for AUTH check but returned "Forbidden". 
// To get a REAL price, we need a REAL item GUID. 
// From the Puppeteer log: "Fountain medium $3.00"
// But we don't have the GUID unless we extracted it (Inspector v3 prints hashes, not item GUIDs).
// However, the "Forbidden" error might block getting the total. 
// Let's assume for this step we might need to SIMULATE the price if we can't get it, 
// OR we use the adapter to try to fetch the menu first? 
// getMenu is not implemented with hash yet.
// We will proceed with the "Forbidden" check flow -> If forbidden, we assume a fallback price for the "Obligation" for demonstration.
const DEMO_PRICE_CENTS = 300n; // $3.00

async function main() {
    console.log('='.repeat(60));
    console.log('🏦 SOVR Settlement Obligation Creator');
    console.log('   Target: Food (Anchor Type: GROCERY)');
    console.log('='.repeat(60));

    // 1. Initialize TigerBeetle
    console.log('\n[1/4] Connecting to Ledger...');
    const tb = getTigerBeetle();
    
    // Ensure accounts exist (Idempotent)
    await tb.initializeReferenceAccounts();

    // 2. Initialize Toast Client (Auth)
    console.log('\n[2/4] Connecting to Toast Adapter...');
    let cookies = [];
    try {
        const logContent = fs.readFileSync(COOKIE_LOG_PATH, 'utf16le');
        const match = logContent.match(/ALL_COOKIES:\s*(\[[\s\S]*?\])/);
        if (match && match[1]) cookies = JSON.parse(match[1]);
    } catch (e) { console.warn('   ⚠️ Could not read cookie log'); }

    const accessToken = cookies.find((c: any) => c.name === 'toast-customer-access')?.value || TOAST_CONFIG.accessToken;
    const ssid = cookies.find((c: any) => c.name === '__ssid')?.value || TOAST_CONFIG.ssid;
    
    // quick header definition
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'toast-session-id': ssid,
        'apollographql-client-name': TOAST_CONFIG.apolloClientName,
        'apollographql-client-version': TOAST_CONFIG.apolloClientVersion,
    };
    
    // @ts-ignore
    const client = new ToastGraphQLClient({ ...TOAST_CONFIG, headers });

    // 3. Price Discovery (Toast)
    console.log('\n[3/4] Discovering Obligation Amount...');
    let amount = 0n;
    
    try {
        console.log('   requesting: AddToCart...');
        const cart = await client.addItemToCart(
            '00000000-0000-0000-0000-000000000000', 
            '00000000-0000-0000-0000-000000000000', 
            1
        );
        // If successful
        amount = BigInt(Math.round(cart.total * 100)); // Convert to cents
        console.log(`   ✅ REAL PRICE RECEIVED: $${(Number(amount)/100).toFixed(2)}`);
    } catch (e: any) {
        console.log(`   ⚠️ Toast API Restricted: ${e.message}`);
        console.log(`   Using Fallback Price: $${(Number(DEMO_PRICE_CENTS)/100).toFixed(2)}`);
        amount = DEMO_PRICE_CENTS;
    }

    // 4. Create Settlement Obligation (Ledger)
    console.log('\n[4/4] Creating Settlement Obligation (Ledger Transfer)...');
    
    // Debit User (1010) -> Credit Grocery Obligation (1001)
    // Code: ANCHOR_AUTHORIZATION (10)
    const success = await tb.createTransfer(
        BigInt(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN),
        BigInt(NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_GROCERY_OBLIGATION),
        amount,
        LEDGER_IDS.SOVR,
        TRANSFER_CODES.ANCHOR_AUTHORIZATION
    );

    if (success) {
        console.log('   ✅ TRANSFER SUCCESS');
        console.log(`   ----------------------------------------`);
        console.log(`   Debit:  Account ${NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN} (User Stablecoin)`);
        console.log(`   Credit: Account ${NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_GROCERY_OBLIGATION} (Grocery Obligation)`);
        console.log(`   Amount: $${(Number(amount)/100).toFixed(2)}`);
        console.log(`   Code:   ${TRANSFER_CODES.ANCHOR_AUTHORIZATION} (ANCHOR_AUTHORIZATION)`);
        console.log(`   ----------------------------------------`);
        console.log('   Ref: "Processing business services for food"');
    } else {
        console.error('   ❌ TRANSFER FAILED');
    }

    // Verify Balances
    const oblBalance = await tb.getAccountBalance(BigInt(NARRATIVE_ACCOUNTS.OBSERVED_ANCHOR_GROCERY_OBLIGATION));
    console.log(`\n   Current Obligation Balance: $${(Number(oblBalance.available)/100).toFixed(2)}`);
}

main().catch(console.error);
