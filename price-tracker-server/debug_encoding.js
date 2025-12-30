const axios = require('axios');

async function testEncoding() {
    try {
        console.log('📡 Testing /api/search encoding...');
        // Request with explicit responseType: 'arraybuffer' to see raw bytes
        const response = await axios.post('http://localhost:3001/api/search', {
            query: '맥북'
        }, {
            responseType: 'arraybuffer'
        });

        console.log('Status:', response.status);
        console.log('Headers:', response.headers);

        const rawBuffer = response.data;
        const text = rawBuffer.toString('utf-8');

        console.log('--- Body Preview (UTF-8 string) ---');
        console.log(text.slice(0, 500)); // Show beginning
        console.log('-----------------------------------');

        // Parse JSON
        const data = JSON.parse(text);
        if (data.results && data.results.length > 0) {
            const firstItem = data.results[0];
            console.log('First Item Title:', firstItem.title);

            // Print hex of the title
            const titleBuffer = Buffer.from(firstItem.title, 'utf-8');
            console.log('Title Hex (UTF-8):', titleBuffer.toString('hex'));

            // Check for replacement characters
            if (firstItem.title.includes('')) {
                console.error('❌ REPLACEMENT CHARACTER FOUND in title! Server is sending corrupted data.');
            } else {
                console.log('✅ Title looks clean (no replacement chars).');
            }
        }
    } catch (e) {
        console.error('Test Failed:', e.message);
        if (e.response) {
            console.error('Response Data:', e.response.data.toString());
        }
    }
}

testEncoding();
