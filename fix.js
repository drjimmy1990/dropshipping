const fs = require('fs');
let code = fs.readFileSync('app/src/app/dashboard/products/[id]/page.tsx', 'utf8');

// 1. Update fetchProduct query
code = code.replace(
  /\.from\("products"\)\s*\n\s*\.select\("\*"\)/g,
  '.from("products")\n      .select("*, listings:product_listings(*)")'
);

// 2. Add helpers right after hasZidStore
code = code.replace(
  /const hasZidStore = connectedStores\.some\(s => s\.platform === "zid"\);/g,
  `const hasZidStore = connectedStores.some(s => s.platform === "zid");

  const isSallaSynced = useCallback(() => {
    return (product as any)?.listings?.some((l: any) => connectedStores.find(s => s.id === l.store_id)?.platform === "salla");
  }, [(product as any)?.listings, connectedStores]);

  const isZidSynced = useCallback(() => {
    return (product as any)?.listings?.some((l: any) => connectedStores.find(s => s.id === l.store_id)?.platform === "zid");
  }, [(product as any)?.listings, connectedStores]);

  const isStoreSynced = useCallback((platform: string) => {
    return (product as any)?.listings?.some((l: any) => connectedStores.find(s => s.id === l.store_id)?.platform === platform);
  }, [(product as any)?.listings, connectedStores]);`
);

// 3. Replace salla_product_id and zid_product_id usages
code = code.replace(/product\.salla_product_id/g, 'isSallaSynced()');
code = code.replace(/product\.zid_product_id/g, 'isZidSynced()');
code = code.replace(/product\.store_product_id/g, '((product as any)?.listings?.[0]?.store_product_id)');

// 4. Update the push button filter logic (lines 364 & 933)
// Since we used isStoreSynced(store.platform), let's replace the specific filters
code = code.replace(/if \(store\.platform === "salla" && isSallaSynced\(\)\) return false;\s*if \(store\.platform === "zid" && isZidSynced\(\)\) return false;/g, 'if (isStoreSynced(store.platform)) return false;');

fs.writeFileSync('app/src/app/dashboard/products/[id]/page.tsx', code);
console.log('Fixed page.tsx');
