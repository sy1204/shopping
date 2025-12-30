
// 1. 대시보드(메인 앱) 감지 -> 동기화 시작 트리거
if (window.location.hostname.includes('shopping-sy1204s-projects.vercel.app') || window.location.hostname.includes('localhost')) {
    console.log('👀 Noonting Dashboard detected. Triggering Sync...');

    window.addEventListener('load', () => {
        chrome.runtime.sendMessage({ type: 'START_SYNC' }, (response) => {
            console.log('✅ Sync started:', response);
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
    let title = null;
    let image = null;

    try {
        // --- Metadata Extraction (Common) ---
        const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
        const ogImage = document.querySelector('meta[property="og:image"]')?.content;
        title = ogTitle || document.title;
        image = ogImage;

        // --- Coupang ---
        if (hostname.includes('coupang.com')) {
            mallName = 'Coupang';
            const element = document.querySelector('span.total-price > strong') ||
                document.querySelector('.prod-sale-price .total-price > strong');
            if (element) price = parsePrice(element.innerText);
        }

        // --- Naver SmartStore / Shopping ---
        else if (hostname.includes('naver.com')) {
            mallName = 'Naver';
            const element = document.querySelector('.lowest_price_area .price') ||
                document.querySelector('._price_area ._price') ||
                document.querySelector('.price_area .price');
            if (element) price = parsePrice(element.innerText);
        }

        // --- Gmarket ---
        else if (hostname.includes('gmarket.co.kr')) {
            mallName = 'Gmarket';
            const element = document.querySelector('.price_real > .price_txt') ||
                document.querySelector('.price_real');
            if (element) price = parsePrice(element.innerText);
        }

        // --- 11st ---
        else if (hostname.includes('11st.co.kr')) {
            mallName = '11st';
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
                    mall: mallName,
                    title: title, // Added
                    image: image  // Added
                }
            });
        }

    } catch (e) {
        console.error('Noonting Parse Error:', e);
    }
}

function parsePrice(text) {
    if (!text) return 0;
    return parseInt(text.replace(/[^0-9]/g, ''), 10);
}
