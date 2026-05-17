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
  const [showZidTokenModal, setShowZidTokenModal] = useState(false);
  const [zidTokenForm, setZidTokenForm] = useState({
    accessToken: "",
    partnerToken: "",
    refreshToken: "",
    storeId: "",
  });
  const [zidConnecting, setZidConnecting] = useState(false);

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
        zid_denied: "Zid authorization was denied. Please try again.",
        zid_not_configured: "Zid is not configured. Contact support.",
        zid_token_failed: "Failed to get access token from Zid.",
        zid_invalid_callback: "Invalid Zid callback. Please try again.",
        zid_unexpected: "An unexpected Zid error occurred. Please try again.",
      };
      setToast({
        type: "error",
        message: errorMessages[errorParam] || "An error occurred connecting your store.",
      });
    }

    // Auto-dismiss toast after 8 seconds
    if (success || errorParam) {
      const timer = setTimeout(() => setToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, refetch]);

  // Handle Zid manual token connection
  const handleZidManualConnect = async () => {
    if (!zidTokenForm.accessToken || !zidTokenForm.storeId) {
      setToast({ type: "error", message: "Access Token and Store ID are required." });
      return;
    }
    setZidConnecting(true);
    try {
      const res = await fetch("/api/auth/zid/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(zidTokenForm),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: "success", message: `✅ ${data.storeName || "Zid store"} connected!` });
        setShowZidTokenModal(false);
        setZidTokenForm({ accessToken: "", partnerToken: "", refreshToken: "", storeId: "" });
        refetch();
      } else {
        setToast({ type: "error", message: data.error || "Failed to connect Zid store." });
      }
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setZidConnecting(false);
    }
  };

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
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1"
                    onClick={() => setShowZidTokenModal(true)}
                  >
                    Connect with Token
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => window.location.href = "/api/auth/zid"}
                    title="Requires approved Zid app"
                  >
                    OAuth
                  </Button>
                </div>
                <p className="text-[10px] text-text-muted mt-2 text-center">
                  Use <a href="https://bridge.zid.dev" target="_blank" rel="noopener noreferrer" className="underline text-brand">bridge.zid.dev</a> to get your tokens
                </p>
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

      {/* Zid Manual Token Modal */}
      {showZidTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowZidTokenModal(false)}
          />
          {/* Modal */}
          <Card className="relative z-10 w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">Connect Zid Store</h3>
              <button
                onClick={() => setShowZidTokenModal(false)}
                className="p-1 rounded-md hover:bg-surface-sunken text-text-muted"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>

            <div className="bg-surface-sunken rounded-lg p-3 mb-4">
              <p className="text-xs text-text-secondary">
                <strong>How to get your tokens:</strong>
              </p>
              <ol className="text-xs text-text-muted mt-1 space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://bridge.zid.dev" target="_blank" rel="noopener noreferrer" className="underline text-brand">bridge.zid.dev</a></li>
                <li>Install the app on your Zid store</li>
                <li>Download the tokens (shown once)</li>
                <li>Paste them below</li>
              </ol>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Access Token <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={zidTokenForm.accessToken}
                  onChange={(e) => setZidTokenForm(prev => ({ ...prev, accessToken: e.target.value }))}
                  placeholder="Paste your access token"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Partner Token (Authorization)
                </label>
                <input
                  type="text"
                  value={zidTokenForm.partnerToken}
                  onChange={(e) => setZidTokenForm(prev => ({ ...prev, partnerToken: e.target.value }))}
                  placeholder="Bearer JWT token"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Refresh Token
                </label>
                <input
                  type="text"
                  value={zidTokenForm.refreshToken}
                  onChange={(e) => setZidTokenForm(prev => ({ ...prev, refreshToken: e.target.value }))}
                  placeholder="For automatic token renewal"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Store ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={zidTokenForm.storeId}
                  onChange={(e) => setZidTokenForm(prev => ({ ...prev, storeId: e.target.value }))}
                  placeholder="Your Zid store UUID"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setShowZidTokenModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={handleZidManualConnect}
                disabled={zidConnecting || !zidTokenForm.accessToken || !zidTokenForm.storeId}
              >
                {zidConnecting ? "Connecting..." : "Connect Store"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
