# n8n Workflow Guide — AI Content Generation (WF5, WF8, WF9, WF10)

> **Last Updated:** 2026-05-20
> **Purpose:** Step-by-step instructions for building the n8n workflows that power DropLinker's AI content system.

---

## Prerequisites

1. n8n self-hosted and accessible (e.g. `https://n8n.yourdomain.com`)
2. API key for your chosen LLM:
   - **Google Gemini**: API key from Google AI Studio
   - **OpenAI GPT-4o**: API key from OpenAI Platform
   - **Claude**: API key from Anthropic Console
3. Supabase service role key (for writing back to DB)

---

## Setup: Configure Webhook URLs

There are **two ways** to configure your webhook URLs:

### Option 1: Admin Panel (Recommended)
Go to **Admin → Settings → AI Content Engine** and paste your webhook URLs into:
- WF5: Description Generator
- WF8: Social Content Generator
- WF9: Auto-Publisher (Cron)
- WF10: Image Generator

### Option 2: SQL (Manual)
```sql
-- Run in Supabase SQL Editor
INSERT INTO platform_config (key, value, description)
VALUES (
  'n8n_webhooks',
  '{
    "wf5_description": "https://n8n.yourdomain.com/webhook/wf5-description",
    "wf8_social_content": "https://n8n.yourdomain.com/webhook/wf8-social-content",
    "wf9_auto_publish": "https://n8n.yourdomain.com/webhook/wf9-auto-publish",
    "wf10_image_generate": "https://n8n.yourdomain.com/webhook/wf10-image-generate"
  }'::jsonb,
  'n8n webhook URLs for AI content generation workflows'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
```

---

## SQL Migrations

| Migration File | When to Run | What It Does |
|---|---|---|
| `phase_content_automation.sql` | First | Creates all tables, enums, RLS, and 7 text templates |
| `phase_content_image_templates.sql` | After the above | Adds 5 image generation template presets |

---

## WF5: AI Product Description Generator

### What It Does
Takes a product and generates bilingual (Arabic + English) title, description, SEO metadata, hashtags, and SEO keywords using your chosen LLM.

### Supplier-Aware Prompts
The API automatically builds supplier-specific prompts:
- **CJDropshipping products:** Prompt includes CJ warehouse context (5-10 day shipping, quality inspection, weight/dimensions)
- **AliExpress products:** Prompt includes spam-keyword removal rules, title rewriting guidance, sizing conversion

> ⚠️ Both prompt variants include: "NEVER mention the supplier name in the output"

### Trigger
**Webhook** — receives POST from DropLinker at `/webhook/wf5-description`

### Flow Diagram
```
[Webhook] → [Parse Input] → [LLM Node] → [Parse JSON] → [Update Supabase] → [Respond]
```

### Step-by-Step Build

#### 1. Add Webhook Node
- **Method:** POST
- **Path:** `wf5-description`
- **Response Mode:** "Respond to Webhook" (last node)
- This gives you a URL like: `https://n8n.yourdomain.com/webhook/wf5-description`

#### 2. Add "Set" Node — Build LLM Prompt
Use the `prompt` field from the incoming webhook body. The DropLinker API already builds a comprehensive prompt. You can use it directly:

```
{{ $json.prompt }}
```

Or customize it further in the Set node.

#### 3. Add LLM Node

**Option A: Google Gemini (AI/LLM node)**
- Credential: Google Gemini API
- Model: `gemini-2.0-flash` (fast + cheap) or `gemini-1.5-pro` (best quality)
- System Message: "You are a Saudi e-commerce copywriter. Always return valid JSON."
- User Message: `{{ $json.prompt }}`

**Option B: OpenAI GPT-4o**
- Credential: OpenAI API
- Model: `gpt-4o` or `gpt-4o-mini`
- System Message: "You are a Saudi e-commerce copywriter. Always return valid JSON."
- User Message: `{{ $json.prompt }}`

**Option C: Claude**
- Use HTTP Request node to call Anthropic API
- Set headers: `x-api-key`, `anthropic-version: 2023-06-01`

#### 4. Add "Code" Node — Parse JSON Response
```javascript
const text = $input.first().json.text || $input.first().json.content || '';

// Extract JSON from the response (handles ```json blocks too)
let jsonStr = text;
const match = text.match(/```json\s*([\s\S]*?)\s*```/);
if (match) jsonStr = match[1];

