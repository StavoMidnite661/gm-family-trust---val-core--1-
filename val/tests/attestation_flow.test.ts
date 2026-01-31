
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function runTest() {
    console.log('Starting Attestation Flow Integration Test...');

    const amount = 1000_000000; // $1,000.00
    const userId = 'test_attestation_user_' + Date.now();

    try {
        // 1. Initial Balance Check
        try {
            const balRes = await axios.get(`${BASE_URL}/balance/${userId}`);
            if (BigInt(balRes.data.available) !== 0n) {
                console.warn(`[WARN] User ${userId} already has balance!`);
            }
        } catch (e) {
            // User might not exist, which is fine (balance 0)
        }

        // 2. Call Faucet (Attest)
        console.log(`[TEST] Requesting attestation for ${userId}...`);
        const response = await axios.post(`${BASE_URL}/faucet`, {
            userId,
            amount
        });

        const data = response.data;
        
        // 3. Verify Response Structure
        if (!data.success) throw new Error('Response success is false');
        if (!data.txId) throw new Error('Response txId missing');
        if (!data.attestation) throw new Error('Response attestation missing');
        
        // 4. Verify Attestation Proof
        const attestation = data.attestation;
        if (!attestation.signature) throw new Error('Attestation signature missing');
        if (!attestation.attestor) throw new Error('Attestation attestor missing');
        if (!attestation.proof) throw new Error('Attestation proof missing');
        if (!attestation.proof.merkleRoot) throw new Error('Attestation Merkle Root missing');
        
        console.log(`[PASS] Attestation Verified: Merkle Root ${attestation.proof.merkleRoot}`);

        // 5. Verify Balance Update (Mechanical Truth)
        const balanceResponse = await axios.get(`${BASE_URL}/balance/${userId}`);
        const newBalance = BigInt(balanceResponse.data.available);
        
        if (newBalance !== BigInt(amount)) {
            throw new Error(`Balance mismatch: Expected ${amount}, got ${newBalance}`);
        }
        console.log(`[PASS] Balance Verified: ${newBalance} units`);

        // 6. Verify Narrative Mirror (Observation)
        await new Promise(r => setTimeout(r, 500)); 
        
        const narrativeRes = await axios.get(`${BASE_URL}/narrative`);
        const entries = narrativeRes.data;
        
        const entry = entries.find((e: any) => e.eventId === data.txId);
        if (!entry) throw new Error('Narrative entry not found through GET /narrative');
        if (entry.source !== 'ATTESTATION') throw new Error(`Incorrect source: ${entry.source}`);
        if (entry.status !== 'RECORDED') throw new Error(`Incorrect status: ${entry.status}`);
        
        console.log(`[PASS] Narrative Entry Verified: ${entry.id}`);
        console.log('✅ ALL TESTS PASSED');

    } catch (error: any) {
        console.error('❌ TEST FAILED:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

runTest();
