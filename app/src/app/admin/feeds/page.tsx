"use client";

import React, { useState, useEffect } from "react";
import { Card, Button, Badge, Icon } from "@/components/shared";

interface Feed {
  id: string;
  name: string;
  displayName: string;
  displayNameAr: string;
  category: string;
  productCount: number;
  sortOrder: number;
  isEnabled?: boolean;
}

// All 47 known feeds from AliExpress API
const ALL_FEEDS: Feed[] = [
  { id: "DS_NewArrivals", name: "DS_NewArrivals", displayName: "New Arrivals", displayNameAr: "وصل حديثاً", category: "trending", productCount: 14010, sortOrder: 1, isEnabled: true },
  { id: "Bestseller 2024", name: "Bestseller 2024", displayName: "Bestsellers 2024", displayNameAr: "الأكثر مبيعاً", category: "trending", productCount: 201065, sortOrder: 2, isEnabled: true },
  { id: "DS_ConsumerElectronics_bestsellers", name: "DS_ConsumerElectronics_bestsellers", displayName: "Consumer Electronics", displayNameAr: "إلكترونيات", category: "electronics", productCount: 19470, sortOrder: 3, isEnabled: true },
  { id: "DS_Home&Kitchen_bestsellers", name: "DS_Home&Kitchen_bestsellers", displayName: "Home & Kitchen", displayNameAr: "المنزل والمطبخ", category: "home", productCount: 12300, sortOrder: 4, isEnabled: true },
  { id: "DS_Sports&Outdoors_bestsellers", name: "DS_Sports&Outdoors_bestsellers", displayName: "Sports & Outdoors", displayNameAr: "رياضة", category: "sports", productCount: 27495, sortOrder: 5, isEnabled: true },
  { id: "SA_Clothing&Shoes", name: "SA_Clothing&Shoes", displayName: "Fashion (SA)", displayNameAr: "أزياء", category: "fashion", productCount: 13050, sortOrder: 6, isEnabled: true },
  { id: "DS_Beauty_bestsellers", name: "DS_Beauty_bestsellers", displayName: "Beauty", displayNameAr: "جمال", category: "beauty", productCount: 2594, sortOrder: 7, isEnabled: true },
  { id: "DS_Automobile&Accessories_bestsellers", name: "DS_Automobile&Accessories_bestsellers", displayName: "Auto & Accessories", displayNameAr: "سيارات", category: "auto", productCount: 20340, sortOrder: 8, isEnabled: true },
  { id: "DS_ElectronicComponents_bestsellers", name: "DS_ElectronicComponents_bestsellers", displayName: "Electronic Components", displayNameAr: "مكونات إلكترونية", category: "electronics", productCount: 2580, sortOrder: 9, isEnabled: true },
  { id: "DS_Sports-Clothing&Shoes", name: "DS_Sports-Clothing&Shoes", displayName: "Sportswear", displayNameAr: "ملابس رياضية", category: "fashion", productCount: 7990, sortOrder: 10, isEnabled: true },
  { id: "DS_Christmas-Decor", name: "DS_Christmas-Decor", displayName: "Seasonal / Christmas", displayNameAr: "موسمي", category: "seasonal", productCount: 6840, sortOrder: 11, isEnabled: false },
  // Additional known feeds — disabled by default
  { id: "DS center", name: "DS center", displayName: "DS Center (General)", displayNameAr: "مركز دروبشيبنج", category: "general", productCount: 0, sortOrder: 12, isEnabled: false },
  { id: "DS_HealthAndBeauty", name: "DS_HealthAndBeauty", displayName: "Health & Beauty", displayNameAr: "صحة وجمال", category: "beauty", productCount: 0, sortOrder: 13, isEnabled: false },
  { id: "DS_Toys&Games_bestsellers", name: "DS_Toys&Games_bestsellers", displayName: "Toys & Games", displayNameAr: "ألعاب", category: "toys", productCount: 0, sortOrder: 14, isEnabled: false },
  { id: "DS_Jewelry&Watches_bestsellers", name: "DS_Jewelry&Watches_bestsellers", displayName: "Jewelry & Watches", displayNameAr: "مجوهرات وساعات", category: "fashion", productCount: 0, sortOrder: 15, isEnabled: false },
  { id: "DS_Home-Textile_bestsellers", name: "DS_Home-Textile_bestsellers", displayName: "Home Textile", displayNameAr: "مفروشات", category: "home", productCount: 0, sortOrder: 16, isEnabled: false },
  { id: "DS_Home-Improvement_bestsellers", name: "DS_Home-Improvement_bestsellers", displayName: "Home Improvement", displayNameAr: "تحسين المنزل", category: "home", productCount: 0, sortOrder: 17, isEnabled: false },
  { id: "DS_Security&Protection_bestsellers", name: "DS_Security&Protection_bestsellers", displayName: "Security & Protection", displayNameAr: "أمن وحماية", category: "electronics", productCount: 0, sortOrder: 18, isEnabled: false },
  { id: "DS_Tools_bestsellers", name: "DS_Tools_bestsellers", displayName: "Tools", displayNameAr: "أدوات", category: "tools", productCount: 0, sortOrder: 19, isEnabled: false },
  { id: "DS_Office&School-Supplies_bestsellers", name: "DS_Office&School-Supplies_bestsellers", displayName: "Office & School", displayNameAr: "مكتبية ومدرسية", category: "office", productCount: 0, sortOrder: 20, isEnabled: false },
];

const CATEGORIES = ["all", "trending", "electronics", "home", "sports", "fashion", "beauty", "auto", "seasonal", "general", "toys", "tools", "office"];

export default function AdminFeedsPage() {
  const [feeds, setFeeds] = useState<Feed[]>(ALL_FEEDS);
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const filteredFeeds = filter === "all"
    ? feeds
    : feeds.filter((f) => f.category === filter);

  const enabledCount = feeds.filter((f) => f.isEnabled).length;

  const toggleFeed = (id: string) => {
    setFeeds((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isEnabled: !f.isEnabled } : f))
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save to platform_feeds table when it exists
    // For now, just simulate save
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Feed Management</h1>
          <p className="text-sm text-text-secondary">
            Control which AliExpress product feeds merchants can browse. {enabledCount} of {feeds.length} feeds enabled.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm text-success flex items-center gap-1">
              <Icon name="check_circle" className="text-base" /> Saved
            </span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
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
                <th className="text-left p-3 text-text-muted font-medium">Enabled</th>
                <th className="text-left p-3 text-text-muted font-medium">Feed Name</th>
                <th className="text-left p-3 text-text-muted font-medium">Display Name</th>
                <th className="text-left p-3 text-text-muted font-medium">Arabic</th>
                <th className="text-left p-3 text-text-muted font-medium">Category</th>
                <th className="text-right p-3 text-text-muted font-medium">Products</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeeds.map((feed) => (
                <tr key={feed.id} className="border-b border-border-subtle hover:bg-surface-sunken/50 transition-colors">
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
                  <td className="p-3">
                    <code className="text-xs bg-surface-sunken px-2 py-1 rounded text-text-secondary">
                      {feed.name}
                    </code>
                  </td>
                  <td className="p-3 text-text font-medium">{feed.displayName}</td>
                  <td className="p-3 text-text-secondary" dir="rtl">{feed.displayNameAr}</td>
                  <td className="p-3">
                    <Badge variant="neutral">{feed.category}</Badge>
                  </td>
                  <td className="p-3 text-right text-text-secondary">
                    {feed.productCount > 0
                      ? feed.productCount.toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
