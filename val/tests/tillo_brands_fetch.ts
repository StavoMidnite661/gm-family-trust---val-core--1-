import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.TILLO_API_KEY || '';
const apiSecret = process.env.TILLO_API_SECRET || '';

async function fetchBrands() {
    console.log('=== Tillo Brands Discovery ===\n');
    
    const timestamp = Date.now().toString();
    
    // For GET brands: [API Key]-GET-brands-[timestamp] (simplest form)
    const signatureString = `${apiKey}-GET-brands-${timestamp}`;
    console.log(`Signature String: ${signatureString.substring(0, 50)}...`);
    
    const signature = crypto.createHmac('sha256', apiSecret).update(signatureString).digest('hex');
    
    try {
        const response = await fetch('https://sandbox.tillo.dev/api/v2/brands', {
            method: 'GET',
            headers: {
                'API-Key': apiKey,
                'Signature': signature,
                'Timestamp': timestamp,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log(`Response Status: ${response.status}`);
        
        const data = await response.json();
        
        if (response.ok && data.brands) {
            console.log(`\n✅ Found ${data.brands.length} brand(s):\n`);
            for (const brand of data.brands.slice(0, 20)) {
                console.log(`  - ${brand.name} => SLUG: "${brand.slug || brand.brand_code || brand.code || 'unknown'}"`);
            }
            return data.brands;
        } else {
            console.log(`\n❌ Error: ${data.code} - ${data.message}`);
            console.log(`Full response: ${JSON.stringify(data, null, 2)}`);
            return null;
        }
    } catch (e) {
        console.log(`❌ Fetch error: ${e}`);
        return null;
    }
}

fetchBrands();
