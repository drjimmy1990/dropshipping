const crypto = require("crypto");

const supabaseUrl = "https://cqvkzakyztxknihifqlh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdmt6YWt5enR4a25paGlmcWxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc2NTc5MiwiZXhwIjoyMDk0MzQxNzkyfQ.q3kByWVHjT6Mz-kdvsJM8yFYItvGm1UTJWaXdtP_8do";

const APP_KEY = "534306";
const APP_SECRET = "2Nm8YDXEYUsDfwtICrZUlHISeWPTAADN";
const API_URL = "https://api-sg.aliexpress.com";

function generateSignature(params, appSecret, apiName) {
  const sortedKeys = Object.keys(params).sort();
  let signStr = apiName;
  for (const key of sortedKeys) {
    signStr += `${key}${params[key]}`;
  }
  return crypto.createHmac("sha256", appSecret).update(signStr, "utf8").digest("hex").toUpperCase();
}

async function run() {
  // 1. Get token
  const res = await fetch(`${supabaseUrl}/rest/v1/platform_config?key=eq.aliexpress_access_token`, {
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  const token = data[0]?.value?.replace(/"/g, "");
  console.log("Token from DB:", token);

  if (!token) return;

  // 2. Search AliExpress
  const method = "aliexpress.ds.text.search";
  const params = {
    keyWord: "SA_Clothing&Shoes",
    local: "en_US",
    countryCode: "SA",
    currency: "SAR",
    pageIndex: "1",
    pageSize: "20"
  };

  const systemParams = {
    app_key: APP_KEY,
    method,
    timestamp: Date.now().toString(),
    sign_method: "sha256",
    v: "2.0",
    format: "json",
    session: token,
    ...params,
  };

  systemParams.sign = generateSignature(systemParams, APP_SECRET, method);
  const body = new URLSearchParams(systemParams).toString();

  console.log("Sending request to AliExpress...");
  const aliRes = await fetch(`${API_URL}/rest`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
  });

  const aliData = await aliRes.json();
  console.log("AliExpress Response:", JSON.stringify(aliData, null, 2));
}

run().catch(console.error);
