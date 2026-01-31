import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.TILLO_API_KEY || '';
const apiSecret = process.env.TILLO_API_SECRET || '';

async function testSignature(name: string, signatureString: string) {
    const timestamp = Date.now().toString();
    const hash = crypto.createHmac('sha256', apiSecret).update(signatureString).digest('hex');

    console.log(`\nTesting: ${name}`);
    console.log(`String: ${signatureString}`);
    
    try {
        const response = await fetch('https://sandbox.tillo.dev/api/v2/brands', {
            headers: {
                'API-Key': apiKey,
                'Signature': hash,
                'Timestamp': timestamp,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log(`✅ SUCCESS! Status: ${response.status}`);
            const data = await response.json();
            console.log(`Brands found: ${data.brands?.length}`);
            if (data.brands?.length > 0) {
                console.log('Sample Brand:', data.brands[0].brand_code, data.brands[0].name);
            }
            return true;
        } else {
            const text = await response.text();
            console.log(`❌ FAILED: ${response.status} ${text}`);
            return false;
        }
    } catch (e) {
        console.log(`❌ ERROR: ${e}`);
        return false;
    }
}

async function runDiag() {
    const ts = Date.now().toString();

    // Variation 1: Key-GET-brands-TS (What I tried)
    await testSignature('Standard (Key-GET-brands-TS)', `${apiKey}-GET-brands-${ts}`);

    // Variation 2: Key-GET-api-v2-brands-TS
    await testSignature('Full Path (Key-GET-api-v2-brands-TS)', `${apiKey}-GET-api-v2-brands-${ts}`);

    // Variation 3: Key-GET-brands-none-none-TS (With placeholders)
    await testSignature('Placeholders (Key-GET-brands-none-none-TS)', `${apiKey}-GET-brands-none-none-${ts}`);

    // Variation 4: Key-GET-brands-none-none-none-0-TS (POST style)
    await testSignature('POST Style (Key-GET-brands-none-none-none-0-TS)', `${apiKey}-GET-brands-none-none-none-0-${ts}`);
}

runDiag();