try {
  const parsed = JSON.parse(jsonStr.trim());
  return [{
    json: {
      ...parsed,
      provider: 'gemini', // or 'gpt4o', 'claude'
      model: 'gemini-2.0-flash',
    }
  }];
} catch (e) {
  return [{
    json: {
      error: 'Failed to parse JSON',
      raw_text: text,
      provider: 'gemini',
      model: 'gemini-2.0-flash',
    }
  }];
}
```

#### 5. Add "HTTP Request" Node — Update Supabase (Optional)
If you want n8n to update the content_asset directly:

- **Method:** PATCH
- **URL:** `https://YOUR-SUPABASE-URL.supabase.co/rest/v1/content_assets?id=eq.{{ $('Webhook').first().json.asset_id }}`
- **Headers:**
  - `apikey`: your Supabase anon key
  - `Authorization`: `Bearer YOUR_SERVICE_ROLE_KEY`
  - `Content-Type`: `application/json`
  - `Prefer`: `return=minimal`
- **Body:**
```json
{
  "status": "pending_review",
  "title_en": "{{ $json.title_en }}",
  "title_ar": "{{ $json.title_ar }}",
  "body_en": "{{ $json.description_en }}",
  "body_ar": "{{ $json.description_ar }}",
  "hashtags": {{ JSON.stringify($json.hashtags_en?.concat($json.hashtags_ar || []) || []) }},
  "ai_provider": "{{ $json.provider }}",
  "ai_model": "{{ $json.model }}"
}
```

#### 6. Add "Respond to Webhook" Node
Return the parsed result to DropLinker:
```json
{
  "title_en": "{{ $json.title_en }}",
  "title_ar": "{{ $json.title_ar }}",
  "description_en": "{{ $json.description_en }}",
  "description_ar": "{{ $json.description_ar }}",
  "metadata_title": "{{ $json.metadata_title }}",
  "metadata_description": "{{ $json.metadata_description }}",
  "hashtags_en": {{ $json.hashtags_en }},
  "hashtags_ar": {{ $json.hashtags_ar }},
  "seo_keywords_en": "{{ $json.seo_keywords_en }}",
  "seo_keywords_ar": "{{ $json.seo_keywords_ar }}",
  "provider": "{{ $json.provider }}",
  "model": "{{ $json.model }}"
}
```

> **Important:** The DropLinker API will automatically write `metadata_title` and `metadata_description` back to the `products` table for Salla/Zid SEO sync.

---

## WF8: Social Media Content Generator

### What It Does
Generates social media content — posts, carousels, or reel scripts — using an LLM with product data and optional brand context.

### Trigger
**Webhook** — POST at `/webhook/wf8-social-content`

### Flow
```
[Webhook] → [Switch: content_type] →
  ├─ social_post → [LLM: post prompt] → [Parse JSON]
  ├─ carousel   → [LLM: carousel prompt] → [Parse JSON]
  └─ reel       → [LLM: reel prompt] → [Parse JSON]
→ [Update Supabase] → [Respond]
```

### Switch Node Configuration
- Field: `{{ $json.content_type }}`
- Rules:
  - `social_post` → Post branch
  - `carousel` → Carousel branch
  - `reel` → Reel branch

### LLM Prompts by Type

**Social Post:**
```
Generate a {{ $json.language }} social media post for:
Product: {{ $json.product.title_en }}
Price: SAR {{ $json.product.retail_price }}
{{ $json.branding ? 'Brand: ' + $json.branding.brand_name + ', Tone: ' + $json.branding.tone : '' }}

Return JSON: { "caption": "...", "extended_text": "...", "hashtags": [...], "cta_text": "..." }
```

**Carousel:**
```
Generate a 5-slide Instagram carousel for:
Product: {{ $json.product.title_en }}
Price: SAR {{ $json.product.retail_price }}

For each slide: headline (max 30 chars), body (max 60 chars), visual suggestion.
Return JSON: { "slides": [...], "caption": "...", "hashtags": [...] }
```

**Reel Script:**
```
Write a 30-second reel script for {{ $json.product.title_en }}.
Include: hook (3 sec), features, CTA.
Return JSON: { "script": "...", "voiceover_text": "...", "caption": "...", "hashtags": [...] }
```

---

## WF9: Auto-Publisher (Cron)

### What It Does
Checks the `scheduled_posts` queue every 5 minutes and publishes due posts to the appropriate social media platform.

### Trigger
**Cron** — `*/5 * * * *` (every 5 minutes)

### Flow
```
[Cron] → [Supabase: fetch due posts] → [Loop: for each post] →
  [Fetch content asset] → [Fetch social account] →
  [Switch: platform] →
    ├─ instagram → [Instagram Graph API]
    ├─ tiktok    → [TikTok Content API]
    ├─ x         → [X/Twitter API v2]
    └─ blotato   → [Blotato API]
  → [Update post status → 'published'] → [Update last_published_at]
```

### Step 1: Fetch Due Posts (Supabase)
- **Method:** GET
- **URL:** `https://YOUR-SUPABASE-URL.supabase.co/rest/v1/scheduled_posts?status=eq.scheduled&scheduled_at=lte.{{ new Date().toISOString() }}&order=scheduled_at.asc&limit=10`
- **Headers:** apikey + Authorization

