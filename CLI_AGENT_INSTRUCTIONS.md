# Mission Directive: Validate Mechanical Truth

**Objective:** Prove that the system requires no "magic" to operate. Value must originate from the `TREASURY` (Code 3) and flow legally to the User Vault before any spending occurs.

## 1. The Realignment

I have already modified the core logic to strictly follow the **Sovereign Doctrine**:

- **`val/clearing/tigerbeetle/client.ts`**: The `TREASURY` account definition has been restored. It is the only legal source of value.
- **`val/shared/narrative-mirror-bridge.ts`**: The `TREASURY_MINT` constant has been added to the observer layer.
- **`val/tests/finalize_real_world.test.ts`**: The test now attempts to fund the user by debiting `TREASURY` instead of creating a fake "Test Mint".

## 2. Status: COMPLETE

**Verification Executed: January 28, 2026**
- The environment was reset and verified.
- `npm run test:real-world` PASSED.
- Treasury funding, spend clearance, and security checks are operational.
- TigerBeetle ledger and Postgres narrative mirror are aligned.

**DO NOT RESET THE ENVIRONMENT.** The territory is now aligned with the map.

## 3. Next Steps (Legacy)

*This section is archived. See "Status: COMPLETE" above.*

**Align the Territory with the Map.**

1.  **Reset Reality:** Wipe the localized state (Docker volumes, Ledger files) to strictly match the configuration in `docker-compose.yml` and `.env.local`.
2.  **Execute Verification:** Run `npm run test:real-world`.
    - _Success:_ The test passes, proving that `TREASURY` -> `USER` -> `REAL WORLD` flow works.
    - _Failure:_ If it fails with `Code 24` (Ledger), it means the Treasury itself wasn't initialized with credit-issuing capabilities. You must ensure the `TREASURY` account is created with `debits_posted` capability or is somehow seeded. **(Note: Check if `initializeReferenceAccounts` strictly creates the Treasury).**

**Do not edit the logic files unless they violate the doctrine.** The problem is currently in the execution environment.