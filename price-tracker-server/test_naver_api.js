require('dotenv').config();
const { searchNaverShopping } = require('./naver_api');

async function test() {
    console.log('🧪 [Test] 네이버 API 단독 테스트 시작...');

    // 환경변수 체크
    if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
        console.error('❌ .env 파일 로드 실패 또는 키 누락');
        return;
    }

    // 검색 실행
    const query = "맥북 에어 M3";
    console.log(`🔎 검색어: ${query}`);

    try {
        const result = await searchNaverShopping(query);
        console.log('---------------------------------------------------');
        console.log('🔍 결과 반환:', JSON.stringify(result, null, 2));

        if (result.success && result.items.length > 0) {
            console.log('✅ 테스트 성공! 데이터를 정상적으로 가져왔습니다.');
        } else {
            console.log('⚠️ 테스트 실패 (항목 없음). 네이버 API 응답을 확인하세요.');
        }

    } catch (e) {
        console.error('❌ 테스트 중 치명적 에러:', e);
    }
}

test();
