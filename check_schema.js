const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'price-tracker-server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking products table schema...");
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching products:", error);
    } else if (data && data.length > 0) {
        console.log("Product keys:", Object.keys(data[0]));
        console.log("Sample product:", data[0]);
    } else {
        console.log("No products found to check schema. Trying to insert one...");
        // logic to insert dummy if needed
    }
}

checkSchema();
