const { crawlProduct } = require('./crawler');

async function testCrawl() {
    const testUrl = 'https://whal.eu/l/naKWNjQp'; // 사용자가 제공한 테스트 URL (리다이렉션 포함)
    console.log(`🧪 [테스트] 고도화된 동적 크롤링 테스트를 시작합니다: ${testUrl}`);

    const result = await crawlProduct(testUrl);

    if (result.success) {
        console.log('✅ [성공] 상품 정보를 성공적으로 가져왔습니다!');
        console.log('📦 상품명:', result.title);
        console.log('💰 가격:', result.price);
    } else {
        console.error('❌ [실패] 크롤링 중 오류가 발생했습니다:', result.error);
    }
}

testCrawl();
