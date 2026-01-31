
// Toast Environment Inspector & Hash Capturer V3
// Paste this into the browser console.

(function() {
    console.clear();
    console.log('%c[TOAST INSPECTOR] Starting analysis...', 'color: cyan; font-size: 16px; font-weight: bold;');

    // 1. Check Fetch Writability
    try {
        const fetchDescriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
        console.log('[ENV] window.fetch configurable:', fetchDescriptor ? fetchDescriptor.configurable : 'unknown');
        console.log('[ENV] window.fetch writable:', fetchDescriptor ? fetchDescriptor.writable : 'unknown');
    } catch (e) {
        console.log('[ENV] Cannot inspect fetch descriptor:', e.message);
    }

    // 2. Try to find Apollo Client via Global
    if (window.__APOLLO_CLIENT__) {
        console.log('%c[SUCCESS] Found Global Apollo Client!', 'color: lime;');
        hookApolloClient(window.__APOLLO_CLIENT__);
        return;
    }

    // 3. Deep Fiber Tree Search for Apollo Client
    console.log('[INSPECTOR] Searching React Fiber tree for Apollo Client...');
    
    function findReactRoot() {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
        while(walker.nextNode()) {
            const node = walker.currentNode;
            const key = Object.keys(node).find(k => k.startsWith('__reactContainer') || k.startsWith('__reactFiber'));
            if (key) {
                return node[key];
            }
        }
        return null;
    }

    function searchFiber(fiber, depth = 0) {
        if (!fiber || depth > 2000) return null; // Safety break

        // Check for Apollo Provider context
        if (fiber.memoizedProps && fiber.memoizedProps.client && fiber.memoizedProps.client.query) {
             return fiber.memoizedProps.client;
        }
        
        // Check state/context
        if (fiber.stateNode && fiber.stateNode.client && fiber.stateNode.client.query) {
            return fiber.stateNode.client;
        }

        // Traverse
        let found = null;
        if (fiber.child) found = searchFiber(fiber.child, depth + 1);
        if (!found && fiber.sibling) found = searchFiber(fiber.sibling, depth + 1);
        
        return found;
    }

    const rootFiber = findReactRoot();
    if (rootFiber) {
        console.log('[INSPECTOR] Found React Root Fiber. Traversing...');
        const client = searchFiber(rootFiber);
        if (client) {
            console.log('%c[SUCCESS] Found Apollo Client in React Tree!', 'color: lime; font-size: 14px;');
            hookApolloClient(client);
        } else {
            console.log('%c[FAILURE] Could not find Apollo Client in Fiber tree.', 'color: red;');
            fallbackManualInstructions();
        }
    } else {
        console.log('%c[FAILURE] Could not find React Root.', 'color: red;');
        fallbackManualInstructions();
    }

    // Hooking Function
    function hookApolloClient(client) {
        window.TOAST_APOLLO_CLIENT = client;
        console.log('[HOOK] Hooking clearStore/query methods...');

        // We can monkey-patch the 'query' and 'mutate' methods
        const originalQuery = client.query;
        const originalMutate = client.mutate;

        client.query = function(options) {
            logOperation(options);
            return originalQuery.apply(this, arguments);
        };

        client.mutate = function(options) {
            logOperation(options);
            return originalMutate.apply(this, arguments);
        };

        console.log('%c[HOOK] Ready! Interact with the page (Add to Cart, Checkout). Hashes will appear below.', 'color: lime; font-weight: bold; font-size: 16px;');
    }

    function logOperation(options) {
        try {
            if (options && options.query) {
                const def = options.query.definitions.find(d => d.kind === 'OperationDefinition');
                if (def && def.name) {
                    const opName = def.name.value;
                    // Try to find hash in extensions or create a hash placeholder
                    // Note: Apollo Client usually handles the hashing internally for persisted queries via a Link.
                    // We might not see the hash here unless it's strictly passed in options.
                    // BUT, if we can see the OpName, we are halfway there.
                    
                    // The persisted query link might add the hash later. 
                    console.log(`%c[APOLLO OP] Attempting: ${opName}`, 'color: yellow;');
                    
                    // To actually get the hash, we might need to look at the 'persistedQuery' extension if it's already attached
                    // or check the document.
                }
            }
        } catch (e) {
            console.error('Error logging op', e);
        }
    }

    function fallbackManualInstructions() {
        console.log('\n%c[MANUAL FALLBACK]', 'color: orange; font-weight: bold;');
        console.log('1. Open DevTools "Network" tab.');
        console.log('2. Filter by "graphql".');
        console.log('3. Perform the action (Add to Cart, etc.).');
        console.log('4. Click the latest request.');
        console.log('5. Look at "Payload" (or Request Body).');
        console.log('6. Find "extensions" -> "persistedQuery" -> "sha256Hash".');
        console.log('7. Copy that Hash and the Operation Name.');
    }

})();
