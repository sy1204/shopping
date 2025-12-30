// 네이버 쇼핑 API 연동
const { searchNaverShopping } = require('./naver_api');

/**
 * 5대 쇼핑몰에서 상품을 검색하고 가장 리뷰가 많은(인기 있는) 상품의 정보를 추출합니다.
 * 현재는 안정적이고 빠른 네이버 API만 사용합니다.
 */
async function searchMalls(query) {
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

            return { success: false, error: "No results found from API." };
        }
    } catch (e) {
        console.error('❌ [통합 검색 실패]:', e.message);
        return { success: false, error: e.message };
    }
}

/**
 * (Deprecated) URL 직접 입력을 통한 단일 상품 크롤링
 * Puppeteer 제거로 인해 현재 지원되지 않습니다.
 */
async function crawlProduct(url) {
    console.warn("⚠️ [크롤링 경고] 직접 URL 크롤링 기능은 현재 비활성화되어 있습니다. (Puppeteer 제거됨)");
    return { success: false, error: "Feature Not Implemented: Direct URL crawling is disabled for cloud deployment." };
}

module.exports = { searchMalls, crawlProduct };
