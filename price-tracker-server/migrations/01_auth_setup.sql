-- 1. Add user_id to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies for Subscriptions (Private: User can only see their own)
CREATE POLICY "Users can view their own subscriptions" 
ON subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
ON subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON subscriptions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" 
ON subscriptions FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Create Policies for Products & Links (Public Read, Authenticated Write)
-- Products
CREATE POLICY "Public read access for products" 
ON products FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert products" 
ON products FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Product Links
CREATE POLICY "Public read access for product_links" 
ON product_links FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert product_links" 
ON product_links FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Price History
CREATE POLICY "Public read access for price_history" 
ON price_history FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert price_history" 
ON price_history FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');
