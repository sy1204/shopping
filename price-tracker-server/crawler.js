const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// 네이버 쇼핑 API 연동
const { searchNaverShopping } = require('./naver_api');

/**
 * 인간다운 마우스 움직임을 시뮬레이션합니다. (베지어 곡선 활용)
 */
async function simulateHumanMouse(page) {
    try {
        console.log('🖱️ [행동] 마우스 움직임 모사 시작...');
        const viewport = await page.viewport();
        if (!viewport) return;
        const { width, height } = viewport;

        let currentX = Math.random() * width;
        let currentY = Math.random() * height;

        const steps = 5 + Math.floor(Math.random() * 5); // 단계 축소
        const targetX = width / 2 + (Math.random() - 0.5) * 100;
        const targetY = height / 2 + (Math.random() - 0.5) * 100;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = currentX + (targetX - currentX) * t;
            const y = currentY + (targetY - currentY) * t;

            await page.mouse.move(x, y);
            await new Promise(r => setTimeout(r, 10 + Math.random() * 10));
        }
        console.log('🖱️ [행동] 마우스 움직임 완료.');
    } catch (e) {
        console.warn('⚠️ 마우스 시뮬레이션 중 오류:', e.message);
    }
}

/**
 * 인간다운 스크롤링을 시뮬레이션합니다.
 */
async function simulateHumanScroll(page) {
    try {
        console.log('📜 [행동] 스크롤링 모사 시작...');
        const distance = 200 + Math.floor(Math.random() * 300);
        const steps = 5;

        for (let i = 0; i < steps; i++) {
            await page.evaluate((dist) => {
                window.scrollBy(0, dist);
            }, distance / steps);
            await new Promise(r => setTimeout(r, 50 + Math.random() * 50));
        }
        console.log('📜 [행동] 스크롤링 완료.');
    } catch (e) {
        console.warn('⚠️ 스크롤 시뮬레이션 중 오류:', e.message);
    }
}

/**
 * 5대 쇼핑몰에서 상품을 검색하고 가장 리뷰가 많은(인기 있는) 상품의 정보를 추출합니다.
 * 1단계: 네이버 API 우선 호출 (빠르고 안정적)
 * 2단계: 추가 쇼핑몰은 Puppeteer로 시도 (선택적 폴백)
 */
async function searchMalls(query) {
    let browser = null;
    const results = [];

    try {
        console.log(`🚀 [통합 검색 시작] "${query}" 키워드로 검색을 시작합니다...`);

        // ========== 1단계: 네이버 API 우선 호출 ==========
        console.log('📡 [1단계] 네이버 쇼핑 API를 통한 빠른 검색 시도...');
        const naverApiResult = await searchNaverShopping(query);

        if (naverApiResult.success && naverApiResult.items && naverApiResult.items.length > 0) {
            console.log(`✅ [1단계 성공] 네이버 API에서 ${naverApiResult.items.length}개의 상품을 가져왔습니다.`);

            // API 결과를 기존 형식에 맞게 변환하여 추가
            for (const item of naverApiResult.items) {
                results.push({
                    mall: item.mall || 'Naver',
                    title: item.title,
                    price: item.price,
                    link: item.link,
                    image: item.image
                });
            }

            // 네이버 API 성공 시 빠르게 반환
            console.log(`✨ [검색 완료] 네이버 API로 ${results.length}개의 상품 정보 수집 성공.`);
            return { success: true, results };
        } else {
            console.warn('⚠️ [1단계 실패] 네이버 API에서 결과를 가져오지 못했습니다.');
            const errorMsg = naverApiResult.error || `[Debug] Success but no items. Result: ${JSON.stringify(naverApiResult)}`;

            // ========== 2단계: Puppeteer 크롤링 폴백 (Deprecated) ==========
            /*
            console.log('🔄 [2단계] Puppeteer 크롤링 시도... (현재 비활성화됨)');
            */
            /*
            return { success: false, error: errorMsg };
            */
            return { success: false, error: "DEBUG MODE ACTIVE" };
        }
    } catch (e) {
        console.error('❌ [통합 검색 실패]:', e.message);
        return { success: false, error: e.message };
    }
}

/**
 * URL 직접 입력을 통한 단일 상품 크롤링
 */
async function crawlProduct(url) {
    let browser = null;
    try {
        console.log(`📡 [크롤링 시작] URL 접속 중: ${url}`);
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log(`📡 [단계 1] 페이지 접속 시도 (${url})`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        console.log('📡 [단계 1] 페이지 로드 완료. (domcontentloaded)');

        // 인간다운 행동 수행
        await simulateHumanMouse(page);
        await simulateHumanScroll(page);

        console.log('🧐 [단계 2] 데이터 추출 시도...');
        const isCoupang = url.includes('coupang.com');
        const data = await page.evaluate((isCoupang) => {
            if (isCoupang) {
                const title = document.querySelector('.prod-buy-header__title')?.innerText || "Unknown";
                const price = document.querySelector('.total-price strong')?.innerText ||
                    document.querySelector('.raw-price-info')?.innerText || "0";
                return { title, price };
            }
            return { title: document.title, price: "0" };
        }, isCoupang);

        const cleanPrice = parseInt(data.price.replace(/[^0-9]/g, '')) || 0;
        return { success: true, title: data.title, price: cleanPrice };

    } catch (error) {
        console.error('❌ [크롤링 에러]:', error.message);
        return { success: false, error: error.message };
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { searchMalls, crawlProduct };
