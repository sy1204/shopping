require('dotenv').config();
const { searchMalls } = require('./crawler');

async function test() {
    console.log('Testing searchMalls with "햇반"...');
    const result = await searchMalls('햇반');
    console.log('Result:', JSON.stringify(result, null, 2));
}

test();
