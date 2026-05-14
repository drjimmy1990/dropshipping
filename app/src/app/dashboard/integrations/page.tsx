"use client";

import React from "react";
import { Card, Button, Badge, Icon } from "@/components/shared";
import { INTEGRATIONS } from "@/data/mockData";

export default function IntegrationsPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Integrations</h1>
          <p className="text-sm text-text-secondary">Connect your stores and supplier accounts</p>
        </div>
        <Button size="sm">
          <Icon name="add" className="text-sm" />
          Add Connection
        </Button>
      </div>

      {/* Store Connections */}
      <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
        Store Platforms
      </h3>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {INTEGRATIONS.filter((i) => i.type === "store").map((int) => (
          <Card key={int.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center">
                  <Icon name={int.icon} className="text-accent text-base" />
                </div>
                <div>
                  <div className="font-medium text-text text-sm">{int.name}</div>
                  <div className="text-xs text-text-secondary">{int.details}</div>
                </div>
              </div>
              <Badge variant={int.status === "connected" ? "success" : "warning"}>
                {int.status}
              </Badge>
            </div>
            {int.lastSync && (
              <div className="flex items-center gap-1 text-xs text-text-muted mb-3">
                <Icon name="sync" className="text-sm" />
                Last synced: {int.lastSync}
              </div>
            )}
            <Button
              variant={int.status === "connected" ? "ghost" : "primary"}
              size="sm"
              className="w-full"
            >
              {int.status === "connected" ? "Manage" : "Connect"}
            </Button>
          </Card>
        ))}
      </div>

      {/* Supplier Connections */}
      <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
        Supplier APIs
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {INTEGRATIONS.filter((i) => i.type === "supplier").map((int) => (
          <Card key={int.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center">
                  <Icon name={int.icon} className="text-accent text-base" />
                </div>
                <div>
                  <div className="font-medium text-text text-sm">{int.name}</div>
                  <div className="text-xs text-text-secondary">{int.details}</div>
                </div>
              </div>
              <Badge
                variant={
                  int.status === "connected" ? "success" : int.status === "error" ? "error" : "warning"
                }
              >
                {int.status}
              </Badge>
            </div>
            {int.lastSync && (
              <div className="flex items-center gap-1 text-xs text-text-muted mb-3">
                <Icon name="sync" className="text-sm" />
                Last synced: {int.lastSync}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant={int.status === "error" ? "primary" : "ghost"}
                size="sm"
                className="flex-1"
              >
                {int.status === "error" ? "Reconnect" : "Settings"}
              </Button>
              <button className="p-2 rounded-md hover:bg-surface-sunken transition-colors text-text-muted">
                <Icon name="more_vert" className="text-base" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
