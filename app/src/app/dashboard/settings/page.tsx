"use client";

import React, { useState } from "react";
import { GlassCard, GradientButton, Badge, Icon } from "@/components/shared";

/* ================================================================
   SETTINGS — Merchant Account Settings
   ================================================================ */

const TABS = [
  { id: "profile", label: "Profile", icon: "person" },
  { id: "billing", label: "Billing", icon: "credit_card" },
  { id: "fulfillment", label: "Auto-Fulfillment", icon: "auto_mode" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
  { id: "team", label: "Team", icon: "group" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">Settings</h2>
        <p className="text-sm text-on-surface-variant">
          Manage your account, billing, and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 shrink-0">
          <GlassCard className="rounded-xl p-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-primary/15 text-primary"
                    : "text-on-surface-variant hover:bg-white/5"
                }`}
              >
                <Icon name={tab.icon} size="sm" filled={activeTab === tab.id} />
                {tab.label}
              </button>
            ))}
          </GlassCard>
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

/* ---------- Profile ---------- */
function ProfileTab() {
  return (
    <GlassCard className="p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-6">Business Profile</h3>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full primary-gradient flex items-center justify-center text-white text-xl font-bold">
          A
        </div>
        <div>
          <p className="font-semibold">Ahmed&apos;s Store</p>
          <p className="text-sm text-on-surface-variant">ahmed@example.com</p>
        </div>
        <GradientButton variant="outline" size="sm" className="ml-auto">
          Change Photo
        </GradientButton>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { label: "Business Name", value: "Ahmed's Electronics", type: "text" },
          { label: "Email Address", value: "ahmed@example.com", type: "email" },
          { label: "Phone Number", value: "+966 50 123 4567", type: "tel" },
          { label: "Country", value: "Saudi Arabia", type: "select" },
        ].map((field) => (
          <div key={field.label}>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
              {field.label}
            </label>
            <input
              type={field.type === "select" ? "text" : field.type}
              defaultValue={field.value}
              className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors"
            />
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-white/5">
        <h4 className="text-sm font-semibold mb-4">Change Password</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
              Current Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors placeholder:text-on-surface-variant/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
              New Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors placeholder:text-on-surface-variant/40"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <GradientButton>Save Changes</GradientButton>
      </div>
    </GlassCard>
  );
}

/* ---------- Billing ---------- */
function BillingTab() {
  return (
    <div className="space-y-6">
      <GlassCard className="p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Current Plan</h3>
          <Badge variant="success">Active</Badge>
        </div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-3xl font-bold">Growth</span>
          <span className="text-on-surface-variant text-sm mb-1">SAR 149/month</span>
        </div>
        <div className="flex gap-3">
          <GradientButton size="sm">Upgrade to Pro</GradientButton>
          <GradientButton variant="outline" size="sm">Change Plan</GradientButton>
        </div>
      </GlassCard>
      <GlassCard className="p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">Invoices</h3>
        <div className="space-y-3">
          {[
            { date: "May 1, 2024", amount: "SAR 149", status: "Paid" },
            { date: "Apr 1, 2024", amount: "SAR 149", status: "Paid" },
            { date: "Mar 1, 2024", amount: "SAR 99", status: "Paid" },
          ].map((inv) => (
            <div key={inv.date} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm font-medium">{inv.date}</p>
                <p className="text-xs text-on-surface-variant">Monthly subscription</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">{inv.amount}</span>
                <Badge variant="success">{inv.status}</Badge>
                <button className="text-secondary hover:underline text-xs">Download</button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

/* ---------- Auto-Fulfillment ---------- */
function FulfillmentTab() {
  return (
    <GlassCard className="p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-6">Auto-Fulfillment Rules</h3>
      <div className="space-y-6">
        <ToggleRow label="Enable Auto-Fulfillment" desc="Automatically place supplier orders when a customer order arrives" defaultOn />
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
              Min Wallet Balance (SAR)
            </label>
            <input
              type="number"
              defaultValue={500}
              className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors"
            />
            <p className="text-xs text-on-surface-variant mt-1">Orders held when balance drops below this</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
              Preferred Shipping
            </label>
            <select className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors">
              <option>ePacket (fastest)</option>
              <option>AliExpress Standard</option>
              <option>Cheapest Available</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
            Fallback Supplier
          </label>
          <select className="w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface border border-outline-variant/30 focus:border-secondary-container focus:outline-none transition-colors max-w-md">
            <option>CJDropshipping (if AliExpress fails)</option>
            <option>None — mark as failed</option>
          </select>
        </div>
        <ToggleRow label="Auto-Retry Failed Orders" desc="Retry failed supplier orders up to 3 times with 30-minute intervals" defaultOn />
        <div className="flex justify-end mt-4">
          <GradientButton>Save Rules</GradientButton>
        </div>
      </div>
    </GlassCard>
  );
}

/* ---------- Notifications ---------- */
function NotificationsTab() {
  return (
    <GlassCard className="p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-6">Notification Preferences</h3>
      <div className="space-y-1">
        {[
          { label: "New Orders", desc: "When a customer places an order on your store", email: true, sms: false },
          { label: "Order Fulfilled", desc: "When supplier confirms and ships an order", email: true, sms: false },
          { label: "Order Failed", desc: "When auto-fulfillment fails", email: true, sms: true },
          { label: "Low Balance", desc: "When wallet drops below minimum threshold", email: true, sms: true },
          { label: "Stock Alerts", desc: "When imported products go out of stock", email: true, sms: false },
          { label: "Tracking Updates", desc: "When tracking info is available for an order", email: false, sms: false },
        ].map((n) => (
          <div key={n.label} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
            <div>
              <p className="text-sm font-medium">{n.label}</p>
              <p className="text-xs text-on-surface-variant">{n.desc}</p>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs text-on-surface-variant">
                <input type="checkbox" defaultChecked={n.email} className="accent-primary-container rounded" />
                Email
              </label>
              <label className="flex items-center gap-2 text-xs text-on-surface-variant">
                <input type="checkbox" defaultChecked={n.sms} className="accent-primary-container rounded" />
                SMS
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-6">
        <GradientButton>Save Preferences</GradientButton>
      </div>
    </GlassCard>
  );
}

/* ---------- Team ---------- */
function TeamTab() {
  return (
    <div className="space-y-6">
      <GlassCard className="p-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Team Members</h3>
          <GradientButton size="sm">
            <span className="flex items-center gap-1">
              <Icon name="person_add" size="sm" /> Invite Member
            </span>
          </GradientButton>
        </div>
        <div className="space-y-1">
          {[
            { name: "Ahmed K.", email: "ahmed@example.com", role: "Owner", status: "active" },
            { name: "Sara M.", email: "sara@example.com", role: "Manager", status: "active" },
            { name: "Omar A.", email: "omar@example.com", role: "Viewer", status: "pending" },
          ].map((m) => (
            <div key={m.email} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-bold">
                  {m.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-on-surface-variant">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={m.role === "Owner" ? "info" : m.role === "Manager" ? "success" : "warning"}>
                  {m.role}
                </Badge>
                {m.status === "pending" && <Badge variant="warning">Pending</Badge>}
                {m.role !== "Owner" && (
                  <button className="text-xs text-error hover:underline">Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

/* ---------- Helpers ---------- */
function ToggleRow({ label, desc, defaultOn = false }: { label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-on-surface-variant">{desc}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-primary" : "bg-surface-container-high"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
