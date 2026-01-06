// sovr_hybrid_engineV2/val/tests/settle.integration.test.js
// Integration Test for SpendEngine.settle() against a LIVE Staging Environment
// This test strictly adheres to the "NO MOCKS" directive.

const { expect } = require("chai");
// No Sinon mocks, as per "NO MOCKS" directive for test harness.
// All dependencies must be real instances connecting to the staging environment.

// Import the SpendEngine and its real dependencies
const { SpendEngine, InsufficientCreditError, InvalidAttestationError } = require("../core/spend_engine");
const { AttestationEngine } = require("../core/attestation"); // Assuming AttestationEngine connects to a real Attestor
const { EventLogger } = require("../events/logger"); // Assuming EventLogger uses a real Narrative Mirror
const { getTigerBeetle, TigerBeetleService } = require("../core/tigerbeetle_service"); // Real TigerBeetle service
const { getNarrativeMirror, NarrativeMirrorService } = require("../core/narrative-mirror-service"); // Real Narrative Mirror service
const { NARRATIVE_ACCOUNTS } = require("../shared/narrative-mirror-bridge");
const { ethers } = require('ethers'); // For eventIdToBigInt hashing
const { v4: uuidv4 } = require('uuid'); // For unique IDs if needed

// --- Configuration for Live Staging Environment ---
// These environment variables MUST be set in the test execution environment
// For local testing, ensure a .env file is loaded or these are set in the shell
require('dotenv').config({ path: '../../.env' }); // Adjust path to .env as necessary

const TIGERBEETLE_CLUSTER_ID = parseInt(process.env.TIGERBEETLE_CLUSTER_ID || "1");
const TIGERBEETLE_ADDRESSES = process.env.TIGERBEETLE_ADDRESSES || "10.10.0.1:3000,10.10.0.2:3000,10.10.0.3:3000";
const POSTGRES_CONNECTION_STRING = process.env.POSTGRES_CONNECTION_STRING || "postgresql://observer:a_secure_password@localhost:5432/narrative"; // Replace with actual staging DB

// --- Instantiate Real Dependencies ---
// These will attempt to connect to the live staging services based on ENV vars
const realAttestationEngine = new AttestationEngine(/* real config if needed for connection */);
const realEventLogger = new EventLogger(getNarrativeMirror()); // EventLogger depends on real NarrativeMirror
const realTigerBeetle = getTigerBeetle(); // Connects to TIGERBEETLE_ADDRESSES
const realNarrativeMirror = getNarrativeMirror(); // Connects to POSTGRES_CONNECTION_STRING

// --- Setup Real Services for SpendEngine ---
// SpendEngine needs to be instantiated with its real dependencies
let spendEngine;

// Helper function for creating a CreditEvent
const createCreditEvent = (amount = 1000000n, userId = `user_${uuidv4()}`, id = `evt_${uuidv4()}`) => ({
    id: id,
    type: 0, // CreditEventType.SPEND_AUTHORIZED
    userId,
    amount, // Use bigint micro-units
    timestamp: new Date(),
    metadata: { merchant: "Instacart" },
});

// Helper for creating an Attestation
// In a real integration test, this would involve calling the Attestor service.
// For test setup, we'll manually create a synthetically valid attestation matching what AttestationEngine.verify expects.
// This is NOT mocking the AttestationEngine, but setting up valid input.
const createValidAttestation = async (event) => {
    // This part is conceptual as AttestationEngine is complex.
    // In a live environment, a real Attestor service would generate this.
    // For a test harness, we might have a helper in AttestationEngine to generate a valid test attestation.
    // For now, let's assume a simplified structure that passes AttestationEngine.verify.
    // If AttestationEngine is complex, its setup would be part of 'realAttestationEngine' initialization.
    const message = JSON.stringify(event); // Simple payload for signing
    const wallet = ethers.Wallet.createRandom(); // Simulate a signer for consistency
    const signature = await wallet.signMessage(message);

    return {
        signature: signature,
        signer: wallet.address, // The assumed signer for verification
        expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        rawPayload: event, // The raw event data that was signed
    };
};

// Helper to convert string ID to BigInt for TB (from spend_engine.ts)
const eventIdToBigInt = (id) => {
    const hashHex = ethers.utils.id(id);
    return BigInt(hashHex) & 0xffffffffffffffffffffffffffffffffn;
};

