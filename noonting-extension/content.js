
// 1. 대시보드(메인 앱) 감지 -> 동기화 시작 트리거
if (window.location.hostname.includes('shopping-sy1204s-projects.vercel.app') || window.location.hostname.includes('localhost')) {
    console.log('👀 Noonting Dashboard detected. Ready for Sync.');

    // 1. Initial Sync on Load - DISABLED by user request
    // window.addEventListener('load', () => {
    //     chrome.runtime.sendMessage({ type: 'START_SYNC' }, (response) => {
    //         console.log('✅ Sync started:', response);
    //     });
    // });

    // 2. On-Demand Sync via Button
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        if (event.data.type && (event.data.type === 'TRIGGER_SYNC')) {
            console.log('🔄 Triggering Manual Sync...');
            chrome.runtime.sendMessage({ type: 'SYNC_NOW' });
        }
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
    let description = null;

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
                document.querySelector('.prod-sale-price .total-price > strong') ||
                document.querySelector('span.price-value') ||
                document.querySelector('.sales-price .price');
            if (element) price = parsePrice(element.innerText);
        }

        // --- Naver SmartStore / Shopping ---
        else if (hostname.includes('naver.com')) {
            mallName = 'Naver';

            // 방법 1: JSON-LD 구조화 데이터 (가장 안정적)
            try {
                const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                for (const script of scripts) {
                    try {
                        let data = JSON.parse(script.textContent);
                        if (Array.isArray(data)) data = data[0];
                        if (data && data.offers) {
                            const offers = Array.isArray(data.offers) ? data.offers : [data.offers];
                            for (const offer of offers) {
                                if (offer.price) {
                                    price = parseInt(String(offer.price).replace(/[^0-9]/g, ''));
                                    if (price > 0) break;
                                }
                            }
                        }
                        if (price > 0) break;
                    } catch (e) { /* ignore */ }
                }
            } catch (e) { /* ignore */ }

            // 방법 2: Blind 스팬 (네이버 스마트스토어 전용)
            if (!price || price === 0) {
                const blindSpan = Array.from(document.querySelectorAll('span.blind'))
                    .find(el => el.textContent.includes('상품 가격'));
                if (blindSpan && blindSpan.nextElementSibling) {
                    const priceText = blindSpan.nextElementSibling.textContent;
                    price = parsePrice(priceText);
                    console.log(`🔍 [Noonting] Naver blind span price: ${price}`);
                }
            }

            // 방법 3: 기존 CSS 선택자
            if (!price || price === 0) {
                const element = document.querySelector('.lowest_price_area .price') ||
                    document.querySelector('._price_area ._price') ||
                    document.querySelector('.price_area .price') ||
                    document.querySelector('.product_price .price');
                if (element) price = parsePrice(element.innerText);
            }

            // 방법 4: 패턴 스캔 (최후의 수단)
            if (!price || price === 0) {
                const candidates = Array.from(document.querySelectorAll('span, strong, div, em, b'));
                for (const el of candidates) {
                    const text = el.innerText.replace(/\s+/g, '');
                    const match = text.match(/([0-9,]+)원/);
                    if (match && text.length < 30) {
                        const parsed = parsePrice(match[1]);
                        if (parsed > 1000) {
                            price = parsed;
                            break;
                        }
                    }
                }
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

        // --- Common: Description & Detail Images Extraction ---
        // 1. Try og:description first (brief summary only)
        if (!description) {
            const ogDesc = document.querySelector('meta[property="og:description"]');
            description = ogDesc?.content || null;
        }
        if (!description) {
            const metaDesc = document.querySelector('meta[name="description"]');
            description = metaDesc?.content || null;
        }

        // 2. Extract detail images (for Naver Smart Store)
        let detailImages = [];
        if (hostname.includes('naver.com')) {
            // Selectors for detail content
            const detailSelectors = [
                '.se-main-container img',
                '.se-image img',
                '[class*="detail"] img',
                '.product_detail_container img',
                '#INTRODUCE img'
            ];

            for (const sel of detailSelectors) {
                const imgs = document.querySelectorAll(sel);
                if (imgs.length > 0) {
                    detailImages = Array.from(imgs)
                        .map(img => img.src || img.dataset?.src)
                        .filter(src => src && !src.startsWith('data:') && src.length > 10)
                        .slice(0, 10); // Max 10 images
                    if (detailImages.length > 0) {
                        console.log(`📸 [Noonting] Found ${detailImages.length} detail images`);
                        break;
                    }
                }
            }
        }

        // 가격을 찾았으면 전송
        if (price && price > 0) {
            console.log(`✅ [Noonting] Price found: ${price} (${mallName})`);
            if (description) {
                console.log(`📝 [Noonting] Description: ${description.substring(0, 100)}...`);
            }
            if (detailImages.length > 0) {
                console.log(`📸 [Noonting] Detail Images: ${detailImages.length} found`);
            }
            chrome.runtime.sendMessage({
                type: 'PRICE_FOUND',
                data: {
                    url: window.location.href,
                    price: price,
                    mall: mallName,
                    title: title,
                    image: image,
                    description: description,
                    detailImages: detailImages
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
