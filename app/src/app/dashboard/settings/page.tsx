"use client";

import React, { useState } from "react";
import { Card, Button, Badge, Icon } from "@/components/shared";

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
  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-text mb-5">Business Profile</h3>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-accent-on text-lg font-bold">
          A
        </div>
        <div>
          <p className="font-medium text-text">Ahmed&apos;s Store</p>
          <p className="text-sm text-text-secondary">ahmed@example.com</p>
        </div>
        <Button variant="secondary" size="sm" className="ml-auto">Change Photo</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { label: "Business Name", value: "Ahmed's Electronics", type: "text" },
          { label: "Email Address", value: "ahmed@example.com", type: "email" },
          { label: "Phone Number", value: "+966 50 123 4567", type: "tel" },
          { label: "Country", value: "Saudi Arabia", type: "text" },
        ].map((field) => (
          <div key={field.label}>
            <label className="block text-sm font-medium text-text mb-1.5">{field.label}</label>
            <input type={field.type} defaultValue={field.value} className={inputClass} />
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-border-subtle">
        <h4 className="text-sm font-semibold text-text mb-4">Change Password</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Current Password</label>
            <input type="password" placeholder="••••••••" className={`${inputClass} placeholder:text-text-muted`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">New Password</label>
            <input type="password" placeholder="••••••••" className={`${inputClass} placeholder:text-text-muted`} />
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <Button>Save Changes</Button>
      </div>
    </Card>
  );
}

function BillingTab() {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-text">Current Plan</h3>
          <Badge variant="success">Active</Badge>
        </div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-2xl font-bold text-text">Growth</span>
          <span className="text-text-secondary text-sm mb-0.5">SAR 149/month</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm">Upgrade to Pro</Button>
          <Button variant="secondary" size="sm">Change Plan</Button>
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-base font-semibold text-text mb-4">Invoices</h3>
        <div className="space-y-2">
          {[
            { date: "May 1, 2026", amount: "SAR 149", status: "Paid" },
            { date: "Apr 1, 2026", amount: "SAR 149", status: "Paid" },
            { date: "Mar 1, 2026", amount: "SAR 99", status: "Paid" },
          ].map((inv) => (
            <div key={inv.date} className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
              <div>
                <p className="text-sm font-medium text-text">{inv.date}</p>
                <p className="text-xs text-text-secondary">Monthly subscription</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-text">{inv.amount}</span>
                <Badge variant="success">{inv.status}</Badge>
                <button className="text-accent hover:underline text-xs">Download</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FulfillmentTab() {
  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-text mb-5">Auto-Fulfillment Rules</h3>
      <div className="space-y-5">
        <ToggleRow label="Enable Auto-Fulfillment" desc="Automatically place supplier orders when a customer order arrives" defaultOn />
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Min Wallet Balance (SAR)</label>
            <input type="number" defaultValue={500} className={inputClass} />
            <p className="text-xs text-text-muted mt-1">Orders held when balance drops below this</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Preferred Shipping</label>
            <select className={selectClass}>
              <option>ePacket (fastest)</option>
              <option>AliExpress Standard</option>
              <option>Cheapest Available</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Fallback Supplier</label>
          <select className={`${selectClass} max-w-md`}>
            <option>CJDropshipping (if AliExpress fails)</option>
            <option>None — mark as failed</option>
          </select>
        </div>
        <ToggleRow label="Auto-Retry Failed Orders" desc="Retry failed supplier orders up to 3 times with 30-minute intervals" defaultOn />
        <div className="flex justify-end mt-2">
          <Button>Save Rules</Button>
        </div>
      </div>
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
          { label: "Tracking Updates", desc: "When tracking info is available", email: false, sms: false },
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
        <Button size="sm">
          <Icon name="person_add" className="text-sm" />
          Invite Member
        </Button>
      </div>
      <div className="space-y-0">
        {[
          { name: "Ahmed K.", email: "ahmed@example.com", role: "Owner", status: "active" },
          { name: "Sara M.", email: "sara@example.com", role: "Manager", status: "active" },
          { name: "Omar A.", email: "omar@example.com", role: "Viewer", status: "pending" },
        ].map((m) => (
          <div key={m.email} className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center text-sm font-medium text-text">
                {m.name[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-text">{m.name}</p>
                <p className="text-xs text-text-secondary">{m.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={m.role === "Owner" ? "accent" : m.role === "Manager" ? "success" : "neutral"}>
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
    </Card>
  );
}

function ToggleRow({ label, desc, defaultOn = false }: { label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-xs text-text-secondary">{desc}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-10 h-5 rounded-full transition-colors ${on ? "bg-accent" : "bg-border"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