### Step 2: For Each Post
Use the "Split In Batches" node to process one at a time.

### Step 3: Fetch Content & Account
Two Supabase GET requests to fetch:
1. `content_assets` by `content_asset_id`
2. `social_accounts` by `social_account_id` (IMPORTANT: this one returns the **actual token**)

### Step 4: Platform Switch
Route to the correct API based on `social_accounts.platform`.

### Step 5: Instagram Graph API
```
POST https://graph.facebook.com/v18.0/{{ page_id }}/media
{
  "image_url": "{{ media_urls[0] }}",
  "caption": "{{ caption }}\n\n{{ hashtags.join(' ') }}",
  "access_token": "{{ access_token }}"
}

→ returns { id: "creation_id" }

POST https://graph.facebook.com/v18.0/{{ page_id }}/media_publish
{
  "creation_id": "{{ creation_id }}",
  "access_token": "{{ access_token }}"
}
```

### Step 6: Update Status
- PATCH `scheduled_posts` → `status: 'published'`, `published_at: now()`, `platform_post_id: <id from API>`
- PATCH `social_accounts` → `last_published_at: now()`

### Error Handling
- If platform API returns error: set `status: 'failed'`, save `error_message`, increment `retry_count`
- If `retry_count >= 3`: stop retrying (admin should investigate)

---

## WF10: AI Image Generator

### What It Does
Generates marketing images using AI (DALL-E, Gemini Imagen, etc.) from pre-built prompt templates and uploads to Supabase Storage.

### Trigger
**Webhook** — POST at `/webhook/wf10-image-generate`

### Available Image Templates
Run `phase_content_image_templates.sql` to seed these presets:

| Template | Category | Prompt Pattern |
|---|---|---|
| Clean Product Shot | `product_photo` | White bg, studio lighting, e-commerce style |
| Lifestyle Scene | `lifestyle` | Saudi home, natural lighting, editorial |
| Before/After Comparison | `comparison` | Split image, problem vs solution |
| Instagram Story Ad | `ad_creative` | 9:16 ratio, typography, gradient, urgency |
| Carousel Slide Design | `carousel_slide` | 1:1 ratio, feature focus, minimal |

### Flow
```
[Webhook] → [Build Image Prompt] → [Image API] → [Upload to Supabase Storage] → [Save asset URL] → [Respond]
```

### Step 1: Build Image Prompt (Code Node)
```javascript
const body = $input.first().json;
let prompt = body.image_prompt_template || body.prompt;

// Fill placeholders
if (body.product) {
  prompt = prompt.replace(/\{\{product_name\}\}/g, body.product.title_en || '');
  prompt = prompt.replace(/\{\{price\}\}/g, String(body.product.retail_price || ''));
  prompt = prompt.replace(/\{\{category\}\}/g, body.product.category || '');
}

// Append brand context if available
if (body.branding?.brand_colors?.length) {
  prompt += `, brand colors: ${body.branding.brand_colors.join(', ')}`;
}

return [{ json: { prompt, size: body.size || '1024x1024' } }];
```

### Step 2: Image API Options

**Option A: OpenAI DALL-E 3**
```
POST https://api.openai.com/v1/images/generations
{
  "model": "dall-e-3",
  "prompt": "{{ $json.prompt }}",
  "n": 1,
  "size": "{{ $json.size }}",
  "quality": "standard"
}
```

**Option B: Google Imagen (via Vertex AI)**
- Use HTTP Request to call Vertex AI Imagen endpoint
- Requires Google Cloud credentials

**Option C: Flux (via Replicate)**
```
POST https://api.replicate.com/v1/predictions
{
  "model": "black-forest-labs/flux-schnell",
  "input": { "prompt": "{{ $json.prompt }}" }
}
```

### Step 3: Upload to Supabase Storage
```
POST https://YOUR-SUPABASE-URL.supabase.co/storage/v1/object/content-assets/{{ filename }}
Headers: Authorization: Bearer SERVICE_ROLE_KEY
Body: binary image data
```

### Step 4: Respond with URL
```json
{
  "image_url": "https://YOUR-SUPABASE-URL.supabase.co/storage/v1/object/public/content-assets/{{ filename }}",
  "provider": "dall-e",
  "model": "dall-e-3",
  "prompt_used": "{{ $json.prompt }}"
}
```

---

## Admin Panel Settings Reference

The AI Content Engine settings in **Admin → Settings** control:

