import { NextResponse } from "next/server";

/**
 * POST /api/products/:id/ai-generate
 *
 * STUB: AI content generation for product titles, descriptions, and images.
 * Will be connected to n8n WF5 (GPT/Gemini) in Phase 4D-AI.
 * 
 * This is an optional feature — merchants can use it to enhance product content.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "AI content generation coming soon",
      message: "This feature will generate product titles, descriptions, and images using AI. Stay tuned!",
    },
    { status: 501 }
  );
}
