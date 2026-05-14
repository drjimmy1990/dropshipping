# n8n Workflow Guide: Salla → DropLinker

> Build this workflow manually in n8n, node by node.

---

## Overview

```
[Webhook] → [Validate Token] → [Route by Event] → handle each event
```

### Events handled:

| Event | Action |
|-------|--------|
| `app.store.authorize` | Fetch store info from Salla → Save store in Supabase |
| `order.created` | Find store → Insert order in Supabase |
| `order.updated` | Find store → Update order in Supabase |
| `app.installed` | Log only (respond 200) |
| `app.uninstalled` | Deactivate store in Supabase |

---

## Before You Start: Set Variables

Go to **n8n → Settings → Variables** and add:

| Variable Name | Value |
|---------------|-------|
| `SALLA_WEBHOOK_SECRET` | `1fa9f43728db4d22c0f82baea9a1b7165ac0addf8d381301effb222028dcf4e5` |
| `SUPABASE_URL` | `https://cqvkzakyztxknihifqlh.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(your service role key from `.env.local`)* |

Also add a **Supabase credential** in n8n:
- Name: `DropLinker Supabase`
- Host: `https://cqvkzakyztxknihifqlh.supabase.co`
- Service Role Key: *(same key)*

---

## Node 1: Webhook (Trigger)

| Setting | Value |
|---------|-------|
| **Type** | Webhook |
| **HTTP Method** | POST |
| **Path** | `salla-webhook` |
| **Response Mode** | `Using 'Respond to Webhook' Node` |
| **Options → Raw Body** | ✅ ON |

> After activating, your production URL will be:
> `https://n8n.asra3.com/webhook/salla-webhook`

---

## Node 2: IF — Validate Token

Connect from: **Webhook**

| Setting | Value |
|---------|-------|
| **Type** | IF |
| **Condition** | String |
| **Value 1** | `{{ $json.headers.authorization }}` |
| **Operation** | `equals` |
| **Value 2** | `{{ $env.SALLA_WEBHOOK_SECRET }}` |

### TRUE output → goes to **Node 3** (Route by Event)
### FALSE output → goes to **Node 2b** (Reject)

---

## Node 2b: Respond to Webhook — 401 Unauthorized

Connect from: **Validate Token → FALSE**

| Setting | Value |
|---------|-------|
| **Type** | Respond to Webhook |
| **Response Code** | `401` |
| **Response Body** | `{ "error": "Unauthorized" }` |

---

## Node 3: Switch — Route by Event

Connect from: **Validate Token → TRUE**

| Setting | Value |
|---------|-------|
| **Type** | Switch |
| **Routing Rules** | See table below |
| **Fallback Output** | `Extra Output` (for unhandled events) |

### Rules:

| # | Output Name | Condition | Value |
|---|-------------|-----------|-------|
| 1 | `app.store.authorize` | `{{ $json.body.event }}` equals `app.store.authorize` |
| 2 | `order.created` | `{{ $json.body.event }}` equals `order.created` |
| 3 | `order.updated` | `{{ $json.body.event }}` equals `order.updated` |
| 4 | `app.installed` | `{{ $json.body.event }}` equals `app.installed` |
| 5 | `app.uninstalled` | `{{ $json.body.event }}` equals `app.uninstalled` |

---

## Branch A: `app.store.authorize` (Output 1)

> This is the most important branch. When a store installs and authorizes your app,
> Salla sends the access_token. We fetch store details and save everything to Supabase.

### Node A1: HTTP Request — Fetch Store Info from Salla

Connect from: **Route by Event → Output 1**

| Setting | Value |
|---------|-------|
| **Type** | HTTP Request |
| **Method** | GET |
| **URL** | `https://accounts.salla.sa/oauth2/user/info` |
| **Send Headers** | ✅ ON |

**Header:**

| Name | Value |
|------|-------|
| `Authorization` | `{{ 'Bearer ' + $('Route by Event').item.json.body.data.access_token }}` |

> This returns the store name, domain, email, and merchant info.

---

### Node A2: HTTP Request — Upsert Store in Supabase

Connect from: **Fetch Store Info**

| Setting | Value |
|---------|-------|
| **Type** | HTTP Request |
| **Method** | POST |
| **URL** | `{{ $env.SUPABASE_URL + '/rest/v1/stores' }}` |
| **Send Headers** | ✅ ON |

