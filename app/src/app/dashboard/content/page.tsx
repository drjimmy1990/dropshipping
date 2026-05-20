"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/shared";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───
interface ContentAsset {
  id: string;
  type: "description" | "social_post" | "carousel" | "reel" | "image";
  status: "generating" | "pending_review" | "approved" | "rejected" | "published";
  title_en: string | null;
  title_ar: string | null;
  body_en: string | null;
  body_ar: string | null;
  caption: string | null;
  hashtags: string[];
  media_urls: string[];
  thumbnail_url: string | null;
  ai_provider: string | null;
  ai_model: string | null;
  created_at: string;
  products?: { title_en: string; title_ar: string; images: string[]; supplier: string } | null;
}

interface SocialAccount {
  id: string;
  platform: string;
  auth_method: string;
  account_name: string | null;
  is_active: boolean;
  last_published_at: string | null;
  created_at: string;
}

interface ScheduledPost {
  id: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  content_assets?: { id: string; type: string; title_en: string; caption: string; thumbnail_url: string } | null;
  social_accounts?: { id: string; platform: string; account_name: string } | null;
  created_at: string;
}

interface ContentTemplate {
  id: string;
  name: string;
  type: string;
  category: string | null;
  prompt_template: string;
  preview_url: string | null;
}

// ─── Tab Definitions ───
const TABS = [
  { id: "library", label: "Content Library", icon: "collections" },
  { id: "accounts", label: "Social Accounts", icon: "group" },
  { id: "scheduler", label: "Scheduler", icon: "calendar_month" },
  { id: "templates", label: "Templates", icon: "dashboard_customize" },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Status/Type Config ───
const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  generating: { bg: "bg-yellow-500/10", text: "text-yellow-500", label: "Generating" },
  pending_review: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Pending Review" },
  approved: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Approved" },
  rejected: { bg: "bg-red-500/10", text: "text-red-500", label: "Rejected" },
  published: { bg: "bg-purple-500/10", text: "text-purple-500", label: "Published" },
};

const TYPE_ICONS: Record<string, { icon: string; label: string }> = {
  description: { icon: "description", label: "Description" },
  social_post: { icon: "post_add", label: "Social Post" },
  carousel: { icon: "view_carousel", label: "Carousel" },
  reel: { icon: "videocam", label: "Reel" },
  image: { icon: "image", label: "Image" },
};

const PLATFORM_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  instagram: { icon: "photo_camera", color: "text-pink-500", label: "Instagram" },
  tiktok: { icon: "music_note", color: "text-cyan-400", label: "TikTok" },
  x: { icon: "tag", color: "text-text", label: "X / Twitter" },
  facebook: { icon: "thumb_up", color: "text-blue-500", label: "Facebook" },
  snapchat: { icon: "photo_camera_front", color: "text-yellow-400", label: "Snapchat" },
  blotato: { icon: "hub", color: "text-emerald-500", label: "Blotato" },
};

