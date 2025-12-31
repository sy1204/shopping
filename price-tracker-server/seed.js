const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase URL or Key in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DUMMY_PRODUCTS = [
    { title: "Apple 2024 맥북 에어 13 M3 (8GB, 256GB)", image: "https://t1.daumcdn.net/cfile/tistory/998651365C78921808", category: "review", targetPrice: 1500000, links: [{ mall: "Coupang", price: 1590000, url: "https://www.coupang.com/vp/products/dummy1" }] },
    { title: "삼성전자 오디세이 G5 S32AG520", image: "https://img.danawa.com/prod_img/500000/067/824/img/15824067_1.jpg", category: "managed", targetPrice: 400000, links: [{ mall: "Gmarket", price: 429000, url: "http://item.gmarket.co.kr/Item?goodscode=dummy2" }] },
    { title: "농심 신라면 30개입 1박스", image: "https://sitem.ssgcdn.com/71/37/68/item/1000018683771_i1_1200.jpg", category: "review", targetPrice: 22000, links: [{ mall: "Coupang", price: 24500, url: "https://www.coupang.com/vp/products/dummy3" }] },
    { title: "데스커 모션데스크 베이직", image: "https://image.ohou.se/i/bucketplace-v2-development/uploads/productions/164741355415783515.jpg", category: "managed", targetPrice: 300000, links: [{ mall: "Naver", price: 329000, url: "https://smartstore.naver.com/desker/products/dummy4" }] },
    { title: "LG전자 그램 16 (2024)", image: "https://www.lge.co.kr/kr/images/notebook/md08998083/gallery/medium01.jpg", category: "managed", targetPrice: 1400000, links: [{ mall: "11st", price: 1450000, url: "https://www.11st.co.kr/products/dummy5" }] },
    { title: "소니 WH-1000XM5 노이즈 캔슬링", image: "https://www.sony.co.kr/image/5d02daae5e714643b9c021183359d939?fmt=png-alpha&wid=660&hei=660", category: "review", targetPrice: 380000, links: [{ mall: "Naver", price: 399000, url: "https://smartstore.naver.com/sony/products/dummy6" }] },
    { title: "다이슨 에어랩 멀티 스타일러", image: "https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/images/products/hair-care/dyson-airwrap-multi-styler/complete-long/top-nav/Airwrap-Complete-Long-Top-Nav-Ceramic-Pop.jpg", category: "managed", targetPrice: 550000, links: [{ mall: "Dyson", price: 599000, url: "https://www.dyson.co.kr/products/hair-care/dyson-airwrap-multi-styler/dummy7" }] },
    { title: "스타벅스 에스프레소 로스트 1.13kg", image: "https://image.costco.co.kr/images/content/2022/06/13/506869_M.jpg", category: "review", targetPrice: 28000, links: [{ mall: "Costco", price: 32900, url: "https://www.costco.co.kr/p/506869" }] },
    { title: "아이패드 에어 6세대 11 M2", image: "https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/ipad-air-storage-select-202405-11inch-space-gray-wifi?wid=5120&hei=2880&fmt=p-jpg", category: "managed", targetPrice: 850000, links: [{ mall: "Apple", price: 899000, url: "https://www.apple.com/kr/shop/buy-ipad/ipad-air/dummy9" }] },
    { title: "로지텍 MX Master 3S 마우스", image: "https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-top-view-graphite.png", category: "review", targetPrice: 120000, links: [{ mall: "Logitech", price: 129000, url: "https://www.logitech.com/ko-kr/products/mice/mx-master-3s.html" }] }
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
