const fs = require('fs');
let code = fs.readFileSync('app/src/app/dashboard/products/page.tsx', 'utf8');

code = code.replace(/case "synced":\s*result = result\.filter\(\(p\) => p\.store_product_id\);\s*break;/g, 'case "synced":\n        result = result.filter((p) => (p as any).listings && (p as any).listings.length > 0);\n        break;');
code = code.replace(/case "not_synced":\s*result = result\.filter\(\(p\) => !p\.store_product_id\);\s*break;/g, 'case "not_synced":\n        result = result.filter((p) => !(p as any).listings || (p as any).listings.length === 0);\n        break;');

fs.writeFileSync('app/src/app/dashboard/products/page.tsx', code);
console.log('Fixed filters in page.tsx');
