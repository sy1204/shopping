require('dotenv').config();

console.log('--- ENV CHECK ---');
console.log('NAVER_CLIENT_ID:', process.env.NAVER_CLIENT_ID ? '✅ Set (' + process.env.NAVER_CLIENT_ID.substring(0, 3) + '...)' : '❌ Unset');
console.log('NAVER_CLIENT_SECRET:', process.env.NAVER_CLIENT_SECRET ? '✅ Set' : '❌ Unset');
console.log('-----------------');
