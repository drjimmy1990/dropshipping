"use client";

import React from "react";
import { GlassCard, GradientButton, Badge, Icon } from "@/components/shared";
import { INTEGRATIONS } from "@/data/mockData";

/* ================================================================
   INTEGRATIONS — Connect Stores & Suppliers
   ================================================================ */

export default function IntegrationsPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Integrations</h2>
          <p className="text-sm text-on-surface-variant">Connect your stores and supplier accounts</p>
        </div>
        <GradientButton size="sm">
          <span className="flex items-center gap-2">
            <Icon name="add" size="sm" />
            Add Connection
          </span>
        </GradientButton>
      </div>

      {/* Store Connections */}
      <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-4">
        Store Platforms
      </h3>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {INTEGRATIONS.filter((i) => i.type === "store").map((int) => (
          <GlassCard key={int.id} hover className="p-6 rounded-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-container/15 flex items-center justify-center">
                  <Icon name={int.icon} className="text-primary" size="md" />
                </div>
                <div>
                  <div className="font-semibold">{int.name}</div>
                  <div className="text-xs text-on-surface-variant">{int.details}</div>
                </div>
              </div>
              <Badge variant={int.status === "connected" ? "success" : "warning"}>
                {int.status}
              </Badge>
            </div>
            {int.lastSync && (
              <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-4">
                <Icon name="sync" size="sm" />
                Last synced: {int.lastSync}
              </div>
            )}
            <GradientButton
              variant={int.status === "connected" ? "ghost" : "primary"}
              size="sm"
              className="w-full"
            >
              {int.status === "connected" ? "Manage" : "Connect"}
            </GradientButton>
          </GlassCard>
        ))}
      </div>

      {/* Supplier Connections */}
      <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-4">
        Supplier APIs
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {INTEGRATIONS.filter((i) => i.type === "supplier").map((int) => (
          <GlassCard key={int.id} hover className="p-6 rounded-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary-container/10 flex items-center justify-center">
                  <Icon name={int.icon} className="text-secondary" size="md" />
                </div>
                <div>
                  <div className="font-semibold">{int.name}</div>
                  <div className="text-xs text-on-surface-variant">{int.details}</div>
                </div>
              </div>
              <Badge
                variant={
                  int.status === "connected" ? "success" : int.status === "error" ? "failed" : "warning"
                }
              >
                {int.status}
              </Badge>
            </div>
            {int.lastSync && (
              <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-4">
                <Icon name="sync" size="sm" />
                Last synced: {int.lastSync}
              </div>
            )}
            <div className="flex gap-2">
              <GradientButton
                variant={int.status === "error" ? "primary" : "ghost"}
                size="sm"
                className="flex-1"
              >
                {int.status === "error" ? "Reconnect" : "Settings"}
              </GradientButton>
              <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-on-surface-variant">
                <Icon name="more_vert" size="sm" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
