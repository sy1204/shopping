const fs = require('fs');
const path = require('path');
require('dotenv').config();
const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function runDiagnostics() {
    console.log('🩺 [진단 시작] 시스템 상태를 점검합니다...\n');

    // 1. .env 파일 및 환경 변수 점검
    console.log('1️⃣ 환경 변수 점검');
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        console.log('   ✅ .env 파일이 존재합니다.');
    } else {
        console.error('   ❌ .env 파일을 찾을 수 없습니다!');
    }

    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (clientId && clientSecret) {
        console.log(`   ✅ Naver Client ID 확인됨: ${clientId.substring(0, 3)}***`);
        console.log(`   ✅ Naver Client Secret 확인됨: ${clientSecret.substring(0, 3)}***`);
    } else {
        console.error('   ❌ 네이버 API 키가 환경 변수에 설정되지 않았습니다.');
    }
    console.log('');

    // 2. 네이버 API 호출 테스트
    console.log('2️⃣ 네이버 API 연결 테스트');
    if (clientId && clientSecret) {
        try {
            console.log('   📡 네이버 쇼핑 검색 API 호출 시도...');
            const response = await axios.get('https://openapi.naver.com/v1/search/shop.json', {
                params: { query: '테스트', display: 1 },
                headers: {
                    'X-Naver-Client-Id': clientId,
                    'X-Naver-Client-Secret': clientSecret
                }
            });
            if (response.status === 200) {
                console.log('   ✅ API 호출 성공! (상태 코드: 200)');
            } else {
                console.warn(`   ⚠️ API 응답이 200이 아닙니다: ${response.status}`);
            }
        } catch (error) {
            console.error('   ❌ API 호출 실패:', error.message);
            if (error.response) {
                console.error('      응답 데이터:', JSON.stringify(error.response.data));
                if (error.response.status === 401) console.error('      💡 401 에러: 인증 실패. Client ID/Secret을 다시 확인해주세요.');
                if (error.response.status === 403) console.error('      💡 403 에러: 권한 없음. [쇼핑] API가 추가되어 있는지 확인해주세요.');
            }
        }
    } else {
        console.log('   ⚠️ 키가 없어서 API 테스트를 건너뜁니다.');
    }
    console.log('');

    // 3. 브라우저(Puppeteer) 실행 테스트
    console.log('3️⃣ 동적 크롤러(Puppeteer) 실행 테스트');
    let browser;
    try {
        console.log('   🚀 브라우저 런치 시도 (Headless: "new")...');
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('   📡 구글 접속 시도...');
        await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 10000 });
        const title = await page.title();
        console.log(`   ✅ 접속 성공! 페이지 타이틀: "${title}"`);

    } catch (error) {
        console.error('   ❌ 브라우저 실행/접속 실패:', error.message);
    } finally {
        if (browser) await browser.close();
    }

    console.log('\n🏁 [진단 종료]');
}

runDiagnostics();
