"use client";

import React from "react";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { useIntegrations } from "@/hooks/use-integrations";

export default function IntegrationsPage() {
  const { stores, suppliers, loading, error } = useIntegrations();

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

      {error && (
        <div className="mb-4 p-3 rounded-md bg-error/10 border border-error/30 text-error text-sm flex items-center gap-2">
          <Icon name="error" className="text-base" />
          {error}
        </div>
      )}

      {/* Store Connections */}
      <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
        Store Platforms
      </h3>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-10 w-full mb-3" />
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-8 w-24" />
            </Card>
          ))
        ) : stores.length === 0 ? (
          <Card className="p-8 md:col-span-2 text-center">
            <Icon name="storefront" className="text-3xl text-text-muted mb-2 mx-auto block" />
            <p className="text-sm text-text-muted">No stores connected yet</p>
            <Button size="sm" className="mt-3">Connect Salla or Zid</Button>
          </Card>
        ) : (
          stores.map((store) => (
            <Card key={store.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center">
                    <Icon name={store.platform === "salla" ? "shopping_basket" : "storefront"} className="text-accent text-base" />
                  </div>
                  <div>
                    <div className="font-medium text-text text-sm">{store.store_name}</div>
                    <div className="text-xs text-text-secondary">{store.store_url || store.platform}</div>
                  </div>
                </div>
                <Badge variant={store.is_active ? "success" : "warning"}>
                  {store.is_active ? "connected" : "disconnected"}
                </Badge>
              </div>
              {store.last_sync && (
                <div className="flex items-center gap-1 text-xs text-text-muted mb-3">
                  <Icon name="sync" className="text-sm" />
                  Last synced: {new Date(store.last_sync).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
              <Button variant={store.is_active ? "ghost" : "primary"} size="sm" className="w-full">
                {store.is_active ? "Manage" : "Connect"}
              </Button>
            </Card>
          ))
        )}
      </div>

      {/* Supplier Connections */}
      <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
        Supplier APIs
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-10 w-full mb-3" />
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-8 w-24" />
            </Card>
          ))
        ) : suppliers.length === 0 ? (
          <Card className="p-8 md:col-span-2 text-center">
            <Icon name="inventory_2" className="text-3xl text-text-muted mb-2 mx-auto block" />
            <p className="text-sm text-text-muted">No supplier accounts linked yet</p>
            <Button size="sm" className="mt-3">Link Supplier</Button>
          </Card>
        ) : (
          suppliers.map((sup) => (
            <Card key={sup.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center">
                    <Icon name={sup.supplier === "aliexpress" ? "inventory_2" : "rocket"} className="text-accent text-base" />
                  </div>
                  <div>
                    <div className="font-medium text-text text-sm capitalize">{sup.supplier}</div>
                    <div className="text-xs text-text-secondary">
                      {sup.is_default ? "Default supplier" : "Connected"}
                    </div>
                  </div>
                </div>
                <Badge variant={sup.is_active ? "success" : "error"}>
                  {sup.is_active ? "active" : "inactive"}
                </Badge>
              </div>
              {sup.last_health_check && (
                <div className="flex items-center gap-1 text-xs text-text-muted mb-3">
                  <Icon name="sync" className="text-sm" />
                  Last check: {new Date(sup.last_health_check).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1">Settings</Button>
                <button className="p-2 rounded-md hover:bg-surface-sunken transition-colors text-text-muted">
                  <Icon name="more_vert" className="text-base" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