| Setting | Key | Default | Description |
|---|---|---|---|
| WF5 URL | `n8n_webhooks.wf5_description` | — | Description generator webhook |
| WF8 URL | `n8n_webhooks.wf8_social_content` | — | Social content generator webhook |
| WF9 URL | `n8n_webhooks.wf9_auto_publish` | — | Auto-publisher cron webhook |
| WF10 URL | `n8n_webhooks.wf10_image_generate` | — | Image generator webhook |
| AI Provider | `ai_content_settings.default_provider` | `gemini` | Default LLM provider |
| AI Model | `ai_content_settings.default_model` | `gemini-2.0-flash` | Default model name |
| Language | `ai_content_settings.default_language` | `both` | `both`, `ar`, or `en` |
| Image Provider | `ai_content_settings.image_provider` | `dall-e` | Image generation provider |
| Image Style | `ai_content_settings.default_image_style` | `product_clean` | Default template style |
| Image Size | `ai_content_settings.default_image_size` | `1024x1024` | Default output dimensions |

---

## Testing Checklist

- [ ] WF5: Send test webhook with product data → verify JSON response with bilingual content
- [ ] WF5: Verify response includes `metadata_title` (≤70 chars) and `metadata_description` (≤160 chars)
- [ ] WF5: Test with CJ product → verify prompt mentions CJ warehouse, fast shipping
- [ ] WF5: Test with AliExpress product → verify prompt removes spam keywords
- [ ] WF5: Check `products` table updated with SEO metadata after generation
- [ ] WF8: Test social_post type → verify caption + hashtags
- [ ] WF8: Test carousel type → verify 5 slides returned
- [ ] WF8: Test reel type → verify script + voiceover
- [ ] WF9: Insert a test scheduled_post with `scheduled_at = NOW()` → verify cron picks it up
- [ ] WF10: Test with "Clean Product Shot" template → verify image prompt filled correctly
- [ ] WF10: Send image prompt → verify image URL returned + stored in Supabase
- [ ] Admin: Verify all settings editable in Admin → Settings → AI Content Engine

---

## Webhook Payload Reference

### WF5 Incoming Payload
```json
{
  "asset_id": "uuid",
  "product_id": "uuid",
  "merchant_id": "uuid",
  "content_type": "description",
  "language": "both",
  "product": {
    "title_en": "Wireless Earbuds",
    "title_ar": "سماعات لاسلكية",
    "category": "Electronics",
    "tags": ["wireless", "bluetooth"],
    "supplier": "aliexpress",
    "retail_price": 89.99,
    "supplier_cost": 35.00,
    "images": ["https://..."],
    "description_en": "Original description from supplier..."
  },
  "branding": {
    "brand_name": "TechZone",
    "tone": "professional",
    "tagline": "Premium Tech, Delivered Fast",
    "target_audience": "Saudi tech enthusiasts",
    "brand_colors": ["#1a1a2e", "#e94560"],
    "language_preference": "both"
  },
  "template": null,
  "prompt": "You are an expert Saudi Arabian e-commerce copywriter..."
}
```

### WF5 Expected Response
```json
{
  "title_en": "Premium Wireless Earbuds with ANC",
  "title_ar": "سماعات لاسلكية مميزة مع إلغاء الضوضاء",
  "description_en": "Experience crystal-clear audio...",
  "description_ar": "استمتع بصوت نقي وواضح...",
  "metadata_title": "Premium ANC Wireless Earbuds | Fast Shipping to KSA",
  "metadata_description": "Shop premium noise-cancelling wireless earbuds with 5-day delivery to Saudi Arabia. Crystal-clear sound, 30-hour battery. Order now!",
  "hashtags_en": ["#WirelessEarbuds", "#SaudiTech", "#FreeShipping"],
  "hashtags_ar": ["#سماعات_لاسلكية", "#تقنية", "#شحن_مجاني"],
  "seo_keywords_en": "wireless earbuds, bluetooth earphones, ANC headphones",
  "seo_keywords_ar": "سماعات لاسلكية, سماعات بلوتوث, إلغاء الضوضاء",
  "provider": "gemini",
  "model": "gemini-2.0-flash"
}
```

### WF10 Incoming Payload
```json
{
  "asset_id": "uuid",
  "product_id": "uuid",
  "merchant_id": "uuid",
  "content_type": "image",
  "product": {
    "title_en": "Wireless Earbuds",
    "retail_price": 89.99,
    "category": "Electronics"
  },
  "branding": {
    "brand_name": "TechZone",
    "brand_colors": ["#1a1a2e", "#e94560"]
  },
  "image_prompt_template": "Professional product photography of {{product_name}}, centered on pure white background...",
  "size": "1024x1024",
  "prompt": "Professional product photography of Wireless Earbuds, centered on pure white background..."
}
```

### WF10 Expected Response
```json
{
  "image_url": "https://your-supabase.supabase.co/storage/v1/object/public/content-assets/gen_abc123.png",
  "provider": "dall-e",
  "model": "dall-e-3",
  "prompt_used": "Professional product photography of Wireless Earbuds..."
}
```
