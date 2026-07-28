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
  const { stores, suppliers, maxStores, planName, loading, error, refetch } = useIntegrations();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [showZidTokenModal, setShowZidTokenModal] = useState(false);
  const [zidTokenForm, setZidTokenForm] = useState({
    managerToken: "",
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

  const handleRemoveStore = async (storeId: string, storeName: string) => {
    if (!confirm(`Permanently remove "${storeName}"? This will delete all store data. You can connect a new store afterward.`)) return;
    setDisconnecting(storeId);
    try {
      const res = await fetch(`/api/stores/${storeId}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ type: "success", message: `${storeName} removed.` });
        refetch();
      } else {
        setToast({ type: "error", message: "Failed to remove store. Try again." });
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
    } else if (success === "zid_connected") {
      setToast({ type: "success", message: "✅ Zid store connected successfully!" });
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
        max_stores_reached: "You've reached your plan's store limit. Upgrade to connect more.",
        store_count_failed: "Could not verify your plan limits. Please try again.",
        salla_auth_mismatch: "Session mismatch — please sign in again and retry.",
        zid_auth_mismatch: "Session mismatch — please sign in again and retry.",
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
    if (!zidTokenForm.managerToken || !zidTokenForm.storeId) {
      setToast({ type: "error", message: "Manager Token and Store ID are required." });
      return;
    }
    setZidConnecting(true);
    try {
      const res = await fetch("/api/auth/zid/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: zidTokenForm.managerToken,
          storeId: zidTokenForm.storeId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: "success", message: `✅ ${data.storeName || "Zid store"} connected!` });
        setShowZidTokenModal(false);
        setZidTokenForm({ managerToken: "", storeId: "" });
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
  // `maxStores === null` means the limit is unknown — never treat unknown as at-limit.
  // The server routes fail closed, so they remain the authority.
  const storesAtLimit = maxStores !== null && stores.length >= maxStores;

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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Store Platforms ({stores.length} / {maxStores ?? "—"})
        </h3>
        <Badge variant={storesAtLimit ? "warning" : "neutral"}>
          {planName} plan
        </Badge>
      </div>

      {storesAtLimit && (
        <div className="mb-4 p-3 rounded-md bg-warning/10 border border-warning/30 text-warning text-sm flex items-center gap-2">
          <Icon name="info" className="text-base" />
          You have reached the maximum number of stores for your plan. Disconnect a store or upgrade to connect more.
        </div>
      )}
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
                    <div className="flex gap-2">
                      <a href="/api/auth/salla" className="flex-1">
                        <Button size="sm" className="w-full">
                          <Icon name="link" className="text-sm" />
                          Reconnect
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStore(store.id, store.store_name)}
                        disabled={disconnecting === store.id}
                        title="Remove store permanently"
                      >
                        <Icon name="delete" className="text-sm" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))}

            {/* Salla connect card */}
            <Card className="p-5 border-dashed">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center">
                      <Icon name="shopping_basket" className="text-accent text-base" />
                    </div>
                    <div>
                      <div className="font-medium text-text text-sm">Salla</div>
                      <div className="text-xs text-text-secondary">
                        {hasSallaStore ? "Connect another Salla store" : "Connect your Salla store"}
                      </div>
                    </div>
                  </div>
                  <Badge variant="neutral">{hasSallaStore ? "optional" : "not connected"}</Badge>
                </div>
                <p className="text-xs text-text-muted mb-3">
                  Link your Salla store to automatically sync orders, products, and inventory.
                </p>
                {storesAtLimit ? (
                  <Button size="sm" className="w-full" disabled title="Store limit reached">
                    <Icon name="lock" className="text-sm" />
                    Limit Reached
                  </Button>
                ) : (
                  <a href="/api/auth/salla">
                    <Button size="sm" className="w-full">
                      <Icon name="link" className="text-sm" />
                      Connect Salla
                    </Button>
                  </a>
                )}
              </Card>

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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => window.location.href = "/api/auth/zid"}
                      >
                        <Icon name="link" className="text-sm" />
                        Reconnect
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStore(store.id, store.store_name)}
                        disabled={disconnecting === store.id}
                        title="Remove store permanently"
                      >
                        <Icon name="delete" className="text-sm" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))}

            {/* Zid connect card */}
            <Card className="p-5 border-dashed">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-sunken flex items-center justify-center">
                      <Icon name="storefront" className="text-text-muted text-base" />
                    </div>
                    <div>
                      <div className="font-medium text-text text-sm">Zid</div>
                      <div className="text-xs text-text-secondary">
                        {hasZidStore ? "Connect another Zid store" : "Not connected"}
                      </div>
                    </div>
                  </div>
                  <Badge variant="neutral">{hasZidStore ? "optional" : "new"}</Badge>
                </div>
                <p className="text-xs text-text-muted mb-3">
                  Connect your Zid store to import and manage products.
                </p>
                {storesAtLimit ? (
                  <Button size="sm" className="w-full" disabled title="Store limit reached">
                    <Icon name="lock" className="text-sm" />
                    Limit Reached
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowZidTokenModal(true)}
                    >
                      <Icon name="link" className="text-sm" />
                      Direct Connect
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1"
                      onClick={() => window.location.href = "/api/auth/zid"}
                    >
                      <Icon name="lock_open" className="text-sm" />
                      OAuth
                    </Button>
                  </div>
                )}
            </Card>
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
        ) : (
          <>
            {/* Existing connected suppliers */}
            {suppliers.map((sup) => (
              <Card key={sup.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center">
                      <Icon name={sup.supplier === "cj" ? "local_shipping" : sup.supplier === "aliexpress" ? "inventory_2" : "rocket"} className="text-accent text-base" />
                    </div>
                    <div>
                      <div className="font-medium text-text text-sm">
                        {sup.supplier === "cj" ? "CJDropshipping" : sup.supplier === "aliexpress" ? "AliExpress" : sup.supplier}
                      </div>
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
            ))}

            {/* CJ info card — platform-level integration (like AliExpress) */}
            {!suppliers.some(s => s.supplier === "cj") && (
              <Card className="p-5 border-dashed">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0066cc]/10 flex items-center justify-center">
                      <Icon name="local_shipping" className="text-[#0066cc] text-base" />
                    </div>
                    <div>
                      <div className="font-medium text-text text-sm">CJDropshipping</div>
                      <div className="text-xs text-text-secondary">Platform-level integration</div>
                    </div>
                  </div>
                  <Badge variant="success">built-in</Badge>
                </div>
                <p className="text-xs text-text-muted mb-3">
                  CJDropshipping is pre-configured at the platform level. No additional setup needed — browse CJ products directly from Product Discovery.
                </p>
              </Card>
            )}

            {/* AliExpress info card — always present since it uses platform keys */}
            {!suppliers.some(s => s.supplier === "aliexpress") && (
              <Card className="p-5 border-dashed">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#e8400a]/10 flex items-center justify-center">
                      <Icon name="inventory_2" className="text-[#e8400a] text-base" />
                    </div>
                    <div>
                      <div className="font-medium text-text text-sm">AliExpress</div>
                      <div className="text-xs text-text-secondary">Platform-level integration</div>
                    </div>
                  </div>
                  <Badge variant="success">built-in</Badge>
                </div>
                <p className="text-xs text-text-muted mb-3">
                  AliExpress is pre-configured at the platform level. No additional setup needed.
                </p>
              </Card>
            )}
          </>
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
              <p className="text-xs font-medium text-text-secondary mb-1">
                How to get your credentials:
              </p>
              <ol className="text-xs text-text-muted space-y-1 list-decimal list-inside">
                <li>Log in to your <a href="https://web.zid.sa" target="_blank" rel="noopener noreferrer" className="underline text-brand">Zid Dashboard</a></li>
                <li>Go to <strong>Settings → Integrations</strong> (الإعدادات → الربط المباشر)</li>
                <li>Copy <strong>Manager Token</strong> (المفتاح الخاص بالتاجر)</li>
                <li>Copy <strong>Store ID</strong> (معرّف المتجر)</li>
                <li>Paste both below</li>
              </ol>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Manager Token (المفتاح الخاص) <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={zidTokenForm.managerToken}
                  onChange={(e) => setZidTokenForm(prev => ({ ...prev, managerToken: e.target.value }))}
                  placeholder="Paste your Manager Token from Zid dashboard"
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 font-mono resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Store ID (معرّف المتجر) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={zidTokenForm.storeId}
                  onChange={(e) => setZidTokenForm(prev => ({ ...prev, storeId: e.target.value }))}
                  placeholder="e.g. 3146033"
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
                disabled={zidConnecting || !zidTokenForm.managerToken || !zidTokenForm.storeId}
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


