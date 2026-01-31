import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.TILLO_API_KEY || '';
const apiSecret = process.env.TILLO_API_SECRET || '';
const sector = process.env.TILLO_SECTOR || 'consumer-rewards-and-incentives';

// Generate proper UUID v4 (alphanumeric with hyphens only)
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Tillo slugs often follow these patterns based on display names
const brandSlugVariations = [
    'choiceplus-mock-usa',          // lowercase-hyphenated
    'choice-plus-mock-usa',         // word-separated
    'choiceplusmockusa',            // concatenated
    'choiceplus_mock_usa',          // underscore
    'ChoicePlusMockUSA',            // CamelCase
    'CHOICEPLUS-MOCK-USA',          // uppercase
    'cp-mock-usa',                  // abbreviation
    'choiceplus-us',                // shorter variant
    'tillo-sample-brand',           // sample brand
    'amazon-gb',                    // common test brand
    'amazon-us',                    // US variant
    'reward-pass',                  // prepaid card brand
    'tango-sample',                 // another provider's test
];

async function testBrandWithUUID(brand: string) {
    const clientRequestId = generateUUID();
    const timestamp = Date.now().toString();
    const amount = '10';
    const currency = 'USD';

    // Official signature format from api-examples
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
            console.log(`✅ SUCCESS! Brand: ${brand}`);
            console.log(`   UUID: ${clientRequestId}`);
            console.log(`   Reference: ${data.reference}`);
            console.log(`   Reward URL: ${data.reward?.url || 'N/A'}`);
            return true;
        } else if (data.code === '434') {
            console.log(`❌ AUTH: ${brand}`);
        } else if (data.code === '072') {
            console.log(`⚠️  NOT FOUND: ${brand}`);
        } else {
            console.log(`❓ ${data.code}: ${brand} - ${data.message}`);
        }
        return false;
    } catch (e) {
        console.log(`❌ ERROR: ${brand} - ${e}`);
        return false;
    }
}

async function runTests() {
    console.log('=== Tillo Brand Slug Discovery with UUID ===\n');
    console.log(`API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`Sector: ${sector}`);
    console.log(`Using proper UUID format for client_request_id\n`);

    let found = false;
    for (const brand of brandSlugVariations) {
        const success = await testBrandWithUUID(brand);
        if (success) {
            found = true;
            console.log(`\n🎉 Found working brand: ${brand}`);
            break;
        }
    }

    if (!found) {
        console.log('\n---');
        console.log('All tested slugs returned "brand not found".');
        console.log('The exact slug must be obtained from the Tillo Hub.');
        console.log('In the Signature Builder, look at the generated signature string');
        console.log('to see the exact brand slug being used.');
    }
}

runTests();
