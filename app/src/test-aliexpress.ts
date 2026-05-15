import crypto from "crypto";

const APP_KEY = "534306";
const APP_SECRET = "2Nm8YDXEYUsDfwtICrZUlHISeWPTAADN";
const API_URL = "https://api-sg.aliexpress.com";

function generateSignature(params: Record<string, string>, appSecret: string, apiName: string): string {
  const sortedKeys = Object.keys(params).sort();
  let signStr = apiName;
  for (const key of sortedKeys) { signStr += `${key}${params[key]}`; }
  return crypto.createHmac("sha256", appSecret).update(signStr, "utf8").digest("hex").toUpperCase();
}

async function apiRequest(method: string, params: Record<string, string>, accessToken?: string) {
  const systemParams: Record<string, string> = {
    app_key: APP_KEY, method, timestamp: Date.now().toString(),
    sign_method: "sha256", v: "2.0", format: "json", ...params,
  };
  if (accessToken) systemParams.session = accessToken;
  const sign = generateSignature(systemParams, APP_SECRET, method);
  systemParams.sign = sign;
  const body = new URLSearchParams(systemParams).toString();
  const response = await fetch(`${API_URL}/rest`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
  });
  return response.json();
}

async function run() {
  console.log("=== Testing with EXACT parameter names from docs ===");
  async function main() {
  const method = "aliexpress.ds.text.search";
  const accessToken = "50000701337tBy1euepQhzRg9Dgpht02jofNnzlUyChXGTxBy146c15b1SeAfPDma3LN";

  const params = {
    keyWord: "iphone",
    local: "en_US",
    countryCode: "SA",
    currency: "SAR",
    pageIndex: "1",
    pageSize: "10",
    shipToCountry: "SA",
    sort: "PRICE_ASC"
  };

  try {
    console.log(`[TEST] Sending request to ${method}...`);
    const result = await apiRequest(method, params, accessToken);
    console.log("\n=== AliExpress API Result ===");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}
  main();
}

run().catch(console.error);
