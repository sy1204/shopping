const API_BASE_URL = 'http://localhost:3001/api';

// 1. 메인 앱(대시보드) 접속 시 동기화 시작
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'START_SYNC') {
        startSyncProcess();
        sendResponse({ status: 'started' });
    } else if (request.type === 'PRICE_FOUND') {
        handlePriceFound(request.data, sender.tab.id);
    }
});

let activeTabs = {}; // tabId -> url mapping for tracking

async function startSyncProcess() {
    console.log('🔄 Starting Sync Process...');
    try {
        // 1. 서버에서 상품 목록 가져오기
        const response = await fetch(`${API_BASE_URL}/products`);
        const products = await response.json();

        // URL만 추출 (중복 제거)
        const urlsToTrack = new Set();
        products.forEach(p => {
            p.malls.forEach(m => {
                if (m.url && m.url.startsWith('http')) {
                    urlsToTrack.add(m.url);
                }
            });
        });

        console.log(`📋 Found ${urlsToTrack.size} URLs to track.`);

        // 2. 각 URL을 백그라운드 탭으로 열기
        // 너무 한꺼번에 열면 브라우저가 느려지므로 순차적으로 열거나 제한을 둠.
        // 여기서는 간단히 3초 간격으로 엽니다.
        const urls = Array.from(urlsToTrack);
        let index = 0;

        const interval = setInterval(() => {
            if (index >= urls.length) {
                clearInterval(interval);
                console.log('✅ All tabs opened.');
                return;
            }

            const url = urls[index];
            openTabForUrl(url);
            index++;
        }, 3000); // 3 seconds delay

    } catch (error) {
        console.error('❌ Failed to fetch products:', error);
    }
}

function openTabForUrl(url) {
    chrome.tabs.create({ url: url, active: false }, (tab) => {
        activeTabs[tab.id] = url;
        console.log(`OPENED tab ${tab.id} for ${url}`);
    });
}

async function handlePriceFound(data, tabId) {
    const { url, price, mall } = data;
    console.log(`💰 Price Found: ${price} at ${mall} (${url})`);

    // 1. 서버로 데이터 전송
    try {
        // id param is strictly not needed if we utilize savePriceUpdate(url, price) 
        // but the route is /api/products/:id/price. I'll use a dummy ID '0' or fix the server.
        // The server implementation uses `savePriceUpdate(url, price)` inside and ignores `:id` mostly (validation purpose).
        // I will use '0' as placeholder.
        await fetch(`${API_BASE_URL}/products/0/price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, price })
        });
        console.log('💾 Price saved to server.');
    } catch (error) {
        console.error('❌ Failed to save price:', error);
    }

    // 2. 탭 닫기 (우리가 연 탭이라면)
    if (activeTabs[tabId]) {
        chrome.tabs.remove(tabId);
        delete activeTabs[tabId];
        console.log(`CLOSED tab ${tabId}`);
    }
}