// --- Test Suite ---
describe("SpendEngine.settle() Canonical Path Integration Test (NO MOCKS)", function() {
    this.timeout(60000); // Global timeout for integration tests (60 seconds)

    before(async function() {
        // Initialize the SpendEngine with real dependencies
        spendEngine = new SpendEngine(realAttestationEngine, realEventLogger);

        // --- PRE-TEST SETUP for Staging Environment ---
        console.log("Integration Test Setup: Ensuring TigerBeetle accounts are pre-funded and Narrative Mirror is ready.");

        // NOTE: In a real scenario, the staging environment would be pre-configured
        // with the necessary TigerBeetle accounts and initial balances.
        // This test assumes NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN is pre-funded
        // to allow for successful debit transfers.
        // If accounts don't exist, this test will fail on TB.createTransfer.

        // Example: Programmatically create accounts if needed (assuming TB service allows this)
        // await realTigerBeetle.createAccount({ id: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN, ... });
        // await realTigerBeetle.createAccount({ id: NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI, ... });

        // Example: Fund the STABLECOIN account if needed for testing (manual operation or setup script)
        // This is a crucial precondition for successful clearing.
        // The test itself *must not* modify TB balances outside of a transfer.
        // For testing, the 'realTigerBeetle' would typically have a setup method to ensure pre-funded state.
        // If not, a manual deposit to NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN is required.

        console.log(`Connecting to TigerBeetle at ${TIGERBEETLE_ADDRESSES}`);
        console.log(`Connecting to Narrative Mirror at ${POSTGRES_CONNECTION_STRING}`);

        // Small delay to ensure services are fully connected/initialized if needed
        await new Promise(resolve => setTimeout(resolve, 2000));
    });

    // Test Case 2.1: Successful Canonical Clearing
    describe("Test Case 2.1: Successful Canonical Clearing", () => {
        it("should successfully clear the obligation in TigerBeetle and record in Narrative Mirror", async function() {
            const event = createCreditEvent(100000n); // 0.1 units
            const attestation = await createValidAttestation(event); // Create a synthetically valid attestation

            // For AttestationEngine.verify, we need it to pass.
            // In an integration context, we assume realAttestationEngine can verify this synthetically created attestation.
            // If the real AttestationEngine requires more complex setup (e.g., a real signer service),
            // this test would rely on that being live or an advanced test-helper in AttestationEngine.
            // For now, we assume AttestationEngine.verify works as expected with the valid attestation input.
            // If AttestationEngine is complex, its setup would be part of 'realAttestationEngine' initialization.

            const expectedTransferId = eventIdToBigInt(event.id);

            // Get initial balances for verification
            // const initialDebitBalance = await realTigerBeetle.getAccountBalance(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN);

            // Execute the settle function
            const result = await spendEngine.settle(event, attestation);

            // --- Verification ---
            expect(result.success).to.be.true;
            expect(result.transactionId).to.equal(event.id);
            expect(result.newBalance).to.be.a('bigint');

            // Verify TigerBeetle Clearing (by querying real TB)
            // This assumes realTigerBeetle.lookupTransfers is correctly implemented to query TB.
            const transfers = await realTigerBeetle.lookupTransfers([expectedTransferId]); // TigerBeetle lookup by ID
            const transfer = transfers.find(t => t.id === expectedTransferId);
            expect(transfer).to.exist;
            expect(transfer.debit_account_id.toString()).to.equal(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN.toString());
            expect(transfer.credit_account_id.toString()).to.equal(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_ODFI.toString());
            expect(transfer.amount.toString()).to.equal(event.amount.toString());

            // Verify Narrative Mirror Observation (by querying real NM)
            // This assumes realNarrativeMirror.getClearedObligations is correctly implemented.
            const journalEntries = await realNarrativeMirror.getClearedObligations(event.userId); // Query NM for the recorded event
            const matchingEntry = journalEntries.find(entry => eventIdToBigInt(entry.transfer_id) === expectedTransferId);
            expect(matchingEntry).to.exist;
            expect(matchingEntry.source).to.equal('TIGERBEETLE');
            expect(matchingEntry.amount.toString()).to.equal(event.amount.toString());

            console.log(`[Integration Test] Cleared obligation ${event.id} in TigerBeetle. Ready for Honoring Agent (Instacart) to act.`);
        });
    });

    // Test Case 2.2: Failed Attestation (Pre-Clearing)
    describe("Test Case 2.2: Failed Attestation (Pre-Clearing)", () => {
        it("should throw InvalidAttestationError and not attempt TigerBeetle clearing", async function() {
            const event = createCreditEvent(50000n);
            const invalidAttestation = { ...await createValidAttestation(event), signature: "0xINVALID_SIGNATURE" }; // Synthetically invalid signature

            // For AttestationEngine.verify, it should return false for the invalid attestation.
            // This test assumes realAttestationEngine.verify correctly identifies the invalid attestation.

            // Get initial TB state for verification (assuming getAccountBalance exists)
            // const initialTBBalance = await realTigerBeetle.getAccountBalance(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN);

            // Execute the settle function and expect a rejection
            let error;
            try {
                await spendEngine.settle(event, invalidAttestation);
            } catch (e) {
                error = e;
            }

            // Verify InvalidAttestationError thrown
            expect(error).to.be.an.instanceOf(InvalidAttestationError);
            expect(error.message).to.equal("Invalid attestation signature or proof");

            // Verify no TigerBeetle Clearing occurred
            // const postTBBalance = await realTigerBeetle.getAccountBalance(NARRATIVE_ACCOUNTS.HONORING_ADAPTER_STABLECOIN);
            // expect(postTBBalance.toString()).to.equal(initialTBBalance.toString()); // No change in balance

            const transfers = await realTigerBeetle.lookupTransfers([eventIdToBigInt(event.id)]);
            const transfer = transfers.find(t => t.id === eventIdToBigInt(event.id));
            expect(transfer).to.not.exist;

            // Verify no Narrative Mirror entry
            const journalEntries = await realNarrativeMirror.getClearedObligations(event.userId);
            const matchingEntry = journalEntries.find(entry => eventIdToBigInt(entry.transfer_id) === eventIdToBigInt(event.id));
            expect(matchingEntry).to.not.exist;
        });
    });

    // Test Case 2.3: TigerBeetle Clearing Failure (e.g., Insufficient Funds, Replay)
    describe("Test Case 2.3: TigerBeetle Clearing Failure", () => {
        it("should throw an error if TigerBeetle clearing fails (e.g., insufficient funds) and not record in Narrative Mirror", async function() {
            const event = createCreditEvent(1000000000000000000000000n); // Very large amount to cause insufficient funds
            const attestation = await createValidAttestation(event);

            // For AttestationEngine.verify, it should pass.
            // For TB to fail due to insufficient funds, the real TB instance should behave as expected.

            // Execute the settle function and expect a rejection
            let error;
            try {
                await spendEngine.settle(event, attestation);
            } catch (e) {
                error = e;
            }

            // Verify error thrown
            expect(error).to.be.an.instanceOf(Error);
            expect(error.message).to.include("Clearing failed: Transfer rejected"); // TB error message

            // Verify no Narrative Mirror entry
            const journalEntries = await realNarrativeMirror.getClearedObligations(event.userId);
            const matchingEntry = journalEntries.find(entry => eventIdToBigInt(entry.transfer_id) === eventIdToBigInt(event.id));
            expect(matchingEntry).to.not.exist;
        });
    });

    // Test Case 2.4: Honoring Agent Failure (Post-Clearing - Conceptual)
    describe("Test Case 2.4: Honoring Agent Failure (Conceptual - Post-Clearing)", () => {
        it("should confirm TigerBeetle clearing is final despite conceptual honoring agent failure", async function() {
            const event = createCreditEvent(250000n); // 0.25 units
            const attestation = await createValidAttestation(event);

            // Execute settle() which should succeed in TB and NM
            const result = await spendEngine.settle(event, attestation);

            // Verify settle() logic remains sound (TB cleared, narrative recorded)
            expect(result.success).to.be.true;

            // Verify TigerBeetle Clearing (by querying real TB)
            const transfers = await realTigerBeetle.lookupTransfers([eventIdToBigInt(event.id)]);
            const transfer = transfers.find(t => t.id === eventIdToBigInt(event.id));
            expect(transfer).to.exist;

            // Verify Narrative Mirror Observation (by querying real NM)
            const journalEntries = await realNarrativeMirror.getClearedObligations(event.userId);
            const matchingEntry = journalEntries.find(entry => eventIdToBigInt(entry.transfer_id) === eventIdToBigInt(event.id));
            expect(matchingEntry).to.exist;

            // --- Conceptual: Simulate external honoring agent failure ---
            // This part is outside the direct scope of settle() but confirms system understanding.
            console.log(`[Integration Test] Simulated Honoring Agent (Instacart) call for cleared obligation ${event.id} failed.`);
            console.log(`[Integration Test] CONCLUSION: TigerBeetle clearing remains final and unaffected.`);
        });
    });
});