// ─── Main Component ───
export default function ContentHubPage() {
  const [activeTab, setActiveTab] = useState<TabId>("library");
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Connect Account Modal
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectForm, setConnectForm] = useState({
    platform: "instagram",
    auth_method: "token",
    account_name: "",
    access_token: "",
  });
  const [connectLoading, setConnectLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "library") {
        const params = new URLSearchParams();
        if (filterType !== "all") params.set("type", filterType);
        if (filterStatus !== "all") params.set("status", filterStatus);
        const res = await fetch(`/api/content/assets?${params}`);
        const data = await res.json();
        setAssets(data.assets || []);
      } else if (activeTab === "accounts") {
        const res = await fetch("/api/social/accounts");
        const data = await res.json();
        setAccounts(data.accounts || []);
      } else if (activeTab === "scheduler") {
        const res = await fetch("/api/content/schedule");
        const data = await res.json();
        setPosts(data.posts || []);
      } else if (activeTab === "templates") {
        const res = await fetch("/api/content/templates");
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  }, [activeTab, filterType, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Handlers ───
  async function handleUpdateAssetStatus(id: string, status: string) {
    try {
      await fetch(`/api/content/assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (err) { console.error("Update error:", err); }
  }

  async function handleDeleteAsset(id: string) {
    if (!confirm("Delete this content asset?")) return;
    try {
      await fetch(`/api/content/assets/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) { console.error("Delete error:", err); }
  }

  async function handleConnectAccount() {
    setConnectLoading(true);
    try {
      const res = await fetch("/api/social/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectForm),
      });
      if (res.ok) {
        setShowConnectModal(false);
        setConnectForm({ platform: "instagram", auth_method: "token", account_name: "", access_token: "" });
        fetchData();
      }
    } catch (err) { console.error("Connect error:", err); }
    setConnectLoading(false);
  }

  async function handleDisconnectAccount(id: string) {
    if (!confirm("Disconnect this account?")) return;
    try {
      await fetch(`/api/social/accounts/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) { console.error("Disconnect error:", err); }
  }

  async function handleCancelPost(id: string) {
    try {
      await fetch(`/api/content/schedule/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) { console.error("Cancel error:", err); }
  }

  // ─── Render ───
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text">Content Hub</h1>
        <p className="text-sm text-text-secondary mt-1">
          Generate AI content, manage social media, and schedule posts
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-sunken p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-surface text-text shadow-sm"
                : "text-text-secondary hover:text-text"
            }`}
          >
            <Icon name={tab.icon} className="text-base" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "library" && (
          <LibraryTab
            assets={assets}
            loading={loading}
            filterType={filterType}
            filterStatus={filterStatus}
            onFilterType={setFilterType}
            onFilterStatus={setFilterStatus}
            onUpdateStatus={handleUpdateAssetStatus}
            onDelete={handleDeleteAsset}
          />
        )}
        {activeTab === "accounts" && (
          <AccountsTab
            accounts={accounts}
            loading={loading}
            showModal={showConnectModal}
            connectForm={connectForm}
            connectLoading={connectLoading}
            onShowModal={setShowConnectModal}
            onFormChange={setConnectForm}
            onConnect={handleConnectAccount}
            onDisconnect={handleDisconnectAccount}
          />
        )}
        {activeTab === "scheduler" && (
          <SchedulerTab
            posts={posts}
            loading={loading}
            onCancel={handleCancelPost}
          />
        )}
        {activeTab === "templates" && (
          <TemplatesTab templates={templates} loading={loading} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: Content Library
// ═══════════════════════════════════════════
function LibraryTab({
  assets, loading, filterType, filterStatus,
  onFilterType, onFilterStatus, onUpdateStatus, onDelete,
}: {
  assets: ContentAsset[];
  loading: boolean;
  filterType: string;
  filterStatus: string;
  onFilterType: (v: string) => void;
  onFilterStatus: (v: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filterType}
          onChange={(e) => onFilterType(e.target.value)}
          className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text"
        >
          <option value="all">All Types</option>
          <option value="description">Descriptions</option>
          <option value="social_post">Social Posts</option>
          <option value="carousel">Carousels</option>
          <option value="reel">Reels</option>
          <option value="image">Images</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text"
        >
          <option value="all">All Status</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-20">
          <Icon name="auto_awesome" className="text-4xl text-text-muted mb-3" />
          <p className="text-text-secondary">No content assets yet</p>
          <p className="text-sm text-text-muted mt-1">
            Generate AI content from your product pages
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => {
            const typeCfg = TYPE_ICONS[asset.type] || TYPE_ICONS.description;
            const statusCfg = STATUS_BADGES[asset.status] || STATUS_BADGES.pending_review;

            return (
              <div
                key={asset.id}
                className="bg-surface border border-border rounded-xl p-4 space-y-3 hover:border-border-subtle transition-colors"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name={typeCfg.icon} className="text-lg text-text-secondary" />
                    <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                      {typeCfg.label}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Preview */}
                <div>
                  <p className="text-sm font-medium text-text line-clamp-1">
                    {asset.title_en || asset.title_ar || "Untitled"}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                    {asset.body_en || asset.body_ar || asset.caption || "No content preview"}
                  </p>
                </div>

                {/* Product link */}
                {asset.products && (
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Icon name="inventory_2" className="text-sm" />
                    <span className="line-clamp-1">{asset.products.title_en || asset.products.title_ar}</span>
                  </div>
                )}

                {/* Hashtags */}
                {asset.hashtags && asset.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {asset.hashtags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-surface-sunken rounded text-xs text-text-muted">
                        {tag.startsWith("#") ? tag : `#${tag}`}
                      </span>
                    ))}
                    {asset.hashtags.length > 3 && (
                      <span className="text-xs text-text-muted">+{asset.hashtags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                  <span className="text-xs text-text-muted">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    {asset.status === "pending_review" && (
                      <>
                        <button
                          onClick={() => onUpdateStatus(asset.id, "approved")}
                          className="p-1.5 rounded-md hover:bg-emerald-500/10 text-emerald-500 transition-colors"
                          title="Approve"
                        >
                          <Icon name="check_circle" className="text-base" />
                        </button>
                        <button
                          onClick={() => onUpdateStatus(asset.id, "rejected")}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Reject"
                        >
                          <Icon name="cancel" className="text-base" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onDelete(asset.id)}
                      className="p-1.5 rounded-md hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                      title="Delete"
                    >
                      <Icon name="delete" className="text-base" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: Social Accounts
// ═══════════════════════════════════════════
function AccountsTab({
  accounts, loading, showModal, connectForm, connectLoading,
  onShowModal, onFormChange, onConnect, onDisconnect,
}: {
  accounts: SocialAccount[];
  loading: boolean;
  showModal: boolean;
  connectForm: { platform: string; auth_method: string; account_name: string; access_token: string };
  connectLoading: boolean;
  onShowModal: (v: boolean) => void;
  onFormChange: (v: { platform: string; auth_method: string; account_name: string; access_token: string }) => void;
  onConnect: () => void;
  onDisconnect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-text-secondary">
          Connect your social media accounts to auto-publish content
        </p>
        <button
          onClick={() => onShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-on rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Icon name="add" className="text-base" />
          Connect Account
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20">
          <Icon name="group" className="text-4xl text-text-muted mb-3" />
          <p className="text-text-secondary">No social accounts connected</p>
          <p className="text-sm text-text-muted mt-1">
            Connect Instagram, TikTok, X, or Blotato to start auto-publishing
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const cfg = PLATFORM_CONFIG[acc.platform] || PLATFORM_CONFIG.instagram;
            return (
              <div
                key={acc.id}
                className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-lg bg-surface-sunken flex items-center justify-center ${cfg.color}`}>
                  <Icon name={cfg.icon} className="text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{cfg.label}</p>
                  <p className="text-xs text-text-secondary truncate">
                    {acc.account_name || "Connected"}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    via {acc.auth_method === "blotato" ? "Blotato" : "Direct Token"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`w-2 h-2 rounded-full ${acc.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                  <button
                    onClick={() => onDisconnect(acc.id)}
                    className="text-xs text-error hover:underline"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connect Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-text">Connect Social Account</h3>
              <button onClick={() => onShowModal(false)} className="text-text-muted hover:text-text">
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Platform</label>
                <select
                  value={connectForm.platform}
                  onChange={(e) => onFormChange({ ...connectForm, platform: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-lg text-sm text-text"
                >
                  {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-text-secondary mb-1 block">Connection Method</label>
                <select
                  value={connectForm.auth_method}
                  onChange={(e) => onFormChange({ ...connectForm, auth_method: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-lg text-sm text-text"
                >
                  <option value="token">Direct API Token</option>
                  <option value="blotato">Blotato Credentials</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-text-secondary mb-1 block">Account Name</label>
                <input
                  type="text"
                  value={connectForm.account_name}
                  onChange={(e) => onFormChange({ ...connectForm, account_name: e.target.value })}
                  placeholder="@youraccount"
                  className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-lg text-sm text-text"
                />
              </div>

              {connectForm.auth_method === "token" && (
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">API Access Token</label>
                  <input
                    type="password"
                    value={connectForm.access_token}
                    onChange={(e) => onFormChange({ ...connectForm, access_token: e.target.value })}
                    placeholder="Paste your access token"
                    className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-lg text-sm text-text"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => onShowModal(false)}
                className="flex-1 px-4 py-2 bg-surface-sunken text-text-secondary rounded-lg text-sm hover:bg-surface-sunken/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConnect}
                disabled={connectLoading || !connectForm.account_name}
                className="flex-1 px-4 py-2 bg-accent text-accent-on rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {connectLoading ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: Scheduler
// ═══════════════════════════════════════════
function SchedulerTab({
  posts, loading, onCancel,
}: {
  posts: ScheduledPost[];
  loading: boolean;
  onCancel: (id: string) => void;
}) {
  const POST_STATUS: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-gray-500/10", text: "text-gray-500", label: "Draft" },
    scheduled: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Scheduled" },
    publishing: { bg: "bg-yellow-500/10", text: "text-yellow-500", label: "Publishing" },
    published: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Published" },
    failed: { bg: "bg-red-500/10", text: "text-red-500", label: "Failed" },
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Upcoming and past scheduled posts across all platforms
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <Icon name="calendar_month" className="text-4xl text-text-muted mb-3" />
          <p className="text-text-secondary">No scheduled posts</p>
          <p className="text-sm text-text-muted mt-1">
            Approve content and schedule it for publishing
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Content</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Platform</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Scheduled</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const statusCfg = POST_STATUS[post.status] || POST_STATUS.draft;
                const platformCfg = PLATFORM_CONFIG[post.social_accounts?.platform || ""] || PLATFORM_CONFIG.instagram;

                return (
                  <tr key={post.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-sunken/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm text-text line-clamp-1">
                        {post.content_assets?.title_en || post.content_assets?.caption || "Untitled"}
                      </p>
                      <p className="text-xs text-text-muted capitalize">{post.content_assets?.type?.replace("_", " ")}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon name={platformCfg.icon} className={`text-base ${platformCfg.color}`} />
                        <span className="text-sm text-text">{post.social_accounts?.account_name || platformCfg.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {post.scheduled_at
                        ? new Date(post.scheduled_at).toLocaleString()
                        : "Not scheduled"}
                      {post.is_recurring && (
                        <span className="ml-1 text-xs text-accent">🔄 {post.recurrence_rule}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(post.status === "draft" || post.status === "scheduled") && (
                        <button
                          onClick={() => onCancel(post.id)}
                          className="text-xs text-error hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: Templates
// ═══════════════════════════════════════════
function TemplatesTab({
  templates, loading,
}: {
  templates: ContentTemplate[];
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Pre-built prompt templates for quick content generation
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20">
          <Icon name="dashboard_customize" className="text-4xl text-text-muted mb-3" />
          <p className="text-text-secondary">No templates available</p>
          <p className="text-sm text-text-muted mt-1">
            Run the SQL migration to seed default templates
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const typeCfg = TYPE_ICONS[tpl.type] || TYPE_ICONS.social_post;
            return (
              <div
                key={tpl.id}
                className="bg-surface border border-border rounded-xl p-4 space-y-3 hover:border-accent/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Icon name={typeCfg.icon} className="text-base text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{tpl.name}</p>
                    <p className="text-xs text-text-muted capitalize">{tpl.type.replace("_", " ")} • {tpl.category}</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary line-clamp-3">
                  {tpl.prompt_template}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
