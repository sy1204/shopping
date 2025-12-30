const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios'); // Added for URL metadata fetching
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

const { supabase, saveCrawlResult, saveSearchResults, savePriceUpdate, getProductHistory } = require('./db');
const { searchMalls } = require('./crawler');
const authMiddleware = require('./middleware/auth');
const { getAllProducts, deleteProduct, updateProduct, getAllUsers, deleteUser, updateUser } = require('./db');

// Admin Middleware
const adminMiddleware = (req, res, next) => {
    // 1. Check if authenticated (handled by authMiddleware usually, but double check)
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // 2. Check Admin Whitelist
    const ADMIN_EMAILS = ['enrichdotcom@naver.com'];
    if (!ADMIN_EMAILS.includes(req.user.email)) {
        console.warn(`⛔ [Admin] Access denied for user: ${req.user.email}`);
        return res.status(403).json({ error: 'Forbidden: Admin access only' });
    }
    next();
};

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Noonting API is running', status: 'online' });
});

// 1. 통합 검색 및 자동 등록 API (Legacy Support)
app.post('/api/search', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Search query is required' });

    console.log(`🔎 [API] 통합 검색 요청 수신: "${query}"`);

    const searchResult = await searchMalls(query);

    if (!searchResult.success) {
        return res.status(500).json({ error: 'Search failed', details: searchResult.error });
    }

    const dbResult = await saveSearchResults(query, searchResult.results);

    if (dbResult.success) {
        res.json({
            message: 'Search and registration completed',
            query: query,
            resultsCount: searchResult.results.length,
            results: searchResult.results
        });
    } else {
        res.status(500).json({ error: 'Search completed but failed to save to DB', details: dbResult.error });
    }
});

// 2. URL 직접 등록 API (New Feature)
app.post('/api/products', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    console.log(`🔗 [API] URL 등록 요청: ${url}`);

    let title = '상품 정보를 가져오는 중...';
    let image = '';
    let price = 0;
    let fetchSuccess = false;

    try {
        // 1. Fetch Page Metadata (Best Effort)
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            timeout: 5000
        });
        const html = response.data;

        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);

        if (titleMatch) title = titleMatch[1];
        if (imageMatch) image = imageMatch[1];
        fetchSuccess = true;

        console.log(`📦 Metadata Fetched: ${title}`);

    } catch (error) {
        console.warn('⚠️ URL Fetch Failed (Network/Blocked). Registering as Placeholder.', error.message);
        // Continue with default placeholder values
    }

    // 2. Save to DB (Even if fetch failed)
    const result = await saveCrawlResult({
        title: title,
        image: image,
        price: price,
        url: url
    });

    if (result.success) {
        res.json({
            message: fetchSuccess ? 'Product registered successfully' : 'Product registered (Placeholder). Extension will update details.',
            productId: result.productId,
            linkId: result.linkId,
            isPlaceholder: !fetchSuccess
        });
    } else {
        res.status(500).json({ error: 'Failed to save product', details: result.error });
    }
});

// 3. 가격 업데이트 API (For Extension)
app.post('/api/products/:id/price', async (req, res) => {
    const { id } = req.params; // productId (검증용, 실제로는 url로 찾음)
    const { url, price, title, image } = req.body; // Added title, image

    const listPrice = parseInt(price);
    if (!url || isNaN(listPrice)) return res.status(400).json({ error: 'URL and valid price are required' });

    console.log(`💰 [API] 가격 업데이트 요청: ${url} -> ${listPrice}원 (Title: ${title ? 'Yes' : 'No'})`);

    const result = await savePriceUpdate(url, listPrice, title, image);

    if (result.success) {
        res.json({ message: 'Price and info updated successfully', result });
    } else {
        res.status(500).json({ error: 'Failed to update price', details: result.error });
    }
});

// 3. 가격 이력 조회 API
app.get('/api/products/:id/history', async (req, res) => {
    const { id } = req.params;

    console.log(`📈 [API] 가격 이력 조회 요청: Product ID ${id}`);

    const result = await getProductHistory(id);

    if (result.success) {
        res.json({ history: result.links });
    } else {
        res.status(500).json({ error: 'Failed to fetch history', details: result.error });
    }
});

// --- ADMIN ROUTES ---
app.get('/api/admin/products', authMiddleware, adminMiddleware, async (req, res) => {
    const result = await getAllProducts();
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.delete('/api/admin/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const result = await deleteProduct(id);
    if (result.success) {
        res.json({ message: 'Product deleted' });
    } else {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// --- ADMIN ROUTES ---
app.get('/api/admin/products', authMiddleware, adminMiddleware, async (req, res) => {
    const result = await getAllProducts();
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.delete('/api/admin/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const result = await deleteProduct(id);
    if (result.success) {
        res.json({ message: 'Product deleted' });
    } else {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

app.patch('/api/admin/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const updates = req.body; // { category: 'review' | 'managed' }
    const result = await updateProduct(id, updates);
    if (result.success) {
        res.json({ message: 'Product updated' });
    } else {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// User Management Routes
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    const result = await getAllUsers();
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const result = await deleteUser(id);
    if (result.success) {
        res.json({ message: 'User deleted' });
    } else {
        res.status(500).json({ error: result.error || 'Failed to delete user' });
    }
});

app.patch('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const updates = req.body; // { email, password, etc. }
    const result = await updateUser(id, updates);
    if (result.success) {
        res.json({ message: 'User updated' });
    } else {
        res.status(500).json({ error: result.error || 'Failed to update user' });
    }
});

// 4. 상품 목록 조회 API
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
                histories: [] // 상세 이력은 별도 API로 조회
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