**Headers:**

| Name | Value |
|------|-------|
| `apikey` | `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}` |
| `Authorization` | `{{ 'Bearer ' + $env.SUPABASE_SERVICE_ROLE_KEY }}` |
| `Content-Type` | `application/json` |
| `Prefer` | `resolution=merge-duplicates` |

**Body (JSON):**

```json
{
  "merchant_id": "64df34a7-32f6-4c70-953e-7f54d6bdf81b",
  "platform": "salla",
  "store_name": "{{ $json.data?.name || 'Salla Store' }}",
  "store_url": "{{ $json.data?.domain || '' }}",
  "access_token": "{{ $('Route by Event').item.json.body.data.access_token }}",
  "refresh_token": "{{ $('Route by Event').item.json.body.data.refresh_token }}",
  "is_active": true
}
```

> ⚠️ Replace the `merchant_id` with YOUR DropLinker user UUID.
> The `Prefer: resolution=merge-duplicates` header makes this an UPSERT —
> if the store already exists, it updates instead of failing.

---

### Node A3: Respond to Webhook — 200 Store Saved

Connect from: **Upsert Store**

| Setting | Value |
|---------|-------|
| **Type** | Respond to Webhook |
| **Response Code** | `200` |
| **Response Body** | `{ "status": "ok", "message": "Store authorized and saved" }` |

---

## Branch B: `order.created` (Output 2)

### Node B1: Supabase — Find Salla Store

Connect from: **Route by Event → Output 2**

| Setting | Value |
|---------|-------|
| **Type** | Supabase |
| **Operation** | Get Many |
| **Table** | `stores` |
| **Return All** | No |
| **Limit** | `1` |
| **Filter Type** | String |
| **Filter String** | `platform=eq.salla,is_active=eq.true` |
| **Credential** | `DropLinker Supabase` |

---

### Node B2: IF — Store Found?

Connect from: **Find Salla Store**

| Setting | Value |
|---------|-------|
| **Condition** | `{{ $json.id }}` is not empty |

### TRUE → **Insert Order**
### FALSE → **200 No Store**

---

### Node B3: Supabase — Insert Order

Connect from: **Store Found? → TRUE**

| Setting | Value |
|---------|-------|
| **Type** | Supabase |
| **Operation** | Create |
| **Table** | `orders` |
| **Credential** | `DropLinker Supabase` |

**Fields:**

| Field | Value |
|-------|-------|
| `store_id` | `{{ $('Find Salla Store').item.json.id }}` |
| `merchant_id` | `{{ $('Find Salla Store').item.json.merchant_id }}` |
| `store_order_id` | `{{ String($('Route by Event').item.json.body.data.id) }}` |
| `customer_info` | See JSON below ↓ |
| `total_amount` | `{{ $('Route by Event').item.json.body.data.amounts?.total?.amount || 0 }}` |
| `total_cost` | `0` |
| `commission_amount` | `0` |
| `status` | `new` |
| `notes` | `{{ 'Salla order #' + $('Route by Event').item.json.body.data.id }}` |

**customer_info value:**
```
{{ JSON.stringify({
  name: (($('Route by Event').item.json.body.data.customer?.first_name || '') + ' ' + ($('Route by Event').item.json.body.data.customer?.last_name || '')).trim(),
  email: $('Route by Event').item.json.body.data.customer?.email || '',
  phone: $('Route by Event').item.json.body.data.customer?.mobile || '',
  address: $('Route by Event').item.json.body.data.shipping?.address?.shipping_address || ''
}) }}
```

---

### Node B4: Respond to Webhook — 200 Order Created

Connect from: **Insert Order**

| Setting | Value |
|---------|-------|
| **Response Code** | `200` |
| **Response Body** | `{ "status": "ok", "message": "Order created" }` |

---

### Node B5: Respond to Webhook — 200 No Store (fallback)

Connect from: **Store Found? → FALSE**

| Setting | Value |
|---------|-------|
| **Response Code** | `200` |
| **Response Body** | `{ "status": "error", "message": "No active Salla store found" }` |

---

## Branch C: `order.updated` (Output 3)

### Node C1: Supabase — Find Store

Same as Node B1 (Find Salla Store). You can duplicate it.

---

### Node C2: HTTP Request — Update Order in Supabase

