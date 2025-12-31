const { chromium } = require('playwright');

const STEALTH_ARGS = [
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',
    '--disable-setuid-sandbox'
];

(async () => {
    const browser = await chromium.launch({ headless: true, args: STEALTH_ARGS });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        locale: 'ko-KR'
    });

    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const page = await context.newPage();
    await page.goto('https://brand.naver.com/dececco/products/11438060898', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    const result = await page.evaluate(() => {
        let price = 0;
        let title = null;
        let image = null;
        const debug = [];

        // 1. JSON-LD
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        debug.push(`JSON-LD scripts: ${scripts.length}`);

        // 2. OG Tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        title = ogTitle?.content || document.title;
        debug.push(`OG Title: ${title}`);

        const ogImage = document.querySelector('meta[property="og:image"]');
        image = ogImage?.content;
        debug.push(`OG Image: ${image ? 'found' : 'not found'}`);

        // 3. Blind span
        const blindSpans = document.querySelectorAll('span.blind');
        debug.push(`Blind spans total: ${blindSpans.length}`);

        const priceLabel = Array.from(blindSpans).find(el => el.textContent.includes('상품 가격'));
        debug.push(`Price label found: ${!!priceLabel}`);

        if (priceLabel) {
            const nextSib = priceLabel.nextElementSibling;
            debug.push(`Next sibling: ${nextSib?.textContent}`);
            if (nextSib) {
                const priceText = nextSib.textContent.replace(/[^0-9]/g, '');
                debug.push(`Price text extracted: ${priceText}`);
                if (priceText) price = parseInt(priceText);
            }
        }

        // 4. Pattern scan fallback
        if (price === 0) {
            const allText = document.body.innerText;
            const matches = allText.match(/([0-9,]+)원/g) || [];
            debug.push(`Pattern matches: ${matches.slice(0, 5).join(', ')}`);

            if (matches.length > 0) {
                // 첫 번째 유효한 가격 사용 (보통 정가)
                for (const m of matches) {
                    const p = parseInt(m.replace(/[^0-9]/g, ''));
                    if (p > 1000 && p < 100000000) {
                        price = p;
                        break;
                    }
                }
            }
        }

        return { price, title, image, debug };
    });

    console.log('=== Debug Info ===');
    result.debug.forEach(d => console.log(d));
    console.log('\n=== Final Result ===');
    console.log(JSON.stringify({ price: result.price, title: result.title, image: result.image }, null, 2));

    await browser.close();
})();
