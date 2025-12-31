const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase URL or Key in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DUMMY_PRODUCTS = [
    {
        title: "Apple 2024 맥북 에어 13 M3 (8GB, 256GB)",
        image: "https://t1.daumcdn.net/cfile/tistory/998651365C78921808", // Sample placeholder or real link
        category: "review",
        targetPrice: 1500000,
        links: [
            { mall: "Coupang", price: 1590000, url: "https://www.coupang.com/vp/products/dummy1" },
            { mall: "Naver", price: 1620000, url: "https://smartstore.naver.com/dummy1" }
        ]
    },
    {
        title: "삼성전자 오디세이 G5 S32AG520 게이밍 모니터",
        image: "https://img.danawa.com/prod_img/500000/067/824/img/15824067_1.jpg?shrink=330:*&_v=20220111162446",
        category: "managed",
        targetPrice: 400000,
        links: [
            { mall: "Gmarket", price: 429000, url: "http://item.gmarket.co.kr/Item?goodscode=dummy2" },
            { mall: "11st", price: 435000, url: "http://www.11st.co.kr/products/dummy2" }
        ]
    },
    {
        title: "농심 신라면 30개입 1박스",
        image: "https://sitem.ssgcdn.com/71/37/68/item/1000018683771_i1_1200.jpg",
        category: "review",
        targetPrice: 22000,
        links: [
            { mall: "Coupang", price: 24500, url: "https://www.coupang.com/vp/products/dummy3" }
        ]
    },
    {
        title: "데스커 모션데스크 베이직",
        image: "https://image.ohou.se/i/bucketplace-v2-development/uploads/productions/164741355415783515.jpg?gif=1&w=850&h=850&c=c",
        category: "managed",
        targetPrice: 300000,
        links: [
            { mall: "Naver", price: 329000, url: "https://smartstore.naver.com/desker/products/dummy4" }
        ]
    }
];

async function seedData() {
    console.log("🌱 Starting Seed Process...");

    for (const prod of DUMMY_PRODUCTS) {
        console.log(`Processing: ${prod.title}`);

        // 1. Create Product
        // check if exists first to avoid dupes in repeated runs
        const { data: existing } = await supabase.from('products').select('id').eq('title', prod.title).maybeSingle();

        let productId;
        if (existing) {
            console.log(`  - Exists, skipping creation.`);
            productId = existing.id;
        } else {
            const { data: newProd, error } = await supabase
                .from('products')
                .insert([{
                    title: prod.title,
                    represent_image: prod.image,
                    category: prod.category,
                    target_price: prod.targetPrice,
                    memo: "더미 데이터로 생성된 상품입니다."
                }])
                .select()
                .single();

            if (error) {
                console.error(`  ❌ Failed to create product: ${error.message}`);
                continue;
            }
            productId = newProd.id;
        }

        // 2. Create Links & History
        for (const link of prod.links) {
            const { data: existingLink } = await supabase.from('product_links').select('id').eq('url', link.url).maybeSingle();
            let linkId;

            if (existingLink) {
                linkId = existingLink.id;
            } else {
                const { data: newLink, error: linkError } = await supabase
                    .from('product_links')
                    .insert([{
                        product_id: productId,
                        mall_name: link.mall,
                        url: link.url,
                        current_price: link.price
                    }])
                    .select()
                    .single();

                if (linkError) {
                    console.error(`  ❌ Failed to create link: ${linkError.message}`);
                    continue;
                }
                linkId = newLink.id;
            }

            // 3. Add Fake Price History (Past 30 days)
            console.log(`  - Generating history for ${link.mall}...`);
            const history = [];
            let currentP = link.price;
            for (let i = 30; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);

                // Random fluctuation +/- 5%
                const volatility = (Math.random() - 0.5) * 0.1;
                currentP = Math.round(currentP * (1 + volatility));

                history.push({
                    link_id: linkId,
                    price: currentP,
                    tracked_at: date.toISOString() // Assuming DB allows insert with specific timestamp, otherwise it defaults to now()
                });
            }

            const { error: histError } = await supabase.from('price_history').insert(history);
            if (histError) console.error(`  ❌ History error: ${histError.message}`);
        }
    }
    console.log("✅ Seed Complete!");
}

seedData();
