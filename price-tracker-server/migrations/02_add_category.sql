-- 02_add_category_to_products.sql

-- Add category column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'managed';

-- Optional: Allow update for authenticated users if using RLS and not Service Key
-- (But we are using Service Key for Admin, so this is just for safety)
-- CREATE POLICY "Allow update for users" ON products FOR UPDATE USING (auth.uid() = user_id);
