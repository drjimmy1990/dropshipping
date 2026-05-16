🧪 What to Test
Here's your testing checklist, ordered by priority:

1. Import → Auto-Push to Salla (Critical Path)
Go to Product Discovery → search for a product
Click a product → open detail modal
Click "Import to My Store"
✅ Verify product appears in Supabase products table
✅ Verify product was pushed to your Salla store (check Salla dashboard)
✅ Verify store_product_id is saved back to Supabase
✅ Verify the success panel shows "Manage Products" + "Keep Browsing" buttons
2. My Products Page (Inventory Management)
Go to /dashboard/products
✅ Verify imported products appear with images, prices, profit columns
Click a price → edit inline → press Enter → verify it saves
Toggle active/inactive → verify status updates
Click "Push to Salla" on an unsynced product → verify it syncs
Delete a product → confirm dialog → verify it's removed from both DB and Salla
3. Salla Token Refresh (Edge Case)
If your Salla access token is expired, try pushing a product
✅ Verify the auto-refresh kicks in (401 → refresh → retry)
Product should push successfully despite expired token
4. Error Resilience
Disconnect your Salla store → try importing a product
✅ Verify the product is saved locally even if Salla push fails
✅ Verify the sync badge shows "Not Synced"
Reconnect Salla → click "Push to Salla" → verify it syncs
5. Existing Features (Regression)
✅ All dashboard pages load correctly
✅ Discovery page — search, feed tabs, sort, ship-to all work
✅ Wallet page loads
✅ Button tooltips work (new title prop)

---

6. 🆕 Zid OAuth Flow (Session 10)
Go to /dashboard/integrations
✅ Verify the Zid card shows "Connect Zid Store" button (not "Coming Soon")
Click "Connect Zid Store"
✅ Verify redirect to Zid OAuth page (oauth.zid.sa)
After authorization → verify redirect back to /dashboard/integrations
✅ Verify new store appears in integrations page with platform = "zid"
✅ Verify store record in Supabase `stores` table with partner_token + platform_store_id
7. 🆕 Import → Auto-Push to Zid
Connect a Zid store first (test #6 above)
Go to Product Discovery → search for a product
Import a product (it should auto-detect Zid if no Salla store connected)
✅ Verify product was pushed to Zid store (check Zid dashboard)
✅ Verify bilingual name: Arabic name defaults from title_ar or "المنتج - [title_en]"
✅ Verify images were uploaded to Zid
✅ Verify variants were created on Zid
8. 🆕 Manual Push to Zid
Import a product without auto-push
Go to /dashboard/products
Click "Push to Store" on the unsynced product
✅ Verify it pushes to the connected Zid store
✅ Verify store_product_id is saved back to Supabase
9. 🆕 Multi-Platform (Both Salla + Zid connected)
If a merchant has both stores connected:
Import with `targetPlatform: "zid"` in API body → pushes to Zid
Import with `targetPlatform: "salla"` → pushes to Salla
Import without platform spec → pushes to first active store found
10. 🆕 DB Migration Check
Run `phase7b_zid_integration.sql` on Supabase
✅ Verify `platform_store_id` column exists on `stores` table
✅ Verify `partner_token` column exists on `stores` table