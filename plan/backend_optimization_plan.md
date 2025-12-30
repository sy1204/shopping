# Backend Optimization & Deployment Plan

## Goal
Optimize `price-tracker-server` for deployment by removing heavy `puppeteer` dependencies (since we now rely on Naver API) and prepare for Render.com deployment.

## User Review Required
- **Breaking Change**: The "Direct URL Crawling" features (that used Puppeteer) will be completely removed. We will rely solely on the Search API.

## Proposed Changes

### Backend (`price-tracker-server`)
#### [MODIFY] [package.json](file:///c:/Users/User/workspace/shopping/price-tracker-server/package.json)
- Remove `puppeteer`, `puppeteer-extra`, `puppeteer-extra-plugin-stealth` from dependencies.

#### [MODIFY] [crawler.js](file:///c:/Users/User/workspace/shopping/price-tracker-server/crawler.js)
- Remove `require('puppeteer-extra')` and related initialization.
- Remove `crawlProduct` function (or stub it to throw "Not Implemented").
- Keep `searchMalls` which uses `naver_api.js`.

#### [MODIFY] [index.js](file:///c:/Users/User/workspace/shopping/price-tracker-server/index.js)
- Ensure `/api/crawl` endpoint returns a clear 404 or 501 Not Implemented message.

## Verification Plan
1.  **Local Test**: Run `npm start` and verify the server starts without Puppeteer errors.
2.  **API Test**: Call `/api/search` to ensure Naver API search still works.
