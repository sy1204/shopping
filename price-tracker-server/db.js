const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 크롤링된 데이터를 기반으로 DB에 정보를 저장하거나 업데이트함
 */
async function saveCrawlResult(crawlData) {
    const { title, image, price, url } = crawlData;

    // 1. 쇼핑몰 이름 추출 (URL 기반)
    let mallName = 'Unknown';
    if (url.includes('coupang.com')) mallName = 'Coupang';
    else if (url.includes('naver.com')) mallName = 'Naver';
    else if (url.includes('11st.co.kr')) mallName = '11st';
    else if (url.includes('gmarket.co.kr')) mallName = 'Gmarket';
    else if (url.includes('auction.co.kr')) mallName = 'Auction';

    try {
        // 2. 기존 상품이 있는지 확인 (제목 기반 혹은 다른 로직이 필요할 수 있으나, 일단 상품 신규 생성 또는 기존 연동 유도)
        // 여기서는 예시로 제목이 유사한 상품을 찾거나, 새로운 상품으로 등록하는 흐름으로 가되, 
        // 실제로는 사용자가 먼저 상품을 생성하고 URL을 추가하는 방식이 더 정확함.
        // 여기서는 "URL 기반 자동 매칭" 시나리오로 작성함.

        // 우선 해당 URL이 이미 등록되어 있는지 확인
        let { data: existingLink, error: linkError } = await supabase
            .from('product_links')
            .select('*, products(*)')
            .eq('url', url)
            .single();

        let productId;
        let linkId;

        if (existingLink) {
            productId = existingLink.product_id;
            linkId = existingLink.id;
            console.log(`🔗 Existing link found for: ${mallName}`);
        } else {
            // 해당 URL이 없으면 신규 상품 혹은 기존 상품에 연결
            // 일단은 새로운 상품(Product)을 생성하는 흐름으로 진행 (실제론 사용자 선택 프로세스 필요)
            const { data: newProduct, error: prodError } = await supabase
                .from('products')
                .insert([{ title, represent_image: image }])
                .select()
                .single();

            if (prodError) throw prodError;
            productId = newProduct.id;

            const { data: newLink, error: newLinkError } = await supabase
                .from('product_links')
                .insert([{
                    product_id: productId,
                    mall_name: mallName,
                    url,
                    current_price: price
                }])
                .select()
                .single();

            if (newLinkError) throw newLinkError;
            linkId = newLink.id;
            console.log(`✨ New product and link created for: ${mallName}`);
        }

        // 3. 가격 이력(Price History) 기록
        const { error: historyError } = await supabase
            .from('price_history')
            .insert([{ link_id: linkId, price: price }]);

        if (historyError) throw historyError;

        // 4. 쇼핑몰 링크의 현재가 업데이트
        await supabase
            .from('product_links')
            .update({ current_price: price, last_tracked_at: new Date() })
            .eq('id', linkId);

        return { success: true, productId, linkId };

    } catch (error) {
        console.error('❌ Database Save Error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 통합 검색 결과를 기반으로 상품과 여러 쇼핑몰 링크를 저장함
 */
async function saveSearchResults(searchQuery, results) {
    if (!results || results.length === 0) return { success: false, error: 'No results to save' };

    try {
        // 1. 대표 상품 생성 (검색어를 기반으로 혹은 첫 번째 상품 결과의 이미지를 사용)
        const representTitle = searchQuery; // 혹은 results[0].title
        const representImage = results[0]?.image;

        // 기존에 해당 이름의 상품이 있는지 확인 (간단하게 제목 일치 확인)
        let { data: existingProduct, error: prodSearchError } = await supabase
            .from('products')
            .select('*')
            .eq('title', representTitle)
            .maybeSingle();

        let productId;
        if (existingProduct) {
            productId = existingProduct.id;
            console.log(`📦 Existing product found: ${representTitle}`);
        } else {
            const { data: newProduct, error: prodError } = await supabase
                .from('products')
                .insert([{ title: representTitle, represent_image: representImage }])
                .select()
                .single();
            if (prodError) throw prodError;
            productId = newProduct.id;
            console.log(`🆕 New product created: ${representTitle}`);
        }

        // 2. 각 쇼핑몰 링크 및 가격 저장
        for (const item of results) {
            // URL 중복 확인
            let { data: existingLink, error: linkError } = await supabase
                .from('product_links')
                .select('*')
                .eq('url', item.link)
                .maybeSingle();

            let linkId;
            if (existingLink) {
                linkId = existingLink.id;
                // 현재가 업데이트
                await supabase
                    .from('product_links')
                    .update({ current_price: item.price, last_tracked_at: new Date() })
                    .eq('id', linkId);
            } else {
                const { data: newLink, error: nle } = await supabase
                    .from('product_links')
                    .insert([{
                        product_id: productId,
                        mall_name: item.mall,
                        url: item.link,
                        current_price: item.price
                    }])
                    .select()
                    .single();
                if (nle) {
                    console.error(`❌ Link save failed for ${item.mall}:`, nle.message);
                    continue;
                }
                linkId = newLink.id;
            }

            // 3. 가격 이력 추가
            await supabase
                .from('price_history')
                .insert([{ link_id: linkId, price: item.price }]);
        }

        return { success: true, productId };

    } catch (error) {
        console.error('❌ saveSearchResults Error:', error.message);
        return { success: false, error: error.message };
    }
}


/**
 * URL 기반으로 가격 정보를 업데이트하고 이력을 저장함 (Extension용)
 */
async function savePriceUpdate(url, price) {
    try {
        // 1. 링크 정보 조회
        const { data: link, error: linkError } = await supabase
            .from('product_links')
            .select('id, product_id')
            .eq('url', url)
            .single();

        if (linkError || !link) {
            throw new Error(`Link not found for URL: ${url}`);
        }

        // 2. 가격 이력 추가
        const { error: historyError } = await supabase
            .from('price_history')
            .insert([{ link_id: link.id, price: price }]);

        if (historyError) throw historyError;

        // 3. 현재가 업데이트
        const { error: updateError } = await supabase
            .from('product_links')
            .update({ current_price: price, last_tracked_at: new Date() })
            .eq('id', link.id);

        if (updateError) throw updateError;

        return { success: true, productId: link.product_id, linkId: link.id };

    } catch (error) {
        console.error('❌ savePriceUpdate Error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 특정 상품의 모든 링크에 대한 가격 이력을 조회함
 */
async function getProductHistory(productId) {
    try {
        const { data: links, error: linkError } = await supabase
            .from('product_links')
            .select(`
                id,
                mall_name,
                url,
                price_history (
                    price,
                    tracked_at
                )
            `)
            .eq('product_id', productId);

        if (linkError) throw linkError;

        return { success: true, links };

    } catch (error) {
        console.error('❌ getProductHistory Error:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { supabase, saveCrawlResult, saveSearchResults, savePriceUpdate, getProductHistory };
