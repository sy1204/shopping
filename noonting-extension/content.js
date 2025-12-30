
// 1. 대시보드(메인 앱) 감지 -> 동기화 시작 트리거
if (window.location.hostname.includes('shopping-sy1204s-projects.vercel.app') || window.location.hostname.includes('localhost')) {
    console.log('👀 Noonting Dashboard detected. Triggering Sync...');

    window.addEventListener('load', () => {
        chrome.runtime.sendMessage({ type: 'START_SYNC' }, (response) => {
            console.log('✅ Sync started:', response);
        });
    });
}
// 2. 쇼핑몰 감지 및 가격 추출
else {
    // Retry logic for Single Page Applications (SPA) that load content dynamically
    let attempts = 0;
    const maxAttempts = 10;

    // Initial check
    checkPrice();

    const interval = setInterval(() => {
        attempts++;
        const found = checkPrice(); // checkPrice now returns true if successful
        if (found || attempts >= maxAttempts) {
            clearInterval(interval);
        }
    }, 1000);
}

function checkPrice() {
    // 0. CAPTCHA / Block Detection
    if (document.body.innerText.includes('보안 확인을 완료해 주세요') ||
        document.body.innerText.includes('비정상적인 접근') ||
        document.title.includes('보안 확인')) {

        console.warn('⛔ [Noonting] CAPTCHA detected.');
        // Alert user only once per page load (optional, but retry loop makes this spammy if not handled)
        // Returning true here stops the retry loop in the caller.
        alert('⛔ [눈팅 확장프로그램]\n\n쇼핑몰 보안 확인(CAPTCHA)이 감지되었습니다.\n화면의 보안 문자를 입력하여 인증을 완료해주시면, 가격 정보를 가져올 수 있습니다!');
        return true;
    }

    const hostname = window.location.hostname;
    let price = null;
    let mallName = 'Unknown';
    let title = null;
    let image = null;

    try {
        // --- Metadata Extraction (Common) ---
        const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
        const ogImage = document.querySelector('meta[property="og:image"]')?.content;
        title = ogTitle || document.title;
        image = ogImage;

        // --- Coupang ---
        if (hostname.includes('coupang.com')) {
            mallName = 'Coupang';
            const element = document.querySelector('span.total-price > strong') ||
                document.querySelector('.prod-sale-price .total-price > strong');
            if (element) price = parsePrice(element.innerText);
        }

        // --- Naver SmartStore / Shopping ---
        else if (hostname.includes('naver.com')) {
            mallName = 'Naver';
            let element = document.querySelector('.lowest_price_area .price') ||
                document.querySelector('._price_area ._price') ||
                document.querySelector('.price_area .price') ||
                document.querySelector('.product_price .price');

            // Fallback: Text Search for "99,000원" format if selector fails
            if (!price && (!element || !parsePrice(element.innerText))) {
                // Scan for elements containing "원" and look for price pattern
                const candidates = Array.from(document.querySelectorAll('span, strong, div, em, b'));

                for (const el of candidates) {
                    // Normalize text: remove whitespace and hidden characters
                    const text = el.innerText.replace(/\s+/g, '');
                    // Match pattern: Number + '원' (e.g., "169,000원")
                    const match = text.match(/([0-9,]+)원/);

                    // Filter out unlikely candidates (too long text, dates, etc.)
                    // ensuring the text is short enough to be a price label
                    if (match && text.length < 50) {
                        const rawPrice = match[1];
                        // Basic validation: meaningful number length
                        if (rawPrice.replace(/,/g, '').length >= 3) {
                            const parsed = parsePrice(rawPrice);
                            if (parsed > 0) {
                                price = parsed;
                                break; // Stop at first valid match
                            }
                        }
                    }
                }
            } else if (element) {
                price = parsePrice(element.innerText);
            }
        }

        // --- Gmarket ---
        else if (hostname.includes('gmarket.co.kr')) {
            mallName = 'Gmarket';
            const element = document.querySelector('.price_real > .price_txt') ||
                document.querySelector('.price_real');
            if (element) price = parsePrice(element.innerText);
        }

        // --- 11st ---
        else if (hostname.includes('11st.co.kr')) {
            mallName = '11st';
            const element = document.querySelector('.price_detail .value') ||
                document.querySelector('.sale_price');
            if (element) price = parsePrice(element.innerText);
        }

        // --- Auction ---
        else if (hostname.includes('auction.co.kr')) {
            mallName = 'Auction';
            const element = document.querySelector('.price_real');
            if (element) price = parsePrice(element.innerText);
        }

        // 가격을 찾았으면 전송
        if (price && price > 0) {
            console.log(`✅ [Noonting] Price found: ${price} (${mallName})`);
            chrome.runtime.sendMessage({
                type: 'PRICE_FOUND',
                data: {
                    url: window.location.href,
                    price: price,
                    mall: mallName,
                    title: title,
                    image: image
                }
            });
            return true; // Found!
        }
    } catch (e) {
        console.error('Price check failed:', e);
    }
    return false; // Not found
}

function parsePrice(text) {
    if (!text) return 0;
    return parseInt(text.replace(/[^0-9]/g, ''), 10);
}
