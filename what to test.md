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