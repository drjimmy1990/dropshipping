-- ================================================================
-- DropLinker — Phase 4C+10: AI Content Generation & Social Media
-- Run this in Supabase SQL Editor
-- ================================================================

-- ======================== NEW ENUMS ========================

CREATE TYPE content_type AS ENUM ('description', 'social_post', 'carousel', 'reel', 'image');
CREATE TYPE content_status AS ENUM ('generating', 'pending_review', 'approved', 'rejected', 'published');
CREATE TYPE social_platform AS ENUM ('instagram', 'tiktok', 'x', 'facebook', 'snapchat', 'blotato');
CREATE TYPE social_auth_method AS ENUM ('token', 'oauth', 'blotato');
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'publishing', 'published', 'failed');

-- ======================== 22. STORE BRANDING ========================
-- Per-store brand settings for content generation

CREATE TABLE store_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  logo_url TEXT,
  brand_name TEXT,
  brand_colors JSONB DEFAULT '[]',
  tone TEXT DEFAULT 'professional',
  tagline TEXT,
  target_audience TEXT,
  language_preference TEXT DEFAULT 'ar',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id)
);

-- ======================== 23. CONTENT ASSETS ========================
-- Generated media assets (descriptions, images, videos) linked to products

CREATE TABLE content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,

  type content_type NOT NULL,
  status content_status DEFAULT 'generating',

  -- Text content
  title_en TEXT,
  title_ar TEXT,
  body_en TEXT,
  body_ar TEXT,
  hashtags TEXT[] DEFAULT '{}',
  caption TEXT,

  -- Media
  media_urls TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,

  -- Metadata
  ai_prompt TEXT,
  ai_provider TEXT,
  ai_model TEXT,
  generation_params JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ======================== 24. SOCIAL ACCOUNTS ========================
-- Connected social media accounts per merchant

CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,

  platform social_platform NOT NULL,
  auth_method social_auth_method NOT NULL,

  account_name TEXT,
  account_id TEXT,

  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  blotato_credentials JSONB,

  is_active BOOLEAN DEFAULT true,
  last_published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(merchant_id, platform, account_id)
);

-- ======================== 25. SCHEDULED POSTS ========================
-- Queue of posts waiting to be published

CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  content_asset_id UUID NOT NULL REFERENCES content_assets(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,

  status post_status DEFAULT 'draft',

  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  platform_post_id TEXT,

  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  recurrence_count INTEGER DEFAULT 0,

  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ======================== 26. CONTENT TEMPLATES ========================
-- Pre-built templates for social media posts

CREATE TABLE content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type content_type NOT NULL,
  category TEXT,

  prompt_template TEXT NOT NULL,
  image_prompt_template TEXT,
  layout_config JSONB,

  preview_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ======================== INDEXES ========================

CREATE INDEX idx_content_assets_merchant ON content_assets(merchant_id);
CREATE INDEX idx_content_assets_product ON content_assets(product_id);
CREATE INDEX idx_content_assets_status ON content_assets(status);
CREATE INDEX idx_content_assets_type ON content_assets(type);

CREATE INDEX idx_social_accounts_merchant ON social_accounts(merchant_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);

CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX idx_scheduled_posts_merchant ON scheduled_posts(merchant_id);

CREATE INDEX idx_store_branding_merchant ON store_branding(merchant_id);

-- ======================== TRIGGERS ========================

CREATE TRIGGER trg_store_branding_updated BEFORE UPDATE ON store_branding FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_content_assets_updated BEFORE UPDATE ON content_assets FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_social_accounts_updated BEFORE UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_scheduled_posts_updated BEFORE UPDATE ON scheduled_posts FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ======================== RLS ========================

ALTER TABLE store_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;

-- Store branding: own or admin
CREATE POLICY branding_self ON store_branding FOR ALL USING (
  merchant_id = auth.uid() OR is_admin()
);

-- Content assets: own or admin
CREATE POLICY content_self ON content_assets FOR ALL USING (
  merchant_id = auth.uid() OR is_admin()
);

-- Social accounts: own or admin
CREATE POLICY social_self ON social_accounts FOR ALL USING (
  merchant_id = auth.uid() OR is_admin()
);

-- Scheduled posts: own or admin
CREATE POLICY schedule_self ON scheduled_posts FOR ALL USING (
  merchant_id = auth.uid() OR is_admin()
);

-- Content templates: read all, write admin
CREATE POLICY templates_read ON content_templates FOR SELECT USING (true);
CREATE POLICY templates_write ON content_templates FOR ALL USING (is_admin());

-- ======================== SEED TEMPLATES ========================

INSERT INTO content_templates (name, type, category, prompt_template, sort_order) VALUES
(
  'Product Launch',
  'social_post',
  'product_launch',
  'Create an exciting product launch announcement for {{product_name}} priced at SAR {{price}}. Make it feel exclusive and urgent. Include a call-to-action to buy now. Target Saudi Arabian audience.',
  0
),
(
  'Sale / Discount',
  'social_post',
  'sale',
  'Create a limited-time sale post for {{product_name}}. Original price: SAR {{original_price}}, Sale price: SAR {{price}}. Emphasize the savings and create urgency. Target Saudi Arabian audience.',
  1
),
(
  'Product Review',
  'social_post',
  'review',
  'Write a customer testimonial-style social media post for {{product_name}}. Make it sound authentic and relatable. Highlight 3 key benefits. Target Saudi Arabian audience.',
  2
),
(
  'Feature Carousel',
  'carousel',
  'features',
  'Create a 5-slide Instagram carousel highlighting the key features of {{product_name}} (SAR {{price}}). Each slide should have a headline, body text, and visual suggestion.',
  3
),
(
  'Comparison Carousel',
  'carousel',
  'comparison',
  'Create a 5-slide carousel comparing {{product_name}} with generic alternatives. Show why this product is the better choice. Include price, quality, and delivery speed.',
  4
),
(
  'Unboxing Reel Script',
  'reel',
  'unboxing',
  'Write a 30-second unboxing reel script for {{product_name}}. Include: hook (first 3 seconds), reveal, feature highlights, and CTA. Make it feel authentic like a UGC creator.',
  5
),
(
  'How-To Reel Script',
  'reel',
  'tutorial',
  'Write a 30-second how-to/tutorial reel script showing how to use {{product_name}}. Include: hook, step-by-step demo, result reveal, and CTA.',
  6
);