Connect from: **Find Store**

| Setting | Value |
|---------|-------|
| **Type** | HTTP Request |
| **Method** | PATCH |
| **URL** | `{{ $env.SUPABASE_URL + '/rest/v1/orders?store_id=eq.' + $json.id + '&store_order_id=eq.' + $('Route by Event').item.json.body.data.id }}` |
| **Send Headers** | ✅ ON |

**Headers:**

| Name | Value |
|------|-------|
| `apikey` | `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}` |
| `Authorization` | `{{ 'Bearer ' + $env.SUPABASE_SERVICE_ROLE_KEY }}` |
| `Content-Type` | `application/json` |

**Body (JSON):**
```json
{
  "status": "<mapped status>",
  "updated_at": "<current ISO timestamp>"
}
```

**Status mapping expression:**
```
{{ {'created':'new','in_progress':'processing','completed':'delivered','canceled':'cancelled','refunded':'cancelled'}[$('Route by Event').item.json.body.data.status?.slug || $('Route by Event').item.json.body.data.status] || 'processing' }}
```

---

### Node C3: Respond to Webhook — 200 Updated

| **Response Code** | `200` |
| **Response Body** | `{ "status": "ok", "message": "Order updated" }` |

---

## Branch D: `app.installed` (Output 4)

### Node D1: Respond to Webhook — 200 Installed

Just acknowledge. No processing needed.

| **Response Code** | `200` |
| **Response Body** | `{ "status": "ok", "message": "App installed logged" }` |

---

## Branch E: `app.uninstalled` (Output 5)

### Node E1: HTTP Request — Deactivate Store

| Setting | Value |
|---------|-------|
| **Type** | HTTP Request |
| **Method** | PATCH |
| **URL** | `{{ $env.SUPABASE_URL + '/rest/v1/stores?platform=eq.salla&salla_merchant_id=eq.' + $('Route by Event').item.json.body.merchant }}` |

> ⚠️ The webhook sends `body.merchant` (e.g. `964562487`) which matches the
> `salla_merchant_id` column we save during OAuth. This targets the exact store.

**Headers:**

| Name | Value |
|------|-------|
| `apikey` | `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}` |
| `Authorization` | `{{ 'Bearer ' + $env.SUPABASE_SERVICE_ROLE_KEY }}` |
| `Content-Type` | `application/json` |

**Body:**
```json
{ "is_active": false, "updated_at": "{{ new Date().toISOString() }}" }
```

---

### Node E2: Respond to Webhook — 200 Uninstalled

| **Response Code** | `200` |
| **Response Body** | `{ "status": "ok", "message": "Store deactivated" }` |

---

## Branch F: Fallback (Extra Output)

### Node F1: Respond to Webhook — 200 Fallback

For any unhandled events.

| **Response Code** | `200` |
| **Response Body** | `{ "status": "ok", "message": "Event received" }` |

---

## Visual Flow

```
                                    ┌─► app.store.authorize ─► Fetch Store Info ─► Upsert Store ─► 200 ✅
                                    │
                                    ├─► order.created ─► Find Store ─► Store Found? ─┬─► Insert Order ─► 200 ✅
                                    │                                                └─► 200 No Store
                                    │
[Webhook] ─► [Validate Token] ─┬─► [Route by Event] ─┤
                                │                      ├─► order.updated ─► Find Store ─► Update Order ─► 200 ✅
                                │                      │
                                │                      ├─► app.installed ─► 200 ✅
                                │                      │
                                │                      ├─► app.uninstalled ─► Deactivate Store ─► 200 ✅
                                │                      │
                                │                      └─► (other) ─► 200 Fallback
                                │
                                └─► FALSE ─► 401 Unauthorized
```

---

## Testing Checklist

1. [ ] All n8n variables are set (`SALLA_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
2. [ ] Supabase credential is configured in n8n
3. [ ] All Supabase nodes use the `DropLinker Supabase` credential
4. [ ] Workflow is activated
5. [ ] Webhook URL matches what's in the Salla Partner Portal
6. [ ] Reinstall the app on the test store to trigger `app.store.authorize`
7. [ ] Check Supabase `stores` table — new row should appear with real tokens
8. [ ] Create a test order in the Salla test store
9. [ ] Check Supabase `orders` table — new row should appear
