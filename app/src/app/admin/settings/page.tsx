"use client";
import React, { useState } from "react";
import { Card, Button, Badge, Icon } from "@/components/shared";

const inputClass = "w-full bg-surface rounded-md px-3 py-2.5 text-text text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";

export default function PlatformSettingsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Platform Settings</h1>
        <p className="text-sm text-text-secondary">Configure payment gateways, APIs, and branding</p>
      </div>

      <div className="space-y-4">
        {/* Branding */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-text mb-4">Platform Branding</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <InputField label="Platform Name" value="DropLinker" />
            <InputField label="Support Email" value="support@droplinker.com" />
            <InputField label="Support Phone" value="+966 11 234 5678" />
            <InputField label="Website URL" value="https://droplinker.com" />
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
              { label: "Webhook Secret", value: "whsec_****...Nf3r", secret: true },
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
              { label: "Access Token", value: "50****...a2b1", secret: true },
            ]} />
            <GatewaySection name="CJDropshipping" icon="local_shipping" connected={false} fields={[
              { label: "API Key", value: "" },
              { label: "Email", value: "" },
            ]} />
          </div>
        </Card>

        {/* Notification Templates */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-text mb-4">Notification Templates</h3>
          <div className="space-y-0">
            {[
              { name: "Order Received", channel: "Email + SMS", active: true },
              { name: "Order Fulfilled", channel: "Email", active: true },
              { name: "Order Failed", channel: "Email + SMS", active: true },
              { name: "Low Balance Alert", channel: "Email + SMS", active: true },
              { name: "Stock Out of Sync", channel: "Email", active: false },
              { name: "Welcome Email", channel: "Email", active: true },
              { name: "Bank Transfer Approved", channel: "Email + SMS", active: true },
            ].map((t) => (
              <div key={t.name} className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
                <div>
                  <p className="text-sm font-medium text-text">{t.name}</p>
                  <p className="text-xs text-text-secondary">{t.channel}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={t.active ? "success" : "warning"}>{t.active ? "Active" : "Disabled"}</Badge>
                  <button className="text-xs text-accent hover:underline">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* n8n Config */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-text mb-4">n8n Workflow Engine</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <InputField label="n8n Base URL" value="https://n8n.droplinker.com" />
            <InputField label="Webhook Base URL" value="https://n8n.droplinker.com/webhook" />
          </div>
          <div className="mt-4 p-3 rounded-md bg-success-subtle flex items-center gap-3">
            <Icon name="check_circle" className="text-success text-base" />
            <div>
              <p className="text-sm font-medium text-text">7 workflows active</p>
              <p className="text-xs text-text-secondary">Last health check: 2 minutes ago — All operational</p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button>Save All Settings</Button>
        </div>
      </div>
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
          <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
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
