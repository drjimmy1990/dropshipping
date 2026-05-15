-- ============================================================
-- Platform Feeds Table — Stores curated AliExpress feed configs
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  display_name_ar TEXT,
  category TEXT DEFAULT 'general',
  icon TEXT DEFAULT '📦',
  product_count INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE platform_feeds ENABLE ROW LEVEL SECURITY;

-- Everyone can read enabled feeds (merchants need to see them)
CREATE POLICY "Anyone can read enabled feeds"
  ON platform_feeds FOR SELECT
  USING (is_enabled = true);

-- Only super admins can manage feeds
CREATE POLICY "Super admins can manage feeds"
  ON platform_feeds FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- Seed the top curated feeds
INSERT INTO platform_feeds (feed_name, display_name, display_name_ar, category, icon, product_count, is_enabled, sort_order)
VALUES
  ('DS_NewArrivals', 'New Arrivals', 'وصل حديثاً', 'trending', '🆕', 14010, true, 1),
  ('Bestseller 2024', 'Bestsellers 2024', 'الأكثر مبيعاً', 'trending', '🏆', 201065, true, 2),
  ('DS_ConsumerElectronics_bestsellers', 'Consumer Electronics', 'إلكترونيات', 'electronics', '📱', 19470, true, 3),
  ('DS_Home&Kitchen_bestsellers', 'Home & Kitchen', 'المنزل والمطبخ', 'home', '🏠', 12300, true, 4),
  ('DS_Sports&Outdoors_bestsellers', 'Sports & Outdoors', 'رياضة', 'sports', '⚽', 27495, true, 5),
  ('SA_Clothing&Shoes', 'Fashion (SA)', 'أزياء', 'fashion', '👗', 13050, true, 6),
  ('DS_Beauty_bestsellers', 'Beauty', 'جمال', 'beauty', '💄', 2594, true, 7),
  ('DS_Automobile&Accessories_bestsellers', 'Auto & Accessories', 'سيارات', 'auto', '🚗', 20340, true, 8),
  ('DS_ElectronicComponents_bestsellers', 'Electronic Components', 'مكونات إلكترونية', 'electronics', '🔌', 2580, true, 9),
  ('DS_Sports-Clothing&Shoes', 'Sportswear', 'ملابس رياضية', 'fashion', '🏃', 7990, true, 10),
  ('DS_Christmas-Decor', 'Seasonal / Christmas', 'موسمي', 'seasonal', '🎄', 6840, false, 11),
  ('DS center', 'DS Center (General)', 'مركز دروبشيبنج', 'general', '📦', 0, false, 12),
  ('DS_HealthAndBeauty', 'Health & Beauty', 'صحة وجمال', 'beauty', '💊', 0, false, 13),
  ('DS_Toys&Games_bestsellers', 'Toys & Games', 'ألعاب', 'toys', '🎮', 0, false, 14),
  ('DS_Jewelry&Watches_bestsellers', 'Jewelry & Watches', 'مجوهرات وساعات', 'fashion', '💎', 0, false, 15),
  ('DS_Home-Textile_bestsellers', 'Home Textile', 'مفروشات', 'home', '🛏️', 0, false, 16),
  ('DS_Home-Improvement_bestsellers', 'Home Improvement', 'تحسين المنزل', 'home', '🔨', 0, false, 17),
  ('DS_Security&Protection_bestsellers', 'Security & Protection', 'أمن وحماية', 'electronics', '🔒', 0, false, 18),
  ('DS_Tools_bestsellers', 'Tools', 'أدوات', 'tools', '🔧', 0, false, 19),
  ('DS_Office&School-Supplies_bestsellers', 'Office & School', 'مكتبية ومدرسية', 'office', '📚', 0, false, 20)
ON CONFLICT (feed_name) DO NOTHING;
