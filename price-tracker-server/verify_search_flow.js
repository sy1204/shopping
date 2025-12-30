const axios = require('axios');

async function verifySearch() {
    const API_URL = 'http://localhost:3001/api/search';
    const TEST_QUERY = 'Apple MacBook Air M2';

    console.log(`🚀 Testing Search API: ${API_URL}`);
    console.log(`🔎 Query: "${TEST_QUERY}"`);

    try {
        const response = await axios.post(API_URL, { query: TEST_QUERY });

        if (response.status === 200 && response.data.results) {
            console.log('✅ API Request Successful');
            console.log(`📦 Found ${response.data.results.length} items.`);
            console.log(`🆔 Product Group ID: ${response.data.productId}`);

            const firstItem = response.data.results[0];
            console.log('📝 First Item Sample:');
            console.log(`   - Title: ${firstItem.title}`);
            console.log(`   - Price: ${firstItem.price}`);
            console.log(`   - Mall: ${firstItem.mall}`);

            if (response.data.productId) {
                console.log('✅ DB Integration Verified (Product ID generated)');
            } else {
                console.warn('⚠️ Product ID missing - DB Save might have failed');
            }

        } else {
            console.error('❌ API returned unexpected structure:', response.data);
        }

    } catch (error) {
        console.error('❌ API Request Failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

verifySearch();
