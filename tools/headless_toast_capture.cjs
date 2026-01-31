const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: true, // MUST be headless for some environments, but false helps debugging if local
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    // Set UA to avoid basic bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('Navigating to Toast...');
    await page.goto('https://order.toasttab.com/online/fusion-teriyaki-6300-white-ln', { waitUntil: 'networkidle0' });

    console.log('Injecting Interceptor...');
    await page.evaluate(() => {
        window.CAPTURED_HASHES = {};
        const originalFetch = window.fetch;
        window.fetch = async function(url, options) {
            if (url && url.toString().includes('graphql') && options && options.body) {
                try {
                    const body = JSON.parse(options.body);
                    const items = Array.isArray(body) ? body : [body];
                    items.forEach(item => {
                        if (item.extensions && item.extensions.persistedQuery) {
                            const op = item.operationName || 'Unknown';
                            const hash = item.extensions.persistedQuery.sha256Hash;
                            window.CAPTURED_HASHES[op] = hash;
                            console.log(`__HASH_CAPTURED__:${op}:${hash}`);
                        }
                    });
                } catch (e) {}
            }
            return originalFetch.apply(this, arguments);
        };
    });

    // We need to trigger a cart action.
    console.log('Finding Menu Item...');
    
    // Wait for any "Add" button or price container
    // Toast selectors can be tricky. Look for common patterns.
    try {
        await page.waitForSelector('span[data-testid="menu-item-price"]', { timeout: 10000 });
        const buttons = await page.$$('span[data-testid="menu-item-price"]');
        if (buttons.length > 0) {
            console.log('Clicking first menu item price...');
            await buttons[0].click();
        } else {
            console.log('No price buttons found. Trying generic "Add"...');
            // fallback logic?
        }
    } catch(e) {
        console.log('Error finding menu items:', e.message);
    }

    console.log('Waiting for Modal...');
    await new Promise(r => setTimeout(r, 3000));

    // Look for "Add to cart" in modal
    try {
        // This is a guess at the selector, often it's a button with text "Add to cart"
        const added = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const addBtn = btns.find(b => b.innerText.toLowerCase().includes('add'));
            if(addBtn) {
                addBtn.click();
                return true;
            }
            return false;
        });
        if(added) console.log('Clicked Add to Cart in Modal');
        else console.log('Could not find Add to Cart button in Modal');
    } catch(e) {
        console.log('Error in modal interaction:', e.message);
    }

    console.log('Waiting for network...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('Extracting Hashes...');
    const hashes = await page.evaluate(() => window.CAPTURED_HASHES);
    console.log('FINAL_HASHES:', JSON.stringify(hashes, null, 2));

    await browser.close();
})();
