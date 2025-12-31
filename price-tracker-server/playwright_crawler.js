/**
 * Playwright 기반 크롤러 (Anti-Bot 우회 기능 포함)
 * - Stealth 플러그인으로 자동화 탐지 우회
 * - 랜덤 딜레이, 스크롤 등 "사람처럼" 행동
 */

const { chromium } = require('playwright');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Stealth 설정 (Playwright에서는 직접 적용이 어려워 launch args로 대체)
const STEALTH_ARGS = [
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process'
];

/**
 * 랜덤 딜레이 (사람처럼 행동)
 */
function randomDelay(min = 1000, max = 3000) {
    return new Promise(resolve =>
        setTimeout(resolve, min + Math.random() * (max - min))
    );
}

/**
 * 사람처럼 스크롤
 */
async function humanScroll(page) {
    try {
        const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
        let currentPosition = 0;

        while (currentPosition < scrollHeight * 0.6) {
            const scrollAmount = 100 + Math.random() * 200;
            currentPosition += scrollAmount;
            await page.evaluate((y) => window.scrollTo(0, y), currentPosition);
            await randomDelay(150, 400);
        }
    } catch (e) {
        console.warn('⚠️ [Scroll] Failed:', e.message);
    }
}

/**
 * 쇼핑몰별 가격 추출 선택자
 */
const MALL_SELECTORS = {
    'coupang.com': {
        price: ['span.total-price > strong', '.prod-sale-price .total-price > strong', 'span.price-value', '.sales-price .price'],
        title: 'meta[property="og:title"]',
        image: 'meta[property="og:image"]'
    },
    'naver.com': {
        price: ['._price', '.price_area .price', '.product_price .price', '.lowest_price_area .price'],
        title: 'meta[property="og:title"]',
        image: 'meta[property="og:image"]'
    },
    'gmarket.co.kr': {
        price: ['.price_real .price_txt', '.price_real'],
        title: 'meta[property="og:title"]',
        image: 'meta[property="og:image"]'
    },
    '11st.co.kr': {
        price: ['.price_detail .value', '.sale_price', '.total_price'],
        title: 'meta[property="og:title"]',
        image: 'meta[property="og:image"]'
    },
    'auction.co.kr': {
        price: ['.price_real', '.price_txt'],
        title: 'meta[property="og:title"]',
        image: 'meta[property="og:image"]'
    }
};

/**
 * 쇼핑몰 이름 감지
 */
function detectMallName(url) {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('coupang')) return 'Coupang';
    if (hostname.includes('naver')) return 'Naver';
    if (hostname.includes('gmarket')) return 'Gmarket';
    if (hostname.includes('11st')) return '11st';
    if (hostname.includes('auction')) return 'Auction';
    if (hostname.includes('ssg')) return 'SSG';
    if (hostname.includes('lotteon')) return 'LotteOn';
    return 'Unknown';
}

/**
 * URL에서 상품 정보 크롤링
 * @param {string} url - 상품 URL
 * @returns {Promise<{success: boolean, title?: string, image?: string, price?: number, mall?: string, error?: string}>}
 */
