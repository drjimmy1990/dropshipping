"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Badge, Icon } from "@/components/shared";

interface Feed {
  id: string;
  name: string;
  displayName: string;
  displayNameAr: string;
  emoji: string;
  category: string;
  productCount: number;
  sortOrder: number;
  isEnabled: boolean;
}

// Default curated feeds — used until synced from API
const DEFAULT_FEEDS: Feed[] = [
  { id: "DS_NewArrivals", name: "DS_NewArrivals", displayName: "New Arrivals", displayNameAr: "وصل حديثاً", emoji: "🆕", category: "trending", productCount: 14010, sortOrder: 1, isEnabled: true },
  { id: "Bestseller 2024", name: "Bestseller 2024", displayName: "Bestsellers 2024", displayNameAr: "الأكثر مبيعاً", emoji: "🏆", category: "trending", productCount: 201065, sortOrder: 2, isEnabled: true },
  { id: "DS_ConsumerElectronics_bestsellers", name: "DS_ConsumerElectronics_bestsellers", displayName: "Consumer Electronics", displayNameAr: "إلكترونيات", emoji: "📱", category: "electronics", productCount: 19470, sortOrder: 3, isEnabled: true },
  { id: "DS_Home&Kitchen_bestsellers", name: "DS_Home&Kitchen_bestsellers", displayName: "Home & Kitchen", displayNameAr: "المنزل والمطبخ", emoji: "🏠", category: "home", productCount: 12300, sortOrder: 4, isEnabled: true },
  { id: "DS_Sports&Outdoors_bestsellers", name: "DS_Sports&Outdoors_bestsellers", displayName: "Sports & Outdoors", displayNameAr: "رياضة", emoji: "⚽", category: "sports", productCount: 27495, sortOrder: 5, isEnabled: true },
  { id: "SA_Clothing&Shoes", name: "SA_Clothing&Shoes", displayName: "Fashion (SA)", displayNameAr: "أزياء", emoji: "👗", category: "fashion", productCount: 13050, sortOrder: 6, isEnabled: true },
  { id: "DS_Beauty_bestsellers", name: "DS_Beauty_bestsellers", displayName: "Beauty", displayNameAr: "جمال", emoji: "💄", category: "beauty", productCount: 2594, sortOrder: 7, isEnabled: true },
  { id: "DS_Automobile&Accessories_bestsellers", name: "DS_Automobile&Accessories_bestsellers", displayName: "Auto & Accessories", displayNameAr: "سيارات", emoji: "🚗", category: "auto", productCount: 20340, sortOrder: 8, isEnabled: true },
  { id: "DS_ElectronicComponents_bestsellers", name: "DS_ElectronicComponents_bestsellers", displayName: "Electronic Components", displayNameAr: "مكونات إلكترونية", emoji: "🔌", category: "electronics", productCount: 2580, sortOrder: 9, isEnabled: true },
  { id: "DS_Sports-Clothing&Shoes", name: "DS_Sports-Clothing&Shoes", displayName: "Sportswear", displayNameAr: "ملابس رياضية", emoji: "🏃", category: "fashion", productCount: 7990, sortOrder: 10, isEnabled: true },
  { id: "DS_Christmas-Decor", name: "DS_Christmas-Decor", displayName: "Seasonal / Christmas", displayNameAr: "موسمي", emoji: "🎄", category: "seasonal", productCount: 6840, sortOrder: 11, isEnabled: false },
  { id: "DS center", name: "DS center", displayName: "DS Center (General)", displayNameAr: "مركز دروبشيبنج", emoji: "📦", category: "general", productCount: 0, sortOrder: 12, isEnabled: false },
  { id: "DS_HealthAndBeauty", name: "DS_HealthAndBeauty", displayName: "Health & Beauty", displayNameAr: "صحة وجمال", emoji: "💊", category: "beauty", productCount: 0, sortOrder: 13, isEnabled: false },
  { id: "DS_Toys&Games_bestsellers", name: "DS_Toys&Games_bestsellers", displayName: "Toys & Games", displayNameAr: "ألعاب", emoji: "🧸", category: "toys", productCount: 0, sortOrder: 14, isEnabled: false },
  { id: "DS_Jewelry&Watches_bestsellers", name: "DS_Jewelry&Watches_bestsellers", displayName: "Jewelry & Watches", displayNameAr: "مجوهرات وساعات", emoji: "💎", category: "fashion", productCount: 0, sortOrder: 15, isEnabled: false },
  { id: "DS_Home-Textile_bestsellers", name: "DS_Home-Textile_bestsellers", displayName: "Home Textile", displayNameAr: "مفروشات", emoji: "🛏️", category: "home", productCount: 0, sortOrder: 16, isEnabled: false },
  { id: "DS_Home-Improvement_bestsellers", name: "DS_Home-Improvement_bestsellers", displayName: "Home Improvement", displayNameAr: "تحسين المنزل", emoji: "🔨", category: "home", productCount: 0, sortOrder: 17, isEnabled: false },
  { id: "DS_Security&Protection_bestsellers", name: "DS_Security&Protection_bestsellers", displayName: "Security & Protection", displayNameAr: "أمن وحماية", emoji: "🔒", category: "electronics", productCount: 0, sortOrder: 18, isEnabled: false },
  { id: "DS_Tools_bestsellers", name: "DS_Tools_bestsellers", displayName: "Tools", displayNameAr: "أدوات", emoji: "🔧", category: "tools", productCount: 0, sortOrder: 19, isEnabled: false },
  { id: "DS_Office&School-Supplies_bestsellers", name: "DS_Office&School-Supplies_bestsellers", displayName: "Office & School", displayNameAr: "مكتبية ومدرسية", emoji: "📎", category: "office", productCount: 0, sortOrder: 20, isEnabled: false },
];

