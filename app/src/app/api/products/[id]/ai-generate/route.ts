import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/products/:id/ai-generate
 *
 * Trigger AI content generation for a product via n8n WF5.
 * Creates a content_asset record, calls n8n webhook, and returns the generated content.
 * 
 * Body: { type?: 'description' | 'social_post' | 'carousel' | 'reel', language?: 'ar' | 'en' | 'both', template_id?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const contentType = body.type || "description";
    const language = body.language || "both";

    // 1. Fetch the product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 2. Fetch store branding (if available)
    let branding = null;
    if (product.store_id) {
      const { data: brandData } = await supabase
        .from("store_branding")
        .select("*")
        .eq("store_id", product.store_id)
        .single();
      branding = brandData;
    }

    // 3. Fetch template (if specified)
    let template = null;
    if (body.template_id) {
      const { data: tplData } = await supabase
        .from("content_templates")
        .select("*")
        .eq("id", body.template_id)
        .single();
      template = tplData;
    }

    // 4. Get n8n webhook URL from platform_config
    const admin = createAdminClient();
    const { data: configData } = await admin
      .from("platform_config")
      .select("value")
      .eq("key", "n8n_webhooks")
      .single();

    const webhookUrls = configData?.value || {};
    const webhookUrl = contentType === "description"
      ? webhookUrls.wf5_description
      : webhookUrls.wf8_social_content;

    if (!webhookUrl) {
      // If no n8n webhook configured, create the asset as pending and return instructions
      const { data: asset, error: assetError } = await supabase
        .from("content_assets")
        .insert({
          merchant_id: user.id,
          product_id: id,
          store_id: product.store_id,
          type: contentType,
          status: "pending_review",
          ai_prompt: buildPrompt(product, branding, contentType, language, template),
          ai_provider: "pending_configuration",
          generation_params: { language, template_id: body.template_id },
        })
        .select()
        .single();

      if (assetError) throw assetError;

      return NextResponse.json({
        asset,
        message: "Content asset created. Configure n8n webhook URL in platform_config (key: 'n8n_webhooks') to enable automatic AI generation.",
        prompt: asset.ai_prompt,
        setup_required: true,
      }, { status: 202 });
    }

    // 5. Create content asset record (status: generating)
    const { data: asset, error: assetError } = await supabase
      .from("content_assets")
      .insert({
        merchant_id: user.id,
        product_id: id,
        store_id: product.store_id,
        type: contentType,
        status: "generating",
        ai_prompt: buildPrompt(product, branding, contentType, language, template),
        generation_params: { language, template_id: body.template_id },
      })
      .select()
      .single();

    if (assetError) throw assetError;

    // 6. Call n8n webhook
    try {
      const n8nPayload = {
        asset_id: asset.id,
        product_id: id,
        merchant_id: user.id,
        content_type: contentType,
        language,
        product: {
          title_en: product.title_en,
          title_ar: product.title_ar,
          description_en: product.description_en,
          description_ar: product.description_ar,
          category: product.category,
          tags: product.tags,
          supplier: product.supplier,
          retail_price: product.retail_price,
          supplier_cost: product.supplier_cost,
          images: product.images,
        },
        branding: branding ? {
          brand_name: branding.brand_name,
          tone: branding.tone,
          tagline: branding.tagline,
          target_audience: branding.target_audience,
          brand_colors: branding.brand_colors,
          language_preference: branding.language_preference,
        } : null,
        template: template ? {
          name: template.name,
          prompt_template: template.prompt_template,
          image_prompt_template: template.image_prompt_template,
        } : null,
        prompt: asset.ai_prompt,
      };

      const n8nResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(n8nPayload),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (n8nResponse.ok) {
        const result = await n8nResponse.json();

        // Update the asset with n8n response
        const updateData: Record<string, unknown> = {
          status: "pending_review",
          ai_provider: result.provider || "n8n",
          ai_model: result.model || "unknown",
        };

        if (result.title_en) updateData.title_en = result.title_en;
        if (result.title_ar) updateData.title_ar = result.title_ar;
        if (result.description_en || result.body_en) updateData.body_en = result.description_en || result.body_en;
        if (result.description_ar || result.body_ar) updateData.body_ar = result.description_ar || result.body_ar;
        if (result.hashtags_en || result.hashtags_ar || result.hashtags) {
          updateData.hashtags = result.hashtags || [...(result.hashtags_en || []), ...(result.hashtags_ar || [])];
        }
        if (result.caption) updateData.caption = result.caption;
        if (result.seo_keywords_en) {
          updateData.generation_params = {
            ...asset.generation_params,
            seo_keywords_en: result.seo_keywords_en,
            seo_keywords_ar: result.seo_keywords_ar,
          };
        }

        const { data: updated } = await supabase
          .from("content_assets")
          .update(updateData)
          .eq("id", asset.id)
          .select()
          .single();

        return NextResponse.json({
          asset: updated || asset,
          generated: result,
          setup_required: false,
        });
      } else {
        // n8n call failed — mark asset as pending_review with the prompt
        await supabase
          .from("content_assets")
          .update({ status: "pending_review" })
          .eq("id", asset.id);

        return NextResponse.json({
          asset: { ...asset, status: "pending_review" },
          message: "n8n webhook returned an error. Asset saved with prompt for manual retry.",
          prompt: asset.ai_prompt,
          n8n_status: n8nResponse.status,
        }, { status: 207 });
      }
    } catch (n8nError) {
      // n8n timeout or network error — still return the asset
      await supabase
        .from("content_assets")
        .update({ status: "pending_review" })
        .eq("id", asset.id);

      return NextResponse.json({
        asset: { ...asset, status: "pending_review" },
        message: "n8n webhook timed out or is unreachable. Asset saved with prompt.",
        prompt: asset.ai_prompt,
        setup_required: false,
      }, { status: 202 });
    }
  } catch (err) {
    console.error("[ai-generate] POST error:", err);
    return NextResponse.json(
      { error: "Failed to generate AI content" },
      { status: 500 }
    );
  }
}