async function crawlProductUrl(url) {
    let browser = null;

    try {
        console.log(`🚀 [Playwright] Starting crawl for: ${url}`);

        browser = await chromium.launch({
            headless: true,
            args: STEALTH_ARGS
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'ko-KR',
            timezoneId: 'Asia/Seoul',
            extraHTTPHeaders: {
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        // navigator.webdriver 숨기기
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko', 'en-US', 'en'] });
        });

        const page = await context.newPage();

        // 1. 페이지 접속 (networkidle로 완전 로드 대기)
        console.log('📄 [Playwright] Navigating...');
        await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

        // 2. 랜덤 대기 (사람처럼)
        console.log('⏳ [Playwright] Random delay...');
        await randomDelay(2000, 4000);

        // 3. 스크롤 (사람처럼)
        console.log('📜 [Playwright] Human-like scrolling...');
        await humanScroll(page);

        // 4. 동적 콘텐츠 로드 대기 (네이버 등 SPA 대응)
        console.log('⏳ [Playwright] Waiting for dynamic content...');
        await page.waitForTimeout(3000);

        // 5. 셀렉터 찾기
        const hostname = new URL(url).hostname;
        let selectors = null;

        for (const [domain, sel] of Object.entries(MALL_SELECTORS)) {
            if (hostname.includes(domain)) {
                selectors = sel;
                break;
            }
        }

        // 6. 데이터 추출 (JSON-LD 우선, UI 폴백)
        console.log('🔍 [Playwright] Extracting data...');

        const result = await page.evaluate(({ sel }) => {
            let price = 0;
            let title = null;
            let image = null;

            // ========== 방법 1: JSON-LD 구조화 데이터 (가장 안정적) ==========
            try {
                const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                for (const script of scripts) {
                    try {
                        let data = JSON.parse(script.textContent);

                        // 배열인 경우 첫 번째 요소 사용
                        if (Array.isArray(data)) {
                            data = data[0];
                        }

                        // Product 타입 확인
                        if (data && (data['@type'] === 'Product' || data.offers)) {
                            title = title || data.name;
                            image = image || (Array.isArray(data.image) ? data.image[0] : data.image);

                            if (data.offers) {
                                const offers = Array.isArray(data.offers) ? data.offers : [data.offers];
                                for (const offer of offers) {
                                    const offerPrice = offer.price || offer.lowPrice;
                                    if (offerPrice) {
                                        const parsedPrice = parseInt(String(offerPrice).replace(/[^0-9]/g, ''));
                                        if (parsedPrice > 0) {
                                            price = parsedPrice;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        if (price > 0) break;
                    } catch (parseErr) {
                        // 개별 스크립트 파싱 실패 - 다음 스크립트로
                    }
                }
            } catch (e) {
                // JSON-LD 전체 실패
            }

            // ========== 방법 2: OG 메타 태그 ==========
            if (!title) {
                const ogTitle = document.querySelector('meta[property="og:title"]');
                title = ogTitle?.content || document.title || null;
            }
            if (!image) {
                const ogImage = document.querySelector('meta[property="og:image"]');
                image = ogImage?.content || null;
            }
            if (price === 0) {
                // product:price:amount 메타 태그 확인
                const metaPrice = document.querySelector('meta[property="product:price:amount"]');
                if (metaPrice?.content) {
                    price = parseInt(metaPrice.content) || 0;
                }
            }

            // ========== 방법 3: UI에서 스크랩 (폴백) ==========
            if (price === 0) {
                // 네이버: blind 스팬 다음 형제 요소에서 가격 추출
                const blindSpan = Array.from(document.querySelectorAll('span.blind'))
                    .find(el => el.textContent.includes('상품 가격'));
                if (blindSpan) {
                    const priceEl = blindSpan.nextElementSibling;
                    if (priceEl) {
                        const priceText = priceEl.textContent.replace(/[^0-9]/g, '');
                        if (priceText) price = parseInt(priceText);
                    }
                }
            }

            if (price === 0 && sel?.price) {
                // 기존 선택자 사용
                for (const selector of sel.price) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        for (const el of elements) {
                            const text = el.innerText || el.textContent || '';
                            const match = text.replace(/[^0-9]/g, '');
                            if (match && parseInt(match) > 100) {
                                price = parseInt(match);
                                break;
                            }
                        }
                        if (price > 0) break;
                    } catch (e) { /* ignore */ }
                }
            }

            // 최종 폴백: 페이지 전체에서 가격 패턴 스캔
            if (price === 0) {
                const candidates = document.querySelectorAll('span, strong, em, b, div');
                for (const el of candidates) {
                    const text = (el.innerText || '').replace(/\s+/g, '');
                    const match = text.match(/([0-9,]+)원/);
                    if (match && text.length < 30) {
                        const parsedPrice = parseInt(match[1].replace(/,/g, ''));
                        if (parsedPrice > 100 && parsedPrice < 100000000) {
                            price = parsedPrice;
                            break;
                        }
                    }
                }
            }

            return { price, title, image };
        }, { sel: selectors });

        const mallName = detectMallName(url);

        console.log(`✅ [Playwright] Crawled: "${result.title}" - ${result.price}원 (${mallName})`);

        await browser.close();

        return {
            success: true,
            title: result.title,
            image: result.image,
            price: result.price,
            mall: mallName,
            url
        };

    } catch (error) {
        console.error(`❌ [Playwright] Error:`, error.message);
        if (browser) {
            try { await browser.close(); } catch (e) { /* ignore */ }
        }
        return { success: false, error: error.message, url };
    }
}

module.exports = { crawlProductUrl, detectMallName };
