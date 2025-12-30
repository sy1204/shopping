const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Force UTF-8 for all responses to prevent encoding issues (Mojibake)
app.use((req, res, next) => {
    res.header('Content-Type', 'application/json; charset=utf-8');
    next();
});

const { supabase, saveCrawlResult, saveSearchResults } = require('./db');
const { searchMalls } = require('./crawler');
const authMiddleware = require('./middleware/auth');

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Price Tracker API is running', status: 'online' });
});

// 1. 통합 검색 및 자동 등록 API (새로운 방식)
app.post('/api/search', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Search query is required' });

    console.log(`🔎 [API] 통합 검색 요청 수신: "${query}"`);

    // (1) 5대 쇼핑몰 동시 검색 및 인기 상품 추출
    const searchResult = await searchMalls(query);

    console.log('🔍 [API DEBUG] searchResult:', JSON.stringify(searchResult, null, 2));

    if (!searchResult.success) {
        console.error('❌ [API] 통합 검색 실패:', searchResult.error);
        return res.status(500).json({ error: 'Search failed', details: searchResult.error });
    }

    // (2) 검색된 결과를 DB에 자동 매칭하여 저장
    const dbResult = await saveSearchResults(query, searchResult.results);

    if (dbResult.success) {
        console.log('💾 [API] 검색 결과 DB 저장 완료');
        res.json({
            message: 'Search and registration completed',
            query: query,
            resultsCount: searchResult.results.length,
            productId: dbResult.productId,
            results: searchResult.results
        });
    } else {
        console.error('❌ [API] DB 저장 실패:', dbResult.error);
        res.status(500).json({ error: 'Search completed but failed to save to DB', details: dbResult.error });
    }
});

// 2. 개별 URL 크롤링 및 저장 API (기존 방식 유지)
app.post('/api/crawl', async (req, res) => {
    // ... (기존 crawlProduct가 crawler.js에서 제거되었으므로, 필요한 경우 다시 추가하거나 searchMalls로 일원화)
    res.status(501).json({ error: 'Manual URL crawl is being refactored. Use /api/search instead.' });
});

// 3. 상품 목록 조회 API (New)
app.get('/api/products', async (req, res) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select(`
                *,
                product_links (
                    *
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 프런트엔드 형식에 맞게 데이터 변환
        const formattedProducts = products.map(p => ({
            id: p.id,
            name: p.title,
            image: p.represent_image,
            targetPrice: 0, // 기본값 (DB에 컬럼 추가 필요할 수 있음)
            memo: "",
            specs: [],
            malls: p.product_links.map(link => ({
                name: link.mall_name,
                price: link.current_price,
                url: link.url,
                histories: [] // 가격 이력은 별도 조회 필요하거나 조인 필요
            }))
        }));

        res.json(formattedProducts);
    } catch (error) {
        console.error('❌ Failed to fetch products:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 4. 구독(관심 상품) 관리 API (Protected)
app.get('/api/subscriptions', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabase
            .from('subscriptions')
            .select(`
                *,
                products (
                    *,
                    product_links (*)
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('❌ Failed to fetch subscriptions:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/subscriptions', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, targetPrice, memo } = req.body;

        const { data, error } = await supabase
            .from('subscriptions')
            .insert([{
                user_id: userId,
                product_id: productId,
                target_price: targetPrice,
                memo: memo
            }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('❌ Failed to create subscription:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
