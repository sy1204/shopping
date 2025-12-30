const { searchMalls } = require('./crawler');

const url = "https://brand.naver.com/anker/products/8719033362?NaPm=ct%3Dmjs79jb6%7Cci%3DrBklRwAAAZtt677rALwucQ%2E%2E04%7Ctr%3Dpmax%7Chk%3Dec3fffec9980f6e46141c017cae2768fc111d2c2%7Cnacn%3Dof8kCohe6JAIB";

async function testSearchAPI() {
    console.log(`Searching Naver API for URL: ${url}`);

    try {
        const result = await searchMalls(url);
        console.log('--- Search API Result ---');
        console.log(JSON.stringify(result, null, 2));

        if (result.success && result.results.length > 0) {
            console.log('✅ Found product via API!');
        } else {
            console.log('❌ Not found via API.');
        }

    } catch (error) {
        console.error('Error calling searchMalls:', error);
    }
}

testSearchAPI();
