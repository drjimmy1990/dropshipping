"use client";
import React, { useState } from "react";
import { GlassCard, GradientButton, Badge, Icon } from "@/components/shared";

/* ================================================================
   PLATFORM SETTINGS — API keys, templates, branding
   ================================================================ */

export default function PlatformSettingsPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">Platform Settings</h2>
        <p className="text-sm text-on-surface-variant">Configure payment gateways, APIs, and branding</p>
      </div>

      <div className="space-y-6">
        {/* Branding */}
        <GlassCard className="p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Platform Branding</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <InputField label="Platform Name" value="DropLinker" />
            <InputField label="Support Email" value="support@droplinker.com" />
            <InputField label="Support Phone" value="+966 11 234 5678" />
            <InputField label="Website URL" value="https://droplinker.com" />
          </div>
          <div className="mt-4">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">Platform Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center primary-gradient-text text-2xl font-bold">DL</div>
              <GradientButton variant="outline" size="sm">Upload Logo</GradientButton>
            </div>
          </div>
        </GlassCard>

        {/* Payment Gateways */}
        <GlassCard className="p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Payment Gateways</h3>
          <div className="space-y-6">
            <GatewaySection name="Moyasar" icon="credit_card" connected fields={[
              { label: "API Key (Publishable)", value: "pk_live_****...3f2a" },
              { label: "Secret Key", value: "sk_live_****...8b1c", secret: true },
            ]} />
            <GatewaySection name="Stripe" icon="payments" connected fields={[
              { label: "Publishable Key", value: "pk_live_****...Xk2j" },
              { label: "Secret Key", value: "sk_live_****...Pm9v", secret: true },
              { label: "Webhook Secret", value: "whsec_****...Nf3r", secret: true },
            ]} />
          </div>
        </GlassCard>

        {/* Supplier API Keys */}
        <GlassCard className="p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Supplier API Keys (Platform Defaults)</h3>
          <p className="text-xs text-on-surface-variant mb-4">These are used when merchants haven&apos;t connected their own accounts.</p>
          <div className="space-y-6">
            <GatewaySection name="AliExpress Open Platform" icon="shopping_bag" connected fields={[
              { label: "App Key", value: "350****12" },
              { label: "App Secret", value: "****...f3c2", secret: true },
              { label: "Access Token", value: "50****...a2b1", secret: true },
            ]} />
            <GatewaySection name="CJDropshipping" icon="local_shipping" connected={false} fields={[
              { label: "API Key", value: "" },
              { label: "Email", value: "" },
            ]} />
          </div>
        </GlassCard>

        {/* Email / SMS */}
        <GlassCard className="p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Notification Templates</h3>
          <div className="space-y-3">
            {[
              { name: "Order Received", channel: "Email + SMS", active: true },
              { name: "Order Fulfilled", channel: "Email", active: true },
              { name: "Order Failed", channel: "Email + SMS", active: true },
              { name: "Low Balance Alert", channel: "Email + SMS", active: true },
              { name: "Stock Out of Sync", channel: "Email", active: false },
              { name: "Welcome Email", channel: "Email", active: true },
              { name: "Bank Transfer Approved", channel: "Email + SMS", active: true },
            ].map((t) => (
              <div key={t.name} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-on-surface-variant">{t.channel}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={t.active ? "success" : "warning"}>{t.active ? "Active" : "Disabled"}</Badge>
                  <button className="text-xs text-secondary hover:underline">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* n8n Config */}
        <GlassCard className="p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">n8n Workflow Engine</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <InputField label="n8n Base URL" value="https://n8n.droplinker.com" />
            <InputField label="Webhook Base URL" value="https://n8n.droplinker.com/webhook" />
          </div>
          <div className="mt-4 p-4 rounded-lg bg-surface-container-high/50 flex items-center gap-3">
            <Icon name="check_circle" size="md" className="text-tertiary" filled />
            <div>
              <p className="text-sm font-medium">7 workflows active</p>
              <p className="text-xs text-on-surface-variant">Last health check: 2 minutes ago — All operational</p>
            </div>
          </div>
        </GlassCard>

        <div className="flex justify-end"><GradientButton>Save All Settings</GradientButton></div>
      </div>
    </>
  );
}

/* ---------- Helpers ---------- */
function InputField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{label}</label>
      <div className="relative">
        <input type={secret && !show ? "password" : "text"} defaultValue={value} className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors pr-10" />
        {secret && (
          <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
            <Icon name={show ? "visibility_off" : "visibility"} size="sm" />
          </button>
        )}
      </div>
    </div>
  );
}

function GatewaySection({ name, icon, connected, fields }: { name: string; icon: string; connected: boolean; fields: { label: string; value: string; secret?: boolean }[] }) {
  return (
    <div className="p-4 rounded-xl border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon name={icon} size="md" className="text-primary" />
          <span className="font-semibold">{name}</span>
          <Badge variant={connected ? "success" : "warning"}>{connected ? "Connected" : "Not Connected"}</Badge>
        </div>
        <GradientButton variant="outline" size="sm">{connected ? "Update" : "Connect"}</GradientButton>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {fields.map((f) => <InputField key={f.label} {...f} />)}
      </div>
    </div>
  );
}
