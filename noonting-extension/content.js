
// 1. 대시보드(메인 앱) 감지 -> 동기화 시작 트리거
if (window.location.hostname.includes('shopping-sy1204s-projects.vercel.app') || window.location.hostname.includes('localhost')) {
    console.log('👀 Noonting Dashboard detected. Triggering Sync...');

    // 페이지 로드 완료 시 전송
    window.addEventListener('load', () => {
        chrome.runtime.sendMessage({ type: 'START_SYNC' }, (response) => {
            console.log('✅ Sync started:', response);
            // Optional: Add visual indicator on the page
            const badge = document.createElement('div');
            badge.innerHTML = '🔭 눈팅 중...';
            badge.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#3b82f6; color:white; padding:10px 20px; border-radius:30px; z-index:9999; font-weight:bold; box-shadow:0 4px 6px rgba(0,0,0,0.1);';
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 5000);
        });
    });
}

// 2. 쇼핑몰 감지 및 가격 추출
else {
    checkPrice();
}

function checkPrice() {
    const hostname = window.location.hostname;
    let price = null;
    let mallName = 'Unknown';

    try {
        // --- Coupang ---
        if (hostname.includes('coupang.com')) {
            mallName = 'Coupang';
            // span.total-price > strong
            const element = document.querySelector('span.total-price > strong') ||
                document.querySelector('.prod-sale-price .total-price > strong');
            if (element) price = parsePrice(element.innerText);
        }

        // --- Naver SmartStore / Shopping ---
        else if (hostname.includes('naver.com')) {
            mallName = 'Naver';
            // .lowest_price_area .price, ._price_area
            const element = document.querySelector('.lowest_price_area .price') ||
                document.querySelector('._price_area ._price') ||
                document.querySelector('.price_area .price');
            if (element) price = parsePrice(element.innerText);
        }

        // --- Gmarket ---
        else if (hostname.includes('gmarket.co.kr')) {
            mallName = 'Gmarket';
            // .price_real > .price_txt
            const element = document.querySelector('.price_real > .price_txt') ||
                document.querySelector('.price_real');
            if (element) price = parsePrice(element.innerText);
        }

        // --- 11st ---
        else if (hostname.includes('11st.co.kr')) {
            mallName = '11st';
            // .price_detail .value
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

        // 가격을 찾았으면 전송
        if (price && price > 0) {
            console.log(`✅ [Noonting] Price found: ${price} (${mallName})`);
            chrome.runtime.sendMessage({
                type: 'PRICE_FOUND',
                data: {
                    url: window.location.href,
                    price: price,
                    mall: mallName
                }
            });
        } else {
            // console.log('❌ [Noonting] Price not found on this page.');
        }

    } catch (e) {
        console.error('Noonting Parse Error:', e);
    }
}

function parsePrice(text) {
    if (!text) return 0;
    return parseInt(text.replace(/[^0-9]/g, ''), 10);
}
