/**
 * Tillo API Full Demo
 * Demonstrates: Brands Discovery, Gift Card Issuance
 */
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.TILLO_API_KEY || '';
const apiSecret = process.env.TILLO_API_SECRET || '';
const sector = process.env.TILLO_SECTOR || 'consumer-rewards-and-incentives';
const baseUrl = 'https://sandbox.tillo.dev/api/v2';

// Generate proper UUID for client_request_id
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================
// 1. GET BRANDS - Discover available brands
// ============================================
async function getBrands(): Promise<any[]> {
    console.log('\n' + '='.repeat(60));
    console.log('📦 BRANDS DISCOVERY');
    console.log('='.repeat(60));
    
    const timestamp = Date.now().toString();
    // Brands endpoint: APIKey-GET-brands-timestamp
    const signatureString = `${apiKey}-GET-brands-${timestamp}`;
    const signature = crypto.createHmac('sha256', apiSecret).update(signatureString).digest('hex');
    
    const response = await fetch(`${baseUrl}/brands`, {
        headers: {
            'API-Key': apiKey,
            'Signature': signature,
            'Timestamp': timestamp,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });
    
    const data = await response.json();
    
    // Success is code "000" - brands are in data.data.brands as an object
    if (data.code === '000' && data.data?.brands) {
        const brandsObj = data.data.brands;
        const brands = Object.values(brandsObj) as any[];
        console.log(`\n✅ Found ${brands.length} brand(s):\n`);
        
        brands.forEach((brand: any, i: number) => {
            const status = brand.status?.code === 'ENABLED' ? '🟢' : '🔴';
            console.log(`   ${i+1}. ${status} ${brand.name}`);
            console.log(`      Slug: "${brand.slug}" | Type: ${brand.type} | Discount: ${brand.discount}%`);
            if (brand.digital_face_value_limits) {
                console.log(`      Value: $${brand.digital_face_value_limits.lower} - $${brand.digital_face_value_limits.upper} ${brand.currency}`);
            }
            console.log('');
        });
        
        return brands;
    } else {
        console.log(`❌ Error fetching brands: ${data.message}`);
        return [];
    }
}

// ============================================
// 2. ISSUE DIGITAL CODE - Create a gift card
// ============================================
async function issueDigitalCode(brand: string, amount: string, currency: string): Promise<any> {
    console.log('\n' + '='.repeat(60));
    console.log(`🎁 ISSUING GIFT CARD: ${brand}`);
    console.log('='.repeat(60));
    
    const clientRequestId = generateUUID();
    const timestamp = Date.now().toString();
    
    // POST signature: APIKey-POST-digital-issue-requestId-brand-currency-amount-timestamp
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
    
    console.log(`\n   Request ID: ${clientRequestId}`);
    console.log(`   Amount: ${currency} ${amount}`);
    
    const response = await fetch(`${baseUrl}/digital/issue`, {
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
        console.log(`\n   ✅ SUCCESS!`);
        console.log(`   ┌─────────────────────────────────────────────────────────`);
        console.log(`   │ Reference: ${data.data.reference}`);
        console.log(`   │ Reward URL: ${data.data.url}`);
        console.log(`   │ Face Value: ${data.data.face_value.currency} ${data.data.face_value.amount}`);
        console.log(`   │ Cost Value: ${data.data.cost_value.currency} ${data.data.cost_value.amount}`);
        console.log(`   │ Discount: ${data.data.discount}%`);
        console.log(`   │ Expires: ${data.data.expiration_date}`);
        console.log(`   │ Float Balance: ${data.data.float_balance.currency} ${data.data.float_balance.amount.toLocaleString()}`);
        console.log(`   └─────────────────────────────────────────────────────────`);
        return data.data;
    } else {
        console.log(`\n   ❌ ERROR: ${data.code} - ${data.message}`);
        return null;
    }
}

// ============================================
// MAIN DEMO
// ============================================
async function runDemo() {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║           TILLO API INTEGRATION DEMO                     ║');
    console.log('║           Gift Cards & Prepaid Cards                     ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`\n   API Key: ${apiKey.substring(0, 15)}...`);
    console.log(`   Sector: ${sector}`);
    console.log(`   Environment: Sandbox`);
    
    // Step 1: Discover brands
    const brands = await getBrands();
    
    if (brands.length === 0) {
        console.log('\n❌ No brands found. Cannot continue demo.');
        return;
    }
    
    // Step 2: Issue a gift card with open-sync-us (sync, $15)
    await issueDigitalCode('open-sync-us', '15', 'USD');
    
    // Step 3: Issue another card with digital-sync-us ($50)
    await issueDigitalCode('digital-sync-us', '50', 'USD');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEMO COMPLETE');
    console.log('='.repeat(60));
    console.log('\n   All Tillo API functions demonstrated successfully!');
    console.log('   Gift cards issued with reward URLs for redemption.\n');
}

// Run the demo
runDemo().catch(console.error);
