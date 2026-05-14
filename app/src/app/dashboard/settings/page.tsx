"use client";

import React, { useState } from "react";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { useMerchant } from "@/hooks/use-merchant";
import { useAuth } from "@/hooks/use-auth";

const TABS = [
  { id: "profile", label: "Profile", icon: "person" },
  { id: "billing", label: "Billing", icon: "credit_card" },
  { id: "fulfillment", label: "Auto-Fulfillment", icon: "auto_mode" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
  { id: "team", label: "Team", icon: "group" },
];

const inputClass = "w-full bg-surface rounded-md px-3 py-2.5 text-text text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";
const selectClass = inputClass;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your account, billing, and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-52 shrink-0">
          <Card className="p-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-accent-subtle text-accent font-medium"
                    : "text-text-secondary hover:bg-surface-sunken"
                }`}
              >
                <Icon name={tab.icon} className="text-base" />
                {tab.label}
              </button>
            ))}
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "billing" && <BillingTab />}
          {activeTab === "fulfillment" && <FulfillmentTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "team" && <TeamTab />}
        </div>
      </div>
    </>
  );
}

function ProfileTab() {
  const { merchant, loading, saving, update, error } = useMerchant();
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccess(false);
    const form = new FormData(e.currentTarget);
    const ok = await update({
      business_name: form.get("business_name") as string,
      phone: form.get("phone") as string,
    });
    if (ok) setSuccess(true);
  }

  if (loading) {
    return <Card className="p-6"><Skeleton className="h-40 w-full" /></Card>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-text mb-5">Business Profile</h3>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-accent-on text-lg font-bold">
          {merchant?.business_name?.[0]?.toUpperCase() || "M"}
        </div>
        <div>
          <p className="font-medium text-text">{merchant?.business_name}</p>
          <p className="text-sm text-text-secondary">{merchant?.email}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-error/10 border border-error/30 text-error text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-md bg-success/10 border border-success/30 text-success text-sm">Settings saved successfully</div>
      )}

      <form onSubmit={handleSave}>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Business Name</label>
            <input name="business_name" type="text" defaultValue={merchant?.business_name} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Email Address</label>
            <input type="email" defaultValue={merchant?.email} className={inputClass} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Phone Number</label>
            <input name="phone" type="tel" defaultValue={merchant?.phone || ""} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Plan</label>
            <input type="text" defaultValue={merchant?.plan?.toUpperCase()} className={inputClass} disabled />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function BillingTab() {
  const { merchant, loading } = useMerchant();
  const plan = merchant?.plan || "free";

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-text">Current Plan</h3>
          <Badge variant="success">Active</Badge>
        </div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-2xl font-bold text-text capitalize">{loading ? "…" : plan}</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm">Upgrade Plan</Button>
          <Button variant="secondary" size="sm">Change Plan</Button>
        </div>
      </Card>
    </div>
  );
}

function FulfillmentTab() {
  const { merchant, loading, saving, update } = useMerchant();
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccess(false);
    const form = new FormData(e.currentTarget);
    const ok = await update({
      auto_fulfill_enabled: (form.get("auto_fulfill") as string) === "on",
      min_wallet_balance: Number(form.get("min_balance")) || 50,
      preferred_shipping: form.get("shipping") as string,
    });
    if (ok) setSuccess(true);
  }

  if (loading) return <Card className="p-6"><Skeleton className="h-40 w-full" /></Card>;

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-text mb-5">Auto-Fulfillment Rules</h3>
      {success && (
        <div className="mb-4 p-3 rounded-md bg-success/10 border border-success/30 text-success text-sm">Rules saved successfully</div>
      )}
      <form onSubmit={handleSave} className="space-y-5">
        <ToggleRow
          label="Enable Auto-Fulfillment"
          desc="Automatically place supplier orders when a customer order arrives"
          name="auto_fulfill"
          defaultOn={merchant?.auto_fulfill_enabled ?? false}
        />
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Min Wallet Balance (SAR)</label>
            <input name="min_balance" type="number" defaultValue={merchant?.min_wallet_balance ?? 50} className={inputClass} />
            <p className="text-xs text-text-muted mt-1">Orders held when balance drops below this</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Preferred Shipping</label>
            <select name="shipping" className={selectClass} defaultValue={merchant?.preferred_shipping || "standard"}>
              <option value="epacket">ePacket (fastest)</option>
              <option value="standard">Standard Shipping</option>
              <option value="cheapest">Cheapest Available</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Rules"}</Button>
        </div>
      </form>
    </Card>
  );
}

function NotificationsTab() {
  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-text mb-5">Notification Preferences</h3>
      <div className="space-y-0">
        {[
          { label: "New Orders", desc: "When a customer places an order", email: true, sms: false },
          { label: "Order Fulfilled", desc: "When supplier ships an order", email: true, sms: false },
          { label: "Order Failed", desc: "When auto-fulfillment fails", email: true, sms: true },
          { label: "Low Balance", desc: "When wallet drops below threshold", email: true, sms: true },
          { label: "Stock Alerts", desc: "When products go out of stock", email: true, sms: false },
        ].map((n) => (
          <div key={n.label} className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
            <div>
              <p className="text-sm font-medium text-text">{n.label}</p>
              <p className="text-xs text-text-secondary">{n.desc}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                <input type="checkbox" defaultChecked={n.email} className="accent-accent rounded" />
                Email
              </label>
              <label className="flex items-center gap-1.5 text-xs text-text-secondary">
                <input type="checkbox" defaultChecked={n.sms} className="accent-accent rounded" />
                SMS
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-5">
        <Button>Save Preferences</Button>
      </div>
    </Card>
  );
}

function TeamTab() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-text">Team Members</h3>
        <Button size="sm" disabled>
          <Icon name="person_add" className="text-sm" />
          Invite Member
        </Button>
      </div>
      <p className="text-sm text-text-muted">Team management coming soon.</p>
    </Card>
  );
}

function ToggleRow({ label, desc, name, defaultOn = false }: { label: string; desc: string; name: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-xs text-text-secondary">{desc}</p>
      </div>
      <input type="hidden" name={name} value={on ? "on" : "off"} />
      <button
        type="button"
        onClick={() => setOn(!on)}
        className={`relative w-10 h-5 rounded-full transition-colors ${on ? "bg-accent" : "bg-border"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
