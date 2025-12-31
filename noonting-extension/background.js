const API_BASE_URL = 'http://localhost:3002/api';

// 1. 메인 앱(대시보드) 접속 시 동기화 시작
// 1. 메인 앱(대시보드) 접속 시 동기화 시작
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'START_SYNC' || request.type === 'SYNC_NOW') {
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

        // URL만 추출 (중복 제거 & http만)
        const urlsToTrack = new Set();
        products.forEach(p => {
            p.malls.forEach(m => {
                if (m.url && m.url.startsWith('http')) {
                    urlsToTrack.add(m.url);
                }
            });
        });

        console.log(`📋 Found ${urlsToTrack.size} URLs to track.`);

        // 2. 각 URL을 백그라운드 탭으로 순차적으로 열기
        const urls = Array.from(urlsToTrack);
        processUrlQueue(urls);

    } catch (error) {
        console.error('❌ Failed to fetch products:', error);
    }
}

function processUrlQueue(urls) {
    if (urls.length === 0) {
        console.log('✅ All tabs opened for sync.');
        return;
    }

    const url = urls.shift();
    openTabForUrl(url);

    // Next one in 5 seconds (give time for page load + logic)
    setTimeout(() => {
        processUrlQueue(urls);
    }, 5000);
}

function openTabForUrl(url) {
    chrome.tabs.create({ url: url, active: false }, (tab) => {
        activeTabs[tab.id] = url;
        console.log(`OPENED tab ${tab.id} for ${url}`);

        // Safety: Close tab after 20 seconds if no price found (prevent zombie tabs)
        setTimeout(() => {
            if (activeTabs[tab.id]) {
                console.log(`⏰ Timeout: Closing tab ${tab.id} (No price found)`);
                chrome.tabs.remove(tab.id, () => {
                    // Ignore error if tab already closed
                    if (chrome.runtime.lastError) { }
                });
                delete activeTabs[tab.id];
            }
        }, 20000);
    });
}

async function handlePriceFound(data, tabId) {
    const { url, price, mall, title, image, description } = data; // Added description
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
            body: JSON.stringify({ url, price, title, image, description }) // Added description
        });
        console.log('💾 Price & Info saved to server.');
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