/**
 * Build the LLM prompt based on product data, branding, and content type.
 */
function buildPrompt(
  product: Record<string, unknown>,
  branding: Record<string, unknown> | null,
  contentType: string,
  language: string,
  template: Record<string, unknown> | null
): string {
  // If a template is provided, fill in placeholders
  if (template?.prompt_template) {
    let prompt = template.prompt_template as string;
    prompt = prompt.replace(/\{\{product_name\}\}/g, (product.title_en as string) || "");
    prompt = prompt.replace(/\{\{price\}\}/g, String(product.retail_price || ""));
    prompt = prompt.replace(/\{\{original_price\}\}/g, String(product.supplier_cost || ""));
    prompt = prompt.replace(/\{\{category\}\}/g, (product.category as string) || "");
    prompt = prompt.replace(/\{\{features\}\}/g, ((product.tags as string[]) || []).join(", "));
    return prompt;
  }

  // Default prompts by content type
  if (contentType === "description") {
    return `You are an expert Saudi Arabian e-commerce copywriter. You write compelling product descriptions optimized for Salla and Zid stores, targeting Saudi consumers.

## Product Information
- Name: ${product.title_en || product.title_ar || "Unknown"}
- Category: ${product.category || "General"}
- Price: SAR ${product.retail_price || "N/A"}
- Supplier: ${product.supplier || "Unknown"}
${branding ? `
## Brand Context
- Brand: ${branding.brand_name || "N/A"}
- Tone: ${branding.tone || "professional"}
- Tagline: ${branding.tagline || ""}
- Target Audience: ${branding.target_audience || "Saudi consumers"}` : ""}

## Instructions
Write the following in ${language === "both" ? "BOTH Arabic and English" : language === "ar" ? "Arabic" : "English"}:

1. **Product Title** (max 80 characters, SEO-optimized, include key feature)
2. **Product Description** (150-300 words):
   - Opening hook (emotional benefit)
   - 3-5 key features as bullet points
   - Material/specification details
   - Call-to-action
   - Natural keyword integration
3. **Hashtags** (5 relevant hashtags per language)
4. **SEO Keywords** (5 comma-separated keywords per language)

## Rules
- Arabic must be natural Saudi dialect-friendly (Modern Standard Arabic with Saudi flavor)
- Do NOT translate literally — adapt culturally
- Include SAR pricing where relevant
- Mention fast shipping to Saudi Arabia
- Use emojis sparingly (max 3 per description)
- Convert any imperial measurements to metric

## Output Format
Return ONLY valid JSON:
{
  "title_ar": "...",
  "title_en": "...",
  "description_ar": "...",
  "description_en": "...",
  "hashtags_ar": ["...", "..."],
  "hashtags_en": ["...", "..."],
  "seo_keywords_ar": "...",
  "seo_keywords_en": "..."
}`;
  }

  // Social post / carousel / reel
  return `You are a social media content creator for a Saudi e-commerce brand.
${branding ? `Brand: ${branding.brand_name || ""}. Tone: ${branding.tone || "professional"}.` : ""}

Product: ${product.title_en || product.title_ar || "Unknown"}
Price: SAR ${product.retail_price || "N/A"}
Category: ${product.category || "General"}

Generate a ${language === "both" ? "bilingual (Arabic + English)" : language} ${contentType.replace("_", " ")} for social media.

${contentType === "carousel" ? `
Create a 5-slide carousel:
For each slide provide: headline (max 30 chars), body (max 60 chars), visual suggestion.
Return JSON: { "slides": [...], "caption": "...", "hashtags": [...] }
` : contentType === "reel" ? `
Create a 30-second reel script:
Include: hook (first 3 sec), feature highlights, CTA.
Return JSON: { "script": "...", "voiceover_text": "...", "caption": "...", "hashtags": [...] }
` : `
Create a social media post:
Return JSON: { "caption": "...", "extended_text": "...", "hashtags": [...], "cta_text": "..." }
`}`;
}
