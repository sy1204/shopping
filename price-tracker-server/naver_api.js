const axios = require('axios');
require('dotenv').config();

/**
 * 네이버 쇼핑 검색 API를 사용하여 상품 정보를 가져옵니다.
 */
async function searchNaverShopping(query) {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.warn('⚠️ 네이버 API 키가 설정되지 않았습니다. .env 파일을 확인해 주세요.');
        return { success: false, error: 'API keys missing' };
    }

    try {
        console.log(`📡 [네이버 API] "${query}" 키워드 검색을 시도합니다...`);
        // arraybuffer로 받아서 직접 디코딩 (인코딩 문제 해결)
        const response = await axios.get('https://openapi.naver.com/v1/search/shop.json', {
            params: {
                query: query,
                display: 20, // 필터링 대비 넉넉하게 요청
                start: 1,
                sort: 'sim' // 유사도순 (인기순)
            },
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret
            },
            responseType: 'arraybuffer'
        });

        // 명시적 UTF-8 디코딩
        const decodedString = Buffer.from(response.data).toString('utf-8');
        const data = JSON.parse(decodedString);

        // [DEBUG] API 원본 응답 확인
        console.log('🐛 [API DEBUG] Raw Response Data:', JSON.stringify(data.items ? { ...data, items: `[Array(${data.items.length})]` } : data, null, 2));

        if (data && data.items) {
            // 우리가 설정한 'Clean & Hybrid' 원칙에 따라 데이터 가공
            const processedItems = data.items.map(item => {
                // 1. 텍스트 정제: HTML 태그(<b> 등) 제거
                const cleanTitle = item.title.replace(/<[^>]*>?/gm, '');

                return {
                    mall: item.mallName,
                    title: cleanTitle,
                    price: parseInt(item.lprice) || 0,
                    link: item.link,
                    image: item.image, // 나중에 나노바나나 등에서 변환할 원본 소스
                    productId: item.productId,
                    category: `${item.category1} > ${item.category2}`
                };
            });

            // [스마트 필터링 1단계] 키워드 기반
            // 사용자 검색어에 '케이스', '필름', '거치대' 등이 포함되지 않은 경우에만 필터링 수행
            const isAccessorySearch = /케이스|필름|커버|거치대|스트랩|충전기|어댑터|보호|강화유리/i.test(query);

            let filteredItems = processedItems.filter(item => {
                if (isAccessorySearch) return true; // 액세서리 검색이면 필터링 패스

                // 1. 제외 키워드 필터링
                const excludeKeywords = ['케이스', '필름', '커버', '거치대', '스트랩', '보호', '강화유리', '스킨', '파우치'];
                const hasExcludeKeyword = excludeKeywords.some(keyword => item.title.includes(keyword));
                if (hasExcludeKeyword) return false;

                // 2. 절대 가격 하한선 (너무 싼 가격 제외 - 1000원 미만)
                if (item.price < 1000) return false;

                // 3. 인코딩 깨짐 문자()가 포함된 경우 필터링 (New)
                if (item.title.includes('\uFFFD')) {
                    console.log(`⚠️ [Encoding Filter] 깨진 문자 포함되어 제외: ${item.title}`);
                    return false;
                }

                return true;
            });

            // [스마트 필터링 2단계] 가격 분포 기반 동적 필터링 (Outlier Detection)
            if (!isAccessorySearch && filteredItems.length >= 3) {
                // 가격 오름차순 정렬하여 분포 확인
                const sortedPrices = filteredItems.map(i => i.price).sort((a, b) => a - b);

                // 중위 가격(Median) 계산
                const mid = Math.floor(sortedPrices.length / 2);
                const medianPrice = sortedPrices.length % 2 !== 0
                    ? sortedPrices[mid]
                    : (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;

                // 임계값 설정: 중위 가격의 20%
                const threshold = medianPrice * 0.2;

                console.log(`📊 [가격 분석] Median: ${medianPrice.toLocaleString()}원, Threshold(20%): ${threshold.toLocaleString()}원`);

                const initialCount = filteredItems.length;
                filteredItems = filteredItems.filter(item => {
                    const isTooCheap = item.price < threshold;
                    if (isTooCheap) console.log(`✂️ [가격 필터] 제외됨: ${item.title} (${item.price.toLocaleString()}원) < ${threshold.toLocaleString()}원`);
                    return !isTooCheap;
                });

                if (filteredItems.length < initialCount) {
                    console.log(`📉 [Smart Filter] 가격 이상치 ${initialCount - filteredItems.length}개 추가 제거됨.`);
                }
            }

            console.log(`✅ [네이버 API] ${processedItems.length}개 수신 -> ${filteredItems.length}개로 최종 필터링됨`);
            return { success: true, items: filteredItems };
        }

        return { success: false, error: 'No items found' };

    } catch (error) {
        console.error('❌ [네이버 API 에러]:', error.response?.data?.message || error.message);
        if (error.response) {
            // responseType이 arraybuffer인 경우 문자열로 변환해서 출력
            const errorData = Buffer.isBuffer(error.response.data)
                ? error.response.data.toString('utf-8')
                : JSON.stringify(error.response.data);
            console.error('🔍 [상세 에러 정보]:', errorData);
        }
        return { success: false, error: error.message };
    }
}

module.exports = { searchNaverShopping };
