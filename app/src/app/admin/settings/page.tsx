"use client";
import React, { useState } from "react";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { usePlatformConfig } from "@/hooks/use-admin";

const inputClass = "w-full bg-surface rounded-md px-3 py-2.5 text-text text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";

export default function PlatformSettingsPage() {
  const { config, loading, saving, updateConfig } = usePlatformConfig();

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
            <h3 className="text-base font-semibold text-text mb-2">Supplier API Keys (Platform Defaults)</h3>
            <p className="text-xs text-text-muted mb-4">Used when merchants haven&apos;t connected their own accounts.</p>
            <div className="space-y-4">
              <GatewaySection name="AliExpress Open Platform" icon="shopping_bag" connected fields={[
                { label: "App Key", value: "350****12" },
                { label: "App Secret", value: "****...f3c2", secret: true },
              ]} />
              <GatewaySection name="CJDropshipping" icon="local_shipping" connected={false} fields={[
                { label: "API Key", value: "" },
                { label: "Email", value: "" },
              ]} />
            </div>
          </Card>

          {/* n8n Config */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-text mb-4">n8n Workflow Engine</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <InputField label="n8n Base URL" value={(config.n8n_base_url as string) || "https://n8n.droplinker.com"} />
              <InputField label="Webhook Base URL" value={(config.n8n_webhook_url as string) || "https://n8n.droplinker.com/webhook"} />
            </div>
            <div className="mt-4 p-3 rounded-md bg-success/10 flex items-center gap-3">
              <Icon name="check_circle" className="text-success text-base" />
              <div>
                <p className="text-sm font-medium text-text">System connected</p>
                <p className="text-xs text-text-secondary">Ready for workflow integration</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button disabled={saving}>{saving ? "Saving…" : "Save All Settings"}</Button>
          </div>
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

function GatewaySection({ name, icon, connected, fields }: { name: string; icon: string; connected: boolean; fields: { label: string; value: string; secret?: boolean }[] }) {
  return (
    <div className="p-4 rounded-md border border-border-subtle">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Icon name={icon} className="text-accent text-base" />
          <span className="font-medium text-text text-sm">{name}</span>
          <Badge variant={connected ? "success" : "warning"}>{connected ? "Connected" : "Not Connected"}</Badge>
        </div>
        <Button variant="secondary" size="sm">{connected ? "Update" : "Connect"}</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {fields.map((f) => <InputField key={f.label} {...f} />)}
      </div>
    </div>
  );
}
