import crypto from "crypto";

const APP_KEY = "534306";
const APP_SECRET = "2Nm8YDXEYUsDfwtICrZUlHISeWPTAADN";
const API_URL = "https://api-sg.aliexpress.com";

// Paste your code here after authorization!
const AUTH_CODE = process.argv[2] || "PASTE_CODE_HERE";

if (AUTH_CODE === "PASTE_CODE_HERE") {
  console.log("Usage: npx tsx src/test-auth.ts <YOUR_AUTH_CODE>");
  process.exit(1);
}

function generateSignature(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  let signStr = "/auth/token/create";
  for (const key of sortedKeys) {
    signStr += `${key}${params[key]}`;
  }
  return crypto.createHmac("sha256", APP_SECRET).update(signStr, "utf8").digest("hex").toUpperCase();
}

async function getAccessToken(code: string) {
  const params: Record<string, string> = {
    app_key: APP_KEY,
    sign_method: "sha256",
    timestamp: Date.now().toString(),
    code: code,
  };

  const sign = generateSignature(params);
  params.sign = sign;

  const body = new URLSearchParams(params).toString();

  const response = await fetch(`${API_URL}/rest/auth/token/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
  });

  const data = await response.json();
  console.log("=== Access Token Result ===");
  console.log(JSON.stringify(data, null, 2));
}

getAccessToken(AUTH_CODE).catch(console.error);
