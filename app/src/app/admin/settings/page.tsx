"use client";
import React, { useState } from "react";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { usePlatformConfig } from "@/hooks/use-admin";

const inputClass = "w-full bg-surface rounded-md px-3 py-2.5 text-text text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";

export default function PlatformSettingsPage() {
  const { config, loading, saving, updateConfig } = usePlatformConfig();
  const [showCJModal, setShowCJModal] = useState(false);
  const [cjToken, setCjToken] = useState("");
  const [cjConnecting, setCjConnecting] = useState(false);
  const [cjError, setCjError] = useState("");
  const [cjSuccess, setCjSuccess] = useState("");

  const handleCJConnect = async () => {
    if (!cjToken.trim()) {
      setCjError("CJ Access Token is required.");
      return;
    }
    setCjConnecting(true);
    setCjError("");
    setCjSuccess("");
    try {
      const res = await fetch("/api/auth/cj/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: cjToken.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCjSuccess("✅ CJ token saved! All merchants can now browse CJ products.");
        setCjToken("");
        setTimeout(() => {
          setShowCJModal(false);
          setCjSuccess("");
          window.location.reload();
        }, 2000);
      } else {
        setCjError(data.error || "Failed to save CJ token.");
      }
    } catch {
      setCjError("Network error. Please try again.");
    } finally {
      setCjConnecting(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Platform Settings</h1>
        <p className="text-sm text-text-secondary">Configure payment gateways, APIs, and branding</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-32 w-full" /></Card>)}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Branding */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-text mb-4">Platform Branding</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <InputField label="Platform Name" value={(config.platform_name as string) || "DropLinker"} />
              <InputField label="Support Email" value={(config.support_email as string) || "support@droplinker.com"} />
              <InputField label="Support Phone" value={(config.support_phone as string) || "+966 11 234 5678"} />
              <InputField label="Website URL" value={(config.website_url as string) || "https://droplinker.com"} />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-text mb-1.5">Platform Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-accent flex items-center justify-center text-accent-on text-lg font-bold">DL</div>
                <Button variant="secondary" size="sm">Upload Logo</Button>
              </div>
            </div>
          </Card>

          {/* Payment Gateways */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-text mb-4">Payment Gateways</h3>
            <div className="space-y-4">
              <GatewaySection name="Moyasar" icon="credit_card" connected fields={[
                { label: "API Key (Publishable)", value: "pk_live_****...3f2a" },
                { label: "Secret Key", value: "sk_live_****...8b1c", secret: true },
              ]} />
              <GatewaySection name="Stripe" icon="payments" connected fields={[
                { label: "Publishable Key", value: "pk_live_****...Xk2j" },
                { label: "Secret Key", value: "sk_live_****...Pm9v", secret: true },
              ]} />
            </div>
          </Card>

          {/* Supplier API Keys */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-text mb-2">Supplier API Keys (Platform-Level)</h3>
            <p className="text-xs text-text-muted mb-4">These API keys are shared across all merchants. One key serves everyone.</p>
            <div className="space-y-4">
              <GatewaySection 
                name="AliExpress Open Platform" 
                icon="shopping_bag" 
                connected={!!config.aliexpress_access_token} 
                onConnect={() => {
                  const clientId = process.env.NEXT_PUBLIC_ALIEXPRESS_APP_KEY || "534306";
                  const redirectUri = `${window.location.origin}/api/auth/aliexpress/callback`;
                  window.location.href = `https://api-sg.aliexpress.com/oauth/authorize?response_type=code&force_auth=true&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
                }}
                fields={[
                  { label: "App Key", value: "350****12" },
                  { label: "App Secret", value: "****...f3c2", secret: true },
                ]} 
              />
              <GatewaySection 
                name="CJDropshipping" 
                icon="local_shipping" 
                connected={!!config.cj_access_token}
                onConnect={() => {
                  setCjError("");
                  setCjSuccess("");
                  setShowCJModal(true);
                }}
                fields={[
                  { label: "Access Token", value: config.cj_access_token ? "****...saved" : "(not set)" },
                ]} 
              />
            </div>
          </Card>

          {/* AI Content Engine */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Icon name="auto_awesome" className="text-purple-500 text-base" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text">AI Content Engine</h3>
                <p className="text-xs text-text-muted">Configure AI-powered content generation workflows</p>
              </div>
            </div>

            {/* Webhook URLs */}
            <div className="mb-5">
              <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-1.5">
                <Icon name="webhook" className="text-sm" /> n8n Webhook URLs
              </h4>
              <div className="grid md:grid-cols-2 gap-3">
                <InputField 
                  label="WF5: Description Generator" 
                  value={((config.n8n_webhooks as Record<string, string>)?.wf5_description) || ""} 
                />
                <InputField 
                  label="WF8: Social Content Generator" 
                  value={((config.n8n_webhooks as Record<string, string>)?.wf8_social_content) || ""} 
                />
                <InputField 
                  label="WF9: Auto-Publisher (Cron)" 
                  value={((config.n8n_webhooks as Record<string, string>)?.wf9_auto_publish) || ""} 
                />
                <InputField 
                  label="WF10: Image Generator" 
                  value={((config.n8n_webhooks as Record<string, string>)?.wf10_image_generate) || ""} 
                />
              </div>
              <p className="text-[10px] text-text-muted mt-2">
                <Icon name="info" className="text-xs align-middle mr-0.5" />
                Paste n8n webhook URLs here after building your workflows. See <code className="text-accent">n8n_content_workflows_guide.md</code> for setup instructions.
              </p>
            </div>

            {/* Default AI Settings */}
            <div className="mb-5 border-t border-border-subtle pt-4">
              <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-1.5">
                <Icon name="smart_toy" className="text-sm" /> Default AI Settings
              </h4>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Default Provider</label>
                  <select 
                    defaultValue={((config.ai_content_settings as Record<string, string>)?.default_provider) || "gemini"}
                    className={inputClass}
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="gpt4o">OpenAI GPT-4o</option>
                    <option value="claude">Anthropic Claude</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Default Model</label>
                  <input 
                    type="text"
                    defaultValue={((config.ai_content_settings as Record<string, string>)?.default_model) || "gemini-2.0-flash"}
                    placeholder="e.g. gemini-2.0-flash"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Default Language</label>
                  <select 
                    defaultValue={((config.ai_content_settings as Record<string, string>)?.default_language) || "both"}
                    className={inputClass}
                  >
                    <option value="both">Both (AR + EN)</option>
                    <option value="ar">Arabic Only</option>
                    <option value="en">English Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Image Generation */}
            <div className="border-t border-border-subtle pt-4">
              <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-1.5">
                <Icon name="image" className="text-sm" /> Image Generation
              </h4>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Image Provider</label>
                  <select 
                    defaultValue={((config.ai_content_settings as Record<string, string>)?.image_provider) || "dall-e"}
                    className={inputClass}
                  >
                    <option value="dall-e">OpenAI DALL-E 3</option>
                    <option value="imagen">Google Imagen</option>
                    <option value="midjourney">Midjourney (via API)</option>
                    <option value="flux">Flux</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Default Style</label>
                  <select 
                    defaultValue={((config.ai_content_settings as Record<string, string>)?.default_image_style) || "product_clean"}
                    className={inputClass}
                  >
                    <option value="product_clean">Clean Product Shot</option>
                    <option value="lifestyle">Lifestyle Scene</option>
                    <option value="comparison">Before/After</option>
                    <option value="ad_creative">Ad Creative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Default Size</label>
                  <select 
                    defaultValue={((config.ai_content_settings as Record<string, string>)?.default_image_size) || "1024x1024"}
                    className={inputClass}
                  >
                    <option value="1024x1024">1024×1024 (Square)</option>
                    <option value="1080x1080">1080×1080 (Instagram)</option>
                    <option value="1080x1920">1080×1920 (Story/Reel)</option>
                    <option value="1920x1080">1920×1080 (Landscape)</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button disabled={saving}>{saving ? "Saving…" : "Save All Settings"}</Button>
          </div>
        </div>
      )}

      {/* CJ Connect Modal */}
      {showCJModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCJModal(false)}
          />
          <Card className="relative z-10 w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">Connect CJDropshipping</h3>
              <button
                onClick={() => setShowCJModal(false)}
                className="p-1 rounded-md hover:bg-surface-sunken text-text-muted"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>

            <div className="bg-surface-sunken rounded-lg p-3 mb-4">
              <p className="text-xs font-medium text-text-secondary mb-1">
                How to get your CJ API Key:
              </p>
              <ol className="text-xs text-text-muted space-y-1 list-decimal list-inside">
                <li>Log in to <a href="https://developers.cjdropshipping.com" target="_blank" rel="noopener noreferrer" className="underline text-accent">CJ Developer Portal</a></li>
                <li>Go to <strong>API Management</strong> → get your <strong>Access Token</strong></li>
                <li>Paste it below — this token serves <strong>all merchants</strong></li>
              </ol>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  CJ Access Token <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={cjToken}
                  onChange={(e) => setCjToken(e.target.value)}
                  placeholder="Paste your CJ Access Token here..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 font-mono resize-none"
                />
              </div>

              {cjError && (
                <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">{cjError}</p>
                </div>
              )}

              {cjSuccess && (
                <div className="p-2 rounded-md bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-green-400">{cjSuccess}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setShowCJModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={handleCJConnect}
                disabled={cjConnecting || !cjToken.trim()}
              >
                {cjConnecting ? "Validating & Saving..." : "Connect CJ"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function InputField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-text mb-1.5">{label}</label>
      <div className="relative">
        <input type={secret && !show ? "password" : "text"} defaultValue={value} className={`${inputClass} pr-9`} />
        {secret && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
            <Icon name={show ? "visibility_off" : "visibility"} className="text-sm" />
          </button>
        )}
      </div>
    </div>
  );
}

function GatewaySection({ name, icon, connected, onConnect, fields }: { name: string; icon: string; connected: boolean; onConnect?: () => void; fields: { label: string; value: string; secret?: boolean }[] }) {
  return (
    <div className="p-4 rounded-md border border-border-subtle">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Icon name={icon} className="text-accent text-base" />
          <span className="font-medium text-text text-sm">{name}</span>
          <Badge variant={connected ? "success" : "warning"}>{connected ? "Connected" : "Not Connected"}</Badge>
        </div>
        <Button variant="secondary" size="sm" onClick={onConnect}>{connected ? "Reconnect" : "Connect"}</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {fields.map((f) => <InputField key={f.label} {...f} />)}
      </div>
    </div>
  );
}
