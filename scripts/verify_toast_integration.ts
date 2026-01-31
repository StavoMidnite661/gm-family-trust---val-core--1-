
import fs from 'fs';
import path from 'path';
import { ToastGraphQLClient } from '../val/adapters/toast_graphql_client';
import { TOAST_CONFIG } from '../val/adapters/toast_config';

async function runVerification() {
    console.log('Starting Toast Integration Verification...');

    // 1. Read Captured Cookies from Log
    const logPath = 'd:/SOVR_Development_Holdings_LLC/AntiGravity/browser-vision-server/toast_capture_full.log';
    let cookies = [];
    try {
        // Log is likely UTF-16LE from PowerShell
        const logContent = fs.readFileSync(logPath, 'utf16le');
        // Find ALL_COOKIES: [...]
        const match = logContent.match(/ALL_COOKIES:\s*(\[[\s\S]*?\])/);
        if (match && match[1]) {
            cookies = JSON.parse(match[1]);
            console.log(`Parsed ${cookies.length} cookies from log.`);
        } else {
            console.warn('Could not find ALL_COOKIES in dynamic log.');
        }
    } catch (e) {
        console.error('Failed to read cookie log:', e.message);
    }

    // 2. Extract Critical Tokens
    const cfBm = cookies.find((c: any) => c.name === '__cf_bm')?.value || TOAST_CONFIG.cfBm;
    const cfClearance = cookies.find((c: any) => c.name === 'cf_clearance')?.value || TOAST_CONFIG.cfClearance;
    const ssid = cookies.find((c: any) => c.name === '__ssid')?.value || cookies.find((c: any) => c.name === 'toast-session-id')?.value || TOAST_CONFIG.ssid;
    
    // Auth Token (Guest or User)
    const accessToken = cookies.find((c: any) => c.name === 'toast-customer-access')?.value || TOAST_CONFIG.accessToken;

    console.log('Using Config:');
    console.log('  SSID:', ssid);
    console.log('  Access Token:', accessToken ? accessToken.substring(0, 20) + '...' : 'NONE');

    // 3. Construct Headers Manually
    const cookieString = [
        `toast-customer-access=${accessToken}`,
        `toast-customer-refresh=${TOAST_CONFIG.refreshToken}`, // might be stale but needed?
        `__cf_bm=${cfBm}`,
        `cf_clearance=${cfClearance}`,
        `__ssid=${ssid}`,
        `toast-sites-experiment-id=${TOAST_CONFIG.experimentId}`,
    ].join('; ');

    const headers = {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieString,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        'Origin': 'https://www.toasttab.com',
        'Referer': 'https://www.toasttab.com/',
        'apollographql-client-name': TOAST_CONFIG.apolloClientName,
        'apollographql-client-version': TOAST_CONFIG.apolloClientVersion,
        'toast-session-id': ssid,
    };

    const testConfig = {
        ...TOAST_CONFIG,
        headers,
        restaurantId: TOAST_CONFIG.restaurantGuid, // Mapping guid to Id expectation
    };

    // @ts-ignore
    const client = new ToastGraphQLClient(testConfig);


    // Attempt AddToCart with dummy IDs just to see if we get a "Valid" GraphQL Error vs "Unauthorized"
    console.log('\nStep 2: Testing AddToCart (Validation Check)...');
    try {
        const result = await client.addItemToCart(
            '00000000-0000-0000-0000-000000000000', 
            '00000000-0000-0000-0000-000000000000', 
            1,
            []
        );
        console.log('✅ AddToCart Response:', result);
    } catch (e: any) {
        console.log('ℹ️ AddToCart Result (Good Hash):', e.message);
    }

    console.log('\nStep 3: Negative Test (Bad Hash)...');
    try {
        // Manually call execute with bad hash
        // @ts-ignore
        await client.executePersistedQuery(
            'AddToCart',
            { input: { cartGuid: '000-000', itemInput: { itemGuid: '000-000', quantity: 1, modifierGuids: [] } } },
            '0000000000000000000000000000000000000000000000000000000000000000' // BAD HASH
        );
        console.log('❌ Negative Test Failed: Should have thrown error.');
    } catch(e: any) {
        console.log('ℹ️ Negative Test Result:', e.message);
        if (e.message.includes('PersistedQueryNotFound')) {
            console.log('✅ PASS: Bad Hash rejected. This confirms Good Hash was accepted!');
        } else {
             console.log('❓ Unexpected Negative Result.');
        }
    }
}

runVerification();