const CATEGORIES = ["all", "trending", "electronics", "home", "sports", "fashion", "beauty", "auto", "seasonal", "general", "toys", "tools", "office"];

const EMOJI_OPTIONS = ["🔥", "🆕", "🏆", "📱", "🏠", "⚽", "👗", "💄", "🚗", "🔌", "🏃", "🎄", "📦", "💊", "🧸", "💎", "🛏️", "🔨", "🔒", "🔧", "📎", "🎮", "🎧", "👶", "🐾", "🌱", "🎨", "📸", "⌚", "👜", "🩺", "🏋️", "🧰", "🪴", "🍳", "✨", "🌍", "🎁", "💡"];

const CATEGORY_OPTIONS = ["trending", "electronics", "home", "sports", "fashion", "beauty", "auto", "seasonal", "general", "toys", "tools", "office", "health", "pets", "garden"];

export default function AdminFeedsPage() {
  const [feeds, setFeeds] = useState<Feed[]>(DEFAULT_FEEDS);
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [editingFeed, setEditingFeed] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Feed>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFeeds = feeds.filter((f) => {
    const matchesCategory = filter === "all" || f.category === filter;
    const matchesSearch = !searchQuery || 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const enabledCount = feeds.filter((f) => f.isEnabled).length;

  const toggleFeed = (id: string) => {
    setFeeds((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isEnabled: !f.isEnabled } : f))
    );
    setSaved(false);
  };

  const startEditing = (feed: Feed) => {
    setEditingFeed(feed.id);
    setEditForm({
      displayName: feed.displayName,
      displayNameAr: feed.displayNameAr,
      emoji: feed.emoji,
      category: feed.category,
    });
  };

  const saveEdit = (id: string) => {
    setFeeds((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, ...editForm }
          : f
      )
    );
    setEditingFeed(null);
    setEditForm({});
    setSaved(false);
  };

  const cancelEdit = () => {
    setEditingFeed(null);
    setEditForm({});
  };

  // Sync feeds from AliExpress API
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch("/api/suppliers/aliexpress/feeds/sync", {
        method: "POST",
      });
      const data = await response.json();

      if (data.error) {
        setSyncResult(`Error: ${data.error}`);
        setSyncing(false);
        return;
      }

      if (data.feeds && data.feeds.length > 0) {
        // Merge synced feeds with existing config (preserve emoji/display/enabled state)
        const existingMap = new Map(feeds.map((f) => [f.name, f]));

        const mergedFeeds: Feed[] = data.feeds.map((syncedFeed: any, index: number) => {
          const existing = existingMap.get(syncedFeed.name);
          if (existing) {
            // Update product count from API, keep everything else
            return {
              ...existing,
              productCount: syncedFeed.productCount || existing.productCount,
              sortOrder: index,
            };
          }
          // New feed from API — auto-detect category from name
          const category = detectCategory(syncedFeed.name);
          return {
            id: syncedFeed.name,
            name: syncedFeed.name,
            displayName: prettifyFeedName(syncedFeed.name),
            displayNameAr: "",
            emoji: detectEmoji(category),
            category,
            productCount: syncedFeed.productCount || 0,
            sortOrder: index,
            isEnabled: false, // New feeds disabled by default
          };
        });

        setFeeds(mergedFeeds);
        setSyncResult(`✅ Synced ${data.totalFeeds} feeds from AliExpress. ${mergedFeeds.length - feeds.length > 0 ? `${mergedFeeds.length - feeds.length} new feeds found!` : 'All counts updated.'}`);
      } else {
        setSyncResult("⚠️ No feeds returned from API. Token may have expired.");
      }
    } catch (err) {
      setSyncResult(`Error: ${err instanceof Error ? err.message : "Sync failed"}`);
    } finally {
      setSyncing(false);
      setSaved(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save to platform_feeds table via Supabase
    // For now, persist via the feeds API
    try {
      const enabledFeeds = feeds
        .filter((f) => f.isEnabled)
        .map((f) => ({
          id: f.id,
          name: f.name,
          displayName: `${f.emoji} ${f.displayName}`,
          displayNameAr: f.displayNameAr,
          category: f.category,
          productCount: f.productCount,
          sortOrder: f.sortOrder,
        }));

      // Save to localStorage as interim persistence
      localStorage.setItem("admin_feeds_config", JSON.stringify(feeds));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // Load saved config from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("admin_feeds_config");
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFeeds(parsed);
        }
      }
    } catch {}
  }, []);

  const enableAll = () => {
    setFeeds((prev) => prev.map((f) => ({ ...f, isEnabled: true })));
    setSaved(false);
  };

  const disableAll = () => {
    setFeeds((prev) => prev.map((f) => ({ ...f, isEnabled: false })));
    setSaved(false);
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">Feed Management</h1>
          <p className="text-sm text-text-secondary">
            Control which AliExpress product feeds merchants can browse. {enabledCount} of {feeds.length} feeds enabled.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {saved && (
            <span className="text-sm text-success flex items-center gap-1">
              <Icon name="check_circle" className="text-base" /> Saved
            </span>
          )}
          <Button onClick={handleSync} disabled={syncing} variant="secondary">
            <Icon name="sync" className={`text-base mr-1 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync from AliExpress"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Sync result banner */}
      {syncResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          syncResult.startsWith("✅") ? "bg-success/10 text-success border border-success/20" :
          syncResult.startsWith("⚠️") ? "bg-warning/10 text-warning border border-warning/20" :
          "bg-error/10 text-error border border-error/20"
        }`}>
          {syncResult}
          <button onClick={() => setSyncResult(null)} className="ml-2 text-text-muted hover:text-text">✕</button>
        </div>
      )}

      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-base" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feeds..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={enableAll}
            className="px-2.5 py-1.5 rounded-md text-xs font-medium text-success bg-success/10 hover:bg-success/20 transition-colors"
          >
            Enable All
          </button>
          <button
            onClick={disableAll}
            className="px-2.5 py-1.5 rounded-md text-xs font-medium text-error bg-error/10 hover:bg-error/20 transition-colors"
          >
            Disable All
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto mb-4 pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors capitalize ${
              filter === cat
                ? "bg-accent text-accent-on"
                : "bg-surface text-text-secondary hover:bg-surface-sunken border border-border"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feed table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-text-muted font-medium w-16">On/Off</th>
                <th className="text-left p-3 text-text-muted font-medium w-12">Icon</th>
                <th className="text-left p-3 text-text-muted font-medium">Feed Name</th>
                <th className="text-left p-3 text-text-muted font-medium">Display Name</th>
                <th className="text-left p-3 text-text-muted font-medium">Arabic</th>
                <th className="text-left p-3 text-text-muted font-medium">Category</th>
                <th className="text-right p-3 text-text-muted font-medium">Products</th>
                <th className="text-center p-3 text-text-muted font-medium w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeeds.map((feed) => (
                <tr key={feed.id} className="border-b border-border-subtle hover:bg-surface-sunken/50 transition-colors">
                  {/* Toggle */}
                  <td className="p-3">
                    <button
                      onClick={() => toggleFeed(feed.id)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        feed.isEnabled ? "bg-success" : "bg-border"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          feed.isEnabled ? "left-5" : "left-1"
                        }`}
                      />
                    </button>
                  </td>

                  {/* Emoji */}
                  <td className="p-3">
                    {editingFeed === feed.id ? (
                      <select
                        value={editForm.emoji || feed.emoji}
                        onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                        className="w-12 h-8 text-lg bg-surface border border-border rounded text-center"
                      >
                        {EMOJI_OPTIONS.map((e) => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-lg cursor-pointer" onClick={() => startEditing(feed)}>
                        {feed.emoji}
                      </span>
                    )}
                  </td>

                  {/* API Feed Name */}
                  <td className="p-3">
                    <code className="text-xs bg-surface-sunken px-2 py-1 rounded text-text-secondary">
                      {feed.name}
                    </code>
                  </td>

                  {/* Display Name */}
                  <td className="p-3">
                    {editingFeed === feed.id ? (
                      <input
                        type="text"
                        value={editForm.displayName ?? feed.displayName}
                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                        className="w-full px-2 py-1 border border-border rounded text-sm bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    ) : (
                      <span className="text-text font-medium">{feed.displayName}</span>
                    )}
                  </td>

                  {/* Arabic Name */}
                  <td className="p-3">
                    {editingFeed === feed.id ? (
                      <input
                        type="text"
                        dir="rtl"
                        value={editForm.displayNameAr ?? feed.displayNameAr}
                        onChange={(e) => setEditForm({ ...editForm, displayNameAr: e.target.value })}
                        className="w-full px-2 py-1 border border-border rounded text-sm bg-surface text-text focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="اسم عربي"
                      />
                    ) : (
                      <span className="text-text-secondary" dir="rtl">
                        {feed.displayNameAr || "—"}
                      </span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="p-3">
                    {editingFeed === feed.id ? (
                      <select
                        value={editForm.category || feed.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="px-2 py-1 border border-border rounded text-sm bg-surface text-text capitalize"
                      >
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="neutral">{feed.category}</Badge>
                    )}
                  </td>

                  {/* Product Count */}
                  <td className="p-3 text-right text-text-secondary">
                    {feed.productCount > 0 ? feed.productCount.toLocaleString() : "—"}
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-center">
                    {editingFeed === feed.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => saveEdit(feed.id)}
                          className="p-1 rounded text-success hover:bg-success/10 transition-colors"
                          title="Save"
                        >
                          <Icon name="check" className="text-base" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 rounded text-error hover:bg-error/10 transition-colors"
                          title="Cancel"
                        >
                          <Icon name="close" className="text-base" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(feed)}
                        className="p-1 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Edit feed"
                      >
                        <Icon name="edit" className="text-base" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFeeds.length === 0 && (
          <div className="text-center py-8 text-text-muted text-sm">
            No feeds match your filter.
          </div>
        )}
      </Card>

      {/* Summary */}
      <div className="mt-4 text-xs text-text-muted">
        Showing {filteredFeeds.length} of {feeds.length} feeds • {enabledCount} enabled
      </div>
    </>
  );
}

// ---------- Helpers ----------

function detectCategory(feedName: string): string {
  const name = feedName.toLowerCase();
  if (name.includes("electronic") || name.includes("phone") || name.includes("computer")) return "electronics";
  if (name.includes("home") || name.includes("kitchen") || name.includes("textile")) return "home";
  if (name.includes("sport") || name.includes("outdoor")) return "sports";
  if (name.includes("clothing") || name.includes("shoes") || name.includes("fashion") || name.includes("jewelry")) return "fashion";
  if (name.includes("beauty") || name.includes("health")) return "beauty";
  if (name.includes("auto") || name.includes("car")) return "auto";
  if (name.includes("toy") || name.includes("game")) return "toys";
  if (name.includes("tool")) return "tools";
  if (name.includes("office") || name.includes("school")) return "office";
  if (name.includes("christmas") || name.includes("season")) return "seasonal";
  if (name.includes("bestseller") || name.includes("new")) return "trending";
  return "general";
}

function detectEmoji(category: string): string {
  const map: Record<string, string> = {
    trending: "🔥", electronics: "📱", home: "🏠", sports: "⚽",
    fashion: "👗", beauty: "💄", auto: "🚗", toys: "🧸",
    tools: "🔧", office: "📎", seasonal: "🎄", general: "📦",
    health: "💊", pets: "🐾", garden: "🌱",
  };
  return map[category] || "📦";
}

function prettifyFeedName(name: string): string {
  return name
    .replace(/^DS_/, "")
    .replace(/^SA_/, "")
    .replace(/_bestsellers$/i, "")
    .replace(/&/g, " & ")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
