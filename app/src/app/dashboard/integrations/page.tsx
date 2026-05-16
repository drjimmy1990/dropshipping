"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Card, Button, Badge, Icon, Skeleton } from "@/components/shared";
import { useIntegrations } from "@/hooks/use-integrations";
import { useSearchParams } from "next/navigation";

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<IntegrationsSkeleton />}>
      <IntegrationsContent />
    </Suspense>
  );
}

function IntegrationsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-10 w-full mb-3" />
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-8 w-24" />
          </Card>
        ))}
      </div>
    </div>
  );
}

function IntegrationsContent() {
  const { stores, suppliers, loading, error, refetch } = useIntegrations();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const handleDisconnect = async (storeId: string, storeName: string) => {
    if (!confirm(`Disconnect "${storeName}"? You can reconnect later.`)) return;
    setDisconnecting(storeId);
    try {
      const res = await fetch(`/api/stores/${storeId}/disconnect`, { method: "POST" });
      if (res.ok) {
        setToast({ type: "success", message: `${storeName} disconnected.` });
        refetch();
      } else {
        setToast({ type: "error", message: "Failed to disconnect. Try again." });
      }
    } catch {
      setToast({ type: "error", message: "Network error. Try again." });
    } finally {
      setDisconnecting(null);
    }
  };

  // Handle redirect query params from OAuth callback
  useEffect(() => {
    const success = searchParams.get("success");
    const errorParam = searchParams.get("error");

    if (success === "salla_connected") {
      setToast({ type: "success", message: "✅ Salla store connected successfully!" });
      refetch(); // Refresh the stores list
    } else if (errorParam) {
      const errorMessages: Record<string, string> = {
        salla_denied: "Authorization was denied. Please try again.",
        salla_not_configured: "Salla is not configured. Contact support.",
        salla_token_failed: "Failed to get access token from Salla.",
        salla_userinfo_failed: "Failed to fetch store info from Salla.",
        salla_invalid_callback: "Invalid callback. Please try again.",
        salla_unexpected: "An unexpected error occurred. Please try again.",
      };
      setToast({
        type: "error",
        message: errorMessages[errorParam] || "An error occurred connecting to Salla.",
      });
    }

    // Auto-dismiss toast after 8 seconds
    if (success || errorParam) {
      const timer = setTimeout(() => setToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, refetch]);

  const hasSallaStore = stores.some((s) => s.platform === "salla");
  const hasZidStore = stores.some((s) => s.platform === "zid");

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Integrations</h1>
          <p className="text-sm text-text-secondary">Connect your stores and supplier accounts</p>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`mb-4 p-3 rounded-md text-sm flex items-center gap-2 transition-all ${
            toast.type === "success"
              ? "bg-success/10 border border-success/30 text-success"
              : "bg-error/10 border border-error/30 text-error"
          }`}
        >
          <Icon name={toast.type === "success" ? "check_circle" : "error"} className="text-base" />
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-70">
            <Icon name="close" className="text-base" />
          </button>
        </div>
      )}

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
        ) : (
          <>
            {/* Connected Salla stores */}
            {stores
              .filter((s) => s.platform === "salla")
              .map((store) => (
                <Card key={store.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center">
                        <Icon name="shopping_basket" className="text-accent text-base" />
                      </div>
                      <div>
                        <div className="font-medium text-text text-sm">{store.store_name}</div>
                        <div className="text-xs text-text-secondary">
                          {store.store_url || "Salla"}
                        </div>
                      </div>
                    </div>
                    <Badge variant={store.is_active ? "success" : "warning"}>
                      {store.is_active ? "connected" : "disconnected"}
                    </Badge>
                  </div>
                  {store.last_sync && (
                    <div className="flex items-center gap-1 text-xs text-text-muted mb-3">
                      <Icon name="sync" className="text-sm" />
                      Last synced:{" "}
                      {new Date(store.last_sync).toLocaleString("en", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                  {store.is_active ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => handleDisconnect(store.id, store.store_name)}
                      disabled={disconnecting === store.id}
                    >
                      {disconnecting === store.id ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  ) : (
                    <a href="/api/auth/salla">
                      <Button size="sm" className="w-full">
                        <Icon name="link" className="text-sm" />
                        Reconnect
                      </Button>
                    </a>
                  )}
                </Card>
              ))}

            {/* Salla connect card (if not connected) */}
            {!hasSallaStore && (
              <Card className="p-5 border-dashed">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center">
                      <Icon name="shopping_basket" className="text-accent text-base" />
                    </div>
                    <div>
                      <div className="font-medium text-text text-sm">Salla</div>
                      <div className="text-xs text-text-secondary">
                        Connect your Salla store
                      </div>
                    </div>
                  </div>
                  <Badge variant="neutral">not connected</Badge>
                </div>
                <p className="text-xs text-text-muted mb-3">
                  Link your Salla store to automatically sync orders, products, and inventory.
                </p>
                <a href="/api/auth/salla">
                  <Button size="sm" className="w-full">
                    <Icon name="link" className="text-sm" />
                    Connect Salla
                  </Button>
                </a>
              </Card>
            )}

            {/* Connected Zid stores */}
            {stores
              .filter((s) => s.platform === "zid")
              .map((store) => (
                <Card key={store.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center">
                        <Icon name="storefront" className="text-accent text-base" />
                      </div>
                      <div>
                        <div className="font-medium text-text text-sm">{store.store_name}</div>
                        <div className="text-xs text-text-secondary">
                          {store.store_url || "Zid"}
                        </div>
                      </div>
                    </div>
                    <Badge variant={store.is_active ? "success" : "warning"}>
                      {store.is_active ? "connected" : "disconnected"}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full">
                    Manage
                  </Button>
                </Card>
              ))}

            {/* Zid connect card (if not connected) */}
            {!hasZidStore && (
              <Card className="p-5 border-dashed">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-sunken flex items-center justify-center">
                      <Icon name="storefront" className="text-text-muted text-base" />
                    </div>
                    <div>
                      <div className="font-medium text-text text-sm">Zid</div>
                      <div className="text-xs text-text-secondary">Not connected</div>
                    </div>
                  </div>
                  <Badge variant="neutral">new</Badge>
                </div>
                <p className="text-xs text-text-muted mb-3">
                  Connect your Zid store to import and manage products.
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full"
                  onClick={() => window.location.href = "/api/auth/zid"}
                >
                  Connect Zid Store
                </Button>
              </Card>
            )}
          </>
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
