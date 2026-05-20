-- ================================================================
-- DropLinker — Phase 4C+10 Addendum: Image Generation Templates
-- Run AFTER phase_content_automation.sql has been executed
-- ================================================================

-- ======================== IMAGE TEMPLATES ========================
-- 5 image generation presets with prompt templates for AI image generators.
-- The `image_prompt_template` column already exists in content_templates.
-- `prompt_template` is NOT NULL, so we use it as a human description.

INSERT INTO content_templates (name, type, category, prompt_template, image_prompt_template, sort_order)
VALUES
(
  'Clean Product Shot',
  'image',
  'product_photo',
  'Generate a professional product photo of {{product_name}} on a clean white background.',
  'Professional product photography of {{product_name}}, centered on pure white background, soft studio lighting, high-end e-commerce style, 4K quality, no text overlay, sharp details',
  10
),
(
  'Lifestyle Scene',
  'image',
  'lifestyle',
  'Generate a lifestyle photo showing {{product_name}} being used in a modern Saudi home.',
  'Lifestyle photography showing {{product_name}} in a modern Saudi Arabian home, warm natural lighting, minimalist interior, person using the product naturally, editorial style, aspirational',
  11
),
(
  'Before/After Comparison',
  'image',
  'comparison',
  'Generate a before/after comparison image for {{product_name}}.',
  'Side-by-side before and after comparison using {{product_name}}, split image layout, left side shows the problem in muted tones, right side shows the solution in vibrant colors, clean modern design',
  12
),
(
  'Instagram Story Ad',
  'image',
  'ad_creative',
  'Generate an Instagram story ad for {{product_name}} at SAR {{price}}.',
  'Instagram story ad design (9:16 ratio) for {{product_name}}, priced at SAR {{price}}, bold modern typography, gradient background, e-commerce promotional style, urgency badge, call-to-action button',
  13
),
(
  'Carousel Slide Design',
  'image',
  'carousel_slide',
  'Generate an Instagram carousel slide highlighting a feature of {{product_name}}.',
  'Instagram carousel slide (1:1 ratio) featuring {{product_name}}, single key feature highlighted, minimal clean design, product-focused, e-commerce style, consistent branding',
  14
);
