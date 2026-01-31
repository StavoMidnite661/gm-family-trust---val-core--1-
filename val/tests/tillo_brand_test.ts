import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.TILLO_API_KEY || '';
const apiSecret = process.env.TILLO_API_SECRET || '';
const sector = process.env.TILLO_SECTOR || 'consumer-rewards-and-incentives';

// Test brands - common sandbox slugs
const testBrands = [
    'choiceplus-mock-usa',
    'ChoicePlus Mock USA',  // Try exact name
    'choiceplus-us',
    'choiceplus',
    'mock-usa',
    'test-brand',
    'tillo-test',
];

async function testBrand(brand: string, useShortSignature: boolean) {
    const timestamp = Date.now().toString();
    const clientRequestId = `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const amount = '10';
    const currency = 'USD';

    // Two signature formats to test:
    // 1. Full (from api-examples): key-POST-digital-issue-requestId-brand-currency-amount-timestamp
    // 2. Short (from user's research): key-POST-digital-issue-requestId-brand-timestamp
    
    let signatureString: string;
    if (useShortSignature) {
        signatureString = `${apiKey}-POST-digital-issue-${clientRequestId}-${brand}-${timestamp}`;
    } else {
        signatureString = `${apiKey}-POST-digital-issue-${clientRequestId}-${brand}-${currency}-${amount}-${timestamp}`;
    }
    
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
        const sigType = useShortSignature ? 'SHORT' : 'FULL';
        
        if (data.code === '000') {
            console.log(`✅ SUCCESS [${sigType}] Brand: ${brand}`);
            console.log(`   Reference: ${data.reference}`);
            return true;
        } else if (data.code === '434') {
            console.log(`❌ AUTH FAILED [${sigType}] Brand: ${brand} - Signature format wrong`);
        } else if (data.code === '072') {
            console.log(`⚠️ BRAND NOT FOUND [${sigType}] Brand: ${brand} - Auth OK, brand not available`);
        } else {
            console.log(`❓ OTHER [${sigType}] Brand: ${brand} - ${data.code}: ${data.message}`);
        }
        return false;
    } catch (e) {
        console.log(`❌ ERROR: ${e}`);
        return false;
    }
}

async function runTests() {
    console.log('=== Tillo Brand & Signature Test ===\n');
    console.log(`API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`Sector: ${sector}\n`);

    // Test both signature formats with each brand
    for (const brand of testBrands) {
        // Test with FULL signature (includes currency and amount)
        await testBrand(brand, false);
        // Test with SHORT signature (no currency/amount)
        await testBrand(brand, true);
        console.log('');
    }
}

runTests();
