/**
 * Toast Hash Capturer
 * 
 * INSTRUCTIONS:
 * 1. Open the Toast checkout page in your browser (Chrome/Edge).
 * 2. Open Developer Tools (F12) -> Console.
 * 3. Paste this entire script into the console and press Enter.
 * 4. Perform the actions:
 *    - Add an item to cart.
 *    - Go to checkout.
 *    - (Optional) Place order (if you want to capture that hash too).
 * 5. Copy the output from the console and save it to 'val/adapters/toast_config.ts' or share it.
 */

(function() {
    console.log('🪤 Toast Hash Capturer Installed!');
    console.log('   Performing network interception...');

    const originalFetch = window.fetch;
    const capturedHashes = {};

    window.fetch = async function(url, options) {
        if (url.toString().includes('graphql')) {
            try {
                if (options && options.body) {
                    const body = JSON.parse(options.body);
                    const payloads = Array.isArray(body) ? body : [body];

                    payloads.forEach(payload => {
                        if (payload.extensions && payload.extensions.persistedQuery) {
                            const hash = payload.extensions.persistedQuery.sha256Hash;
                            const opName = payload.operationName || 'Unknown';
                            
                            console.log(`%c[CAPTURED] ${opName}: ${hash}`, 'color: #00ff00; font-weight: bold;');
                            capturedHashes[opName] = hash;
                        }
                    });
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
        return originalFetch.apply(this, arguments);
    };

    // Helper to dump all captured
    window.printHashes = function() {
        console.log('--- CAPTURED HASHES ---');
        console.log(JSON.stringify(capturedHashes, null, 2));
        console.log('-----------------------');
    };
})();
