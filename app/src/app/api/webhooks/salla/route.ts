import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/webhooks/salla
 *
 * Receives webhook events from Salla (e.g. order.created, order.updated).
 * Supports TWO security strategies configured in the Salla Partner Portal:
 *
 *   1. **Token** — Salla sends `Authorization: Bearer <your_secret>` header.
 *      Simple string comparison. Good enough for most use cases.
 *
 *   2. **Signature** — Salla sends `x-salla-signature` header with HMAC-SHA256.
 *      Verifies both the sender identity AND that the body wasn't tampered with.
 *
 * The code auto-detects which strategy is being used based on headers present.
 *
 * This endpoint is configured as the Global App Webhook URL in the Salla Partner Portal.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.SALLA_WEBHOOK_SECRET;

  // --- Read raw body for signature verification ---
  const rawBody = await request.text();
  let payload: SallaWebhookPayload;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // --- Verify security (supports both Token and Signature strategies) ---
  if (webhookSecret) {
    const signature = request.headers.get("x-salla-signature");
    const authHeader = request.headers.get("authorization");

    if (signature) {
      // === SIGNATURE STRATEGY (HMAC-SHA256) ===
      const computedHmac = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (signature !== computedHmac) {
        console.warn("[Salla Webhook] Signature mismatch");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else if (authHeader) {
      // === TOKEN STRATEGY (Bearer token comparison) ===
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (token !== webhookSecret) {
        console.warn("[Salla Webhook] Token mismatch");
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    } else {
      console.warn("[Salla Webhook] No security headers found (expected x-salla-signature or Authorization)");
      return NextResponse.json({ error: "Missing authentication" }, { status: 401 });
    }
  }

  // --- Route the event ---
  const { event, merchant: sallaMerchantId, data } = payload;
  console.log(`[Salla Webhook] Received event: ${event} from merchant: ${sallaMerchantId}`);

  const adminClient = createAdminClient();

  try {
    switch (event) {
      case "order.created":
      case "order.updated":
        await handleOrderEvent(adminClient, sallaMerchantId, data, event);
        break;

      case "app.installed":
        console.log(`[Salla Webhook] App installed by merchant: ${sallaMerchantId}`);
        break;

      case "app.uninstalled":
        console.log(`[Salla Webhook] App uninstalled by merchant: ${sallaMerchantId}`);
        // Optionally deactivate the store
        break;

      default:
        console.log(`[Salla Webhook] Unhandled event: ${event}`);
    }
  } catch (error) {
    console.error(`[Salla Webhook] Error processing ${event}:`, error);
    // Still return 200 so Salla doesn't retry
    return NextResponse.json({ status: "error", message: "Internal processing error" }, { status: 200 });
  }

  return NextResponse.json({ status: "ok" });
}

// ===================================================================
// Helper: Process order.created / order.updated
// ===================================================================

async function handleOrderEvent(
  adminClient: ReturnType<typeof createAdminClient>,
  sallaMerchantId: number,
  data: Record<string, unknown>,
  event: string
) {
  // 1. Find the DropLinker store that belongs to this Salla merchant.
  //    We match by salla_merchant_id (stored during OAuth callback).
  const { data: store, error: storeError } = await adminClient
    .from("stores")
    .select("id, merchant_id")
    .eq("platform", "salla")
    .eq("salla_merchant_id", sallaMerchantId)
    .maybeSingle();

  if (storeError || !store) {
    console.warn(`[Salla Webhook] No Salla store found for merchant_id ${sallaMerchantId}`);
    return;
  }

  // 2. Map the Salla order data to our orders table
  const sallaOrder = data as SallaOrderData;
  const storeOrderId = String(sallaOrder.id || sallaOrder.reference_id || "");
  const customerInfo = {
    name: sallaOrder.customer?.first_name
      ? `${sallaOrder.customer.first_name} ${sallaOrder.customer.last_name || ""}`.trim()
      : undefined,
    email: sallaOrder.customer?.email,
    phone: sallaOrder.customer?.mobile,
    address: sallaOrder.shipping?.address?.shipping_address,
  };

  const totalAmount = Number(sallaOrder.amounts?.total?.amount || sallaOrder.total?.amount || 0);

  if (event === "order.created") {
    // Check for duplicate
    const { data: existing } = await adminClient
      .from("orders")
      .select("id")
      .eq("store_id", store.id)
      .eq("store_order_id", storeOrderId)
      .maybeSingle();

    if (existing) {
      console.log(`[Salla Webhook] Order ${storeOrderId} already exists, skipping`);
      return;
    }

    const { error: insertError } = await adminClient.from("orders").insert({
      store_id: store.id,
      merchant_id: store.merchant_id,
      store_order_id: storeOrderId,
      customer_info: customerInfo,
      total_amount: totalAmount,
      total_cost: 0, // Will be calculated during fulfillment
      commission_amount: 0,
      status: "new",
      notes: `Salla order #${storeOrderId}`,
    });

    if (insertError) {
      console.error("[Salla Webhook] Failed to insert order:", insertError);
    } else {
      console.log(`[Salla Webhook] ✅ Order ${storeOrderId} created for merchant ${store.merchant_id}`);
    }
  } else if (event === "order.updated") {
    // Update the existing order status
    const statusMap: Record<string, string> = {
      created: "new",
      under_review: "new",
      in_progress: "processing",
      delivering: "shipped",
      in_transit: "shipped",
      delivered: "delivered",
      completed: "delivered",
      canceled: "cancelled",
      refunded: "cancelled",
      restored: "processing",
    };

    const rawStatus = sallaOrder.status;
    const sallaStatus = String(
      typeof rawStatus === "object" && rawStatus !== null ? rawStatus.slug || "" : rawStatus || ""
    );
    const mappedStatus = statusMap[sallaStatus] || "processing";

    const { error: updateError } = await adminClient
      .from("orders")
      .update({
        status: mappedStatus,
        customer_info: customerInfo,
        total_amount: totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", store.id)
      .eq("store_order_id", storeOrderId);

    if (updateError) {
      console.error("[Salla Webhook] Failed to update order:", updateError);
    } else {
      console.log(`[Salla Webhook] ✅ Order ${storeOrderId} updated to "${mappedStatus}"`);
    }
  }
}

// ===================================================================
// Types
// ===================================================================

interface SallaWebhookPayload {
  event: string;
  merchant: number;
  created_at: string;
  data: Record<string, unknown>;
}

interface SallaOrderData {
  id?: number;
  reference_id?: string;
  status?: { slug?: string } | string;
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    mobile?: string;
  };
  shipping?: {
    address?: {
      shipping_address?: string;
    };
  };
  amounts?: {
    total?: { amount?: number };
  };
  total?: { amount?: number };
}
