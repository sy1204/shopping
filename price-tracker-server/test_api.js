const { searchNaverShopping } = require('./naver_api');

async function testApi() {
    console.log('🧪 [테스트] 네이버 쇼핑 API 연동 테스트를 시작합니다...');
    const result = await searchNaverShopping('앤커 Q45');

    if (result.success) {
        console.log('✅ [성공] API로부터 데이터를 정상적으로 수신했습니다!');
        console.log('📋 수집된 첫 번째 상품:', result.items[0]);
    } else {
        console.error('❌ [실패] API 호출 중 오류가 발생했습니다:', result.error);
        console.log('💡 팁: .env 파일의 Client ID와 Secret이 정확한지, 그리고 API 권한에 [쇼핑]이 포함되어 있는지 확인해 주세요.');
    }
}

testApi();
