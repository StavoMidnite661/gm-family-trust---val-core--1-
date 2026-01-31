
// Toast GraphQL Hash Capturer V2
// Paste this into the browser console on the Toast checkout page.

(function() {
    console.log('%c[TOAST CAPTURER] Script v2 Starting...', 'color: cyan; font-size: 14px; font-weight: bold;');

    const originalFetch = window.fetch;
    const originalXHR = window.XMLHttpRequest.prototype.open;
    const originalXHROpen = window.XMLHttpRequest.prototype.open;
    const originalXHRSend = window.XMLHttpRequest.prototype.send;

    window.CAPTURED_HASHES = {};

    // 1. Intercept Fetch
    window.fetch = async function(url, options) {
        const urlStr = url.toString();
        // console.log(`%c[FETCH] ${urlStr}`, 'color: #888;'); // specific log if needed

        if (urlStr.includes('graphql')) {
            console.log(`%c[GRAPHQL FETCH] Detected: ${urlStr}`, 'color: yellow;');
            try {
                if (options && options.body) {
                    const body = JSON.parse(options.body);
                    processPayload(body);
                }
            } catch (e) {
                console.warn('[TOAST CAPTURER] Error parsing fetch body', e);
            }
        }
        return originalFetch.apply(this, arguments);
    };

    // 2. Intercept XHR (Just in case)
    window.XMLHttpRequest.prototype.send = function(body) {
        // We can't easily get the URL here without monkey-patching 'open', but let's assume if body looks like GraphQL
        if (typeof body === 'string' && (body.includes('operationName') || body.includes('persistedQuery'))) {
            try {
                const json = JSON.parse(body);
                processPayload(json);
            } catch (e) {
                // Not JSON or strict matching
            }
        }
        return originalXHRSend.apply(this, arguments);
    };

    function processPayload(payload) {
        const items = Array.isArray(payload) ? payload : [payload];
        
        items.forEach(item => {
            const opName = item.operationName || 'Unknown';
            if (item.extensions && item.extensions.persistedQuery) {
                const hash = item.extensions.persistedQuery.sha256Hash;
                console.log(`%c[CAPTURED HASH] ${opName}: ${hash}`, 'color: #00ff00; font-size: 16px; font-weight: bold;');
                
                if (!window.CAPTURED_HASHES[opName]) {
                    window.CAPTURED_HASHES[opName] = hash;
                }
            } else {
                console.log(`%c[GRAPHQL] ${opName} (No Hash)`, 'color: orange;');
            }
        });
    }

    console.log('%c[TOAST CAPTURER] Ready! Perform actions (add to cart, etc.) now.', 'color: cyan; font-weight: bold;');
    
    // Helper to print all
    window.printHashes = function() {
        console.table(window.CAPTURED_HASHES);
        console.log(JSON.stringify(window.CAPTURED_HASHES, null, 2));
    };

})();
