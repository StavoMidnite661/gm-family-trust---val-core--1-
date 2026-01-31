// Tillo Adapter Test Script
import dotenv from 'dotenv';
import { TilloAdapter } from '../adapters/tillo_adapter';
import { ValueRequest } from '../merchant_triggers/adapter_interface';
import { ethers } from 'ethers';

dotenv.config({ path: '.env.local' });

async function runTest() {
    console.log('--- Tillo Adapter Test ---');

    const apiKey = process.env.TILLO_API_KEY || '';
    const apiSecret = process.env.TILLO_API_SECRET || '';
    
    if (!apiKey || !apiSecret) {
        console.error('Missing API Key or Secret in .env.local');
        process.exit(1);
    }

    const sector = process.env.TILLO_SECTOR || 'consumer-rewards-and-incentives';
    const adapter = new TilloAdapter(apiKey, apiSecret, true, sector);
    
    console.log('\n0. Fetching available brands for discovery...');
    const timestamp = Date.now();
    const brandsResponse = await fetch('https://sandbox.tillo.dev/api/v2/brands', {
        headers: {
            'API-Key': apiKey,
            // GET signature: API-Key + Method + Endpoint + Timestamp (params skipped if empty)
            'Signature': (adapter as any).generateSignature('GET', 'brands', '', '', '', 0, timestamp),
            'Timestamp': timestamp.toString(),
            'Content-Type': 'application/json'
        }
    });

    if (brandsResponse.ok) {
        const brands = await brandsResponse.json();
        console.log('Available Brands Count:', brands.brands?.length);
        const rewardPass = brands.brands?.find((b: any) => b.name.toLowerCase().includes('reward') || b.name.toLowerCase().includes('mastercard') || b.name.toLowerCase().includes('visa'));
        console.log('Potential Reward Pass Brand:', rewardPass ? `${rewardPass.name} [${rewardPass.brand_code}]` : 'Not found');
        const amazon = brands.brands?.find((b: any) => b.name.toLowerCase().includes('amazon'));
        console.log('Potential Amazon Brand:', amazon ? `${amazon.name} [${amazon.brand_code}]` : 'Not found');
        const choicePlus = brands.brands?.find((b: any) => b.name.toLowerCase().includes('choiceplus'));
        console.log('Potential ChoicePlus Brand:', choicePlus ? `${choicePlus.name} [${choicePlus.brand_code}]` : 'Not found');
    } else {
        console.error('Failed to fetch brands:', brandsResponse.status, await brandsResponse.text());
    }
    
    const sandboxBrand = 'choiceplus-mock-usa'; // Fallback if discovery fails

    // Mock Attestation
    const attestation: any = {
        id: 'test_attestation',
        type: 'gift_card',
        amount: BigInt(1000), // $10.00
        currency: 'USD',
        userId: 'user_123',
        metadata: {
            email: 'test@example.com',
            customData: {
                firstName: 'John',
                lastName: 'Doe',
                brand: sandboxBrand // Using the mock brand found in Sandbox Hub
            }
        }
    };

    const request: ValueRequest = {
        amount: 10,
        currency: 'USD',
        userId: 'user_123',
        attestation,  // Required by ValueRequest
        metadata: {
            ...attestation.metadata,
            customData: {
                ...attestation.metadata.customData,
                brand: 'open-sync-us'  // Verified working brand slug
            }
        }
    };

    console.log(`\n1. Testing Gift Card Issuance (${sandboxBrand})...`);
    const result = await adapter.issueValue(request);
    console.log('Result:', JSON.stringify(result, null, 2));

    console.log('\n2. Testing Reward Pass (Prepaid Visa) - Should fail without KYC...');
    const rewardPassRequestFail: ValueRequest = {
        userId: 'test_user_789',
        amount: 50.00,
        currency: 'USD',
        attestation,
        metadata: {
            customData: {
                brand: 'reward-pass'
            }
        }
    };

    const rewardPassResultFail = await adapter.issueValue(rewardPassRequestFail);
    console.log('Result (Expected failure):', rewardPassResultFail.success ? 'FAILED (Success returned)' : 'PASSED (Error returned)');
    if (rewardPassResultFail.error) {
        console.log('Error Code:', rewardPassResultFail.error.code);
    }

    console.log('\n3. Testing Reward Pass (Prepaid Visa) - With KYC...');
    // We use 'open-sync-us' (valid brand) but flag it as isPrepaidCard to force the KYC logic path
    const rewardPassRequestSuccess: ValueRequest = {
        userId: 'test_user_789',
        amount: 15.00,
        currency: 'USD',
        attestation,
        metadata: {
            email: 'test@example.com',
            customData: {
                brand: 'open-sync-us', 
                isPrepaidCard: true,
                firstName: 'John',
                lastName: 'Doe'
            }
        }
    };

    const rewardPassResultSuccess = await adapter.issueValue(rewardPassRequestSuccess);
    console.log('Result:', JSON.stringify(rewardPassResultSuccess, null, 2));
}

runTest().catch(console.error);
