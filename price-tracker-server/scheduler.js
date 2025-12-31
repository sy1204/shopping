/**
 * 가격 크롤링 스케줄러
 * - 하루 5회 자동 실행 (08, 11, 14, 17, 20시)
 * - 각 상품 URL 간 랜덤 대기로 차단 방지
 */

const cron = require('node-cron');
const { crawlProductUrl } = require('./playwright_crawler');
const { getAllProducts, savePriceUpdate } = require('./db');

// 하루 5회 크롤링 시간 (KST 기준)
const CRAWL_SCHEDULES = [
    '0 8 * * *',   // 08:00
    '0 11 * * *',  // 11:00
    '0 14 * * *',  // 14:00
    '0 17 * * *',  // 17:00
    '0 20 * * *'   // 20:00
];

// 크롤링 상태 추적
let isCrawling = false;

/**
 * 모든 상품의 가격 업데이트
 */
async function runPriceCrawl(batchNumber) {
    if (isCrawling) {
        console.log('⚠️ [Scheduler] Previous crawl still running, skipping...');
        return;
    }

    isCrawling = true;
    console.log(`\n⏰ [Scheduler] Starting price crawl batch #${batchNumber} at ${new Date().toLocaleString('ko-KR')}`);

    try {
        const products = await getAllProducts();
        console.log(`📦 [Scheduler] Found ${products.length} products to update`);

        let successCount = 0;
        let failCount = 0;

        for (const product of products) {
            // malls 배열에서 URL 추출
            const urls = product.malls?.map(m => m.url).filter(u => u && u.startsWith('http')) || [];

            for (const url of urls) {
                try {
                    // 각 URL 크롤링 전 랜덤 대기 (30초 ~ 2분)
                    const waitTime = 30000 + Math.random() * 90000;
                    console.log(`⏳ [Scheduler] Waiting ${Math.round(waitTime / 1000)}s before next crawl...`);
                    await new Promise(r => setTimeout(r, waitTime));

                    const result = await crawlProductUrl(url);

                    if (result.success && result.price > 0) {
                        // 가격 히스토리에 저장
                        await savePriceUpdate(url, result.price);
                        successCount++;
                        console.log(`✅ [Scheduler] Updated: ${result.title} = ${result.price}원`);
                    } else {
                        failCount++;
                        console.log(`⚠️ [Scheduler] Failed to get price for: ${url}`);
                    }
                } catch (error) {
                    failCount++;
                    console.error(`❌ [Scheduler] Error crawling ${url}:`, error.message);
                }
            }
        }

        console.log(`\n📊 [Scheduler] Batch #${batchNumber} completed:`);
        console.log(`   ✅ Success: ${successCount}`);
        console.log(`   ❌ Failed: ${failCount}`);

    } catch (error) {
        console.error('❌ [Scheduler] Batch failed:', error.message);
    } finally {
        isCrawling = false;
    }
}

/**
 * 스케줄러 초기화
 */
function initScheduler() {
    console.log('📅 [Scheduler] Initializing with 5 daily crawl jobs...');

    CRAWL_SCHEDULES.forEach((cronTime, index) => {
        cron.schedule(cronTime, () => {
            runPriceCrawl(index + 1);
        }, {
            timezone: 'Asia/Seoul'
        });

        const [minute, hour] = cronTime.split(' ');
        console.log(`   📌 Job #${index + 1}: ${hour}:${minute.padStart(2, '0')} KST`);
    });

    console.log('✅ [Scheduler] Ready!\n');
}

/**
 * 수동 크롤링 트리거 (테스트용)
 */
async function manualCrawl() {
    console.log('🔧 [Scheduler] Manual crawl triggered');
    await runPriceCrawl(0);
}

module.exports = { initScheduler, manualCrawl, runPriceCrawl };
