const { searchNaverShopping } = require('./naver_api');
require('dotenv').config();

async function test() {
    console.log("Testing Naver Search...");
    const result = await searchNaverShopping("맥북");
    console.log("Result:", JSON.stringify(result, null, 2));
}

test();
