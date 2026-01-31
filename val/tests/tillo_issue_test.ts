import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.TILLO_API_KEY || '';
const apiSecret = process.env.TILLO_API_SECRET || '';
const sector = process.env.TILLO_SECTOR || 'consumer-rewards-and-incentives';

// Verified sandbox brand slugs from GET /brands response
const VERIFIED_BRANDS = [
    'choiceplus-mock-us',  // ChoicePlus Mock USA - CHOICE-LINK type
    'open-sync-us',        // Open Sync USA - gift-card
    'digital-sync-us',     // Digital Top-Up Sync USA - gift-card
];

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function issueGiftCard(brand: string, amount: string, currency: string) {
    const clientRequestId = generateUUID();
    const timestamp = Date.now().toString();

    // Official signature format
    const signatureString = `${apiKey}-POST-digital-issue-${clientRequestId}-${brand}-${currency}-${amount}-${timestamp}`;
    const signature = crypto.createHmac('sha256', apiSecret).update(signatureString).digest('hex');
    
    const payload = {
        client_request_id: clientRequestId,
        brand: brand,
        face_value: {
            amount: amount,
            currency: currency
        },
        delivery_method: 'url',
        fulfilment_by: 'partner',
        sector: sector
    };

    console.log(`\n=== Issuing ${currency} ${amount} Gift Card (${brand}) ===`);
    console.log(`Client Request ID: ${clientRequestId}`);

    try {
        const response = await fetch('https://sandbox.tillo.dev/api/v2/digital/issue', {
            method: 'POST',
            headers: {
                'API-Key': apiKey,
                'Signature': signature,
                'Timestamp': timestamp,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.code === '000') {
            console.log(`\n✅ SUCCESS!`);
            console.log(`   Reference: ${data.reference}`);
            console.log(`   Reward URL: ${data.data?.reward?.url || data.reward?.url || 'Pending'}`);
            console.log(`   Status: ${data.data?.status || data.status || 'N/A'}`);
            console.log(`\nFull Response:`);
            console.log(JSON.stringify(data, null, 2));
            return true;
        } else {
            console.log(`\n❌ Error: ${data.code} - ${data.message}`);
            console.log(JSON.stringify(data, null, 2));
            return false;
        }
    } catch (e) {
        console.log(`❌ Fetch error: ${e}`);
        return false;
    }
}

async function runTest() {
    console.log('=== Tillo Gift Card Issuance Test ===');
    console.log(`API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`Sector: ${sector}`);

    // Test with a standard gift-card type brand
    await issueGiftCard('open-sync-us', '10', 'USD');
    
    // Also try digital-sync-us
    console.log('\n--- Testing with digital-sync-us ---');
    await issueGiftCard('digital-sync-us', '25', 'USD');
}

runTest();
