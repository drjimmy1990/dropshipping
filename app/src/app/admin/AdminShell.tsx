"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Icon, ThemeToggle } from "@/components/shared";
import { createClient } from "@/lib/supabase/client";

const ADMIN_NAV = [
  { href: "/admin", icon: "dashboard", label: "Overview" },
  { href: "/admin/merchants", icon: "storefront", label: "Merchants" },
  { href: "/admin/orders", icon: "receipt_long", label: "Orders" },
  { href: "/admin/revenue", icon: "payments", label: "Revenue" },
  { href: "/admin/feeds", icon: "rss_feed", label: "Feeds" },
  { href: "/admin/transfers", icon: "account_balance", label: "Transfers" },
  { href: "/admin/settings", icon: "settings", label: "Settings" },
];

/**
 * Presentational admin shell. The admin-role gate is enforced server-side in
 * admin/layout.tsx (redirects non-admins before this renders).
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Admin Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-60"
        } shrink-0 bg-surface border-r border-border flex flex-col transition-all duration-200`}
      >
        {/* Logo + Admin indicator */}
        <div className="h-16 flex items-center px-4 border-b border-border-subtle">
          <Link href="/admin" className="flex items-center gap-3 min-w-0">
            <Image
              src="/tmtech-logo.png"
              alt="TMTECH"
              width={180}
              height={56}
              className={`${collapsed ? "h-10 w-10 object-contain" : "h-12 w-auto object-contain"} shrink-0`}
              priority
            />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold text-text truncate tracking-tight">
                  TMTECH
                </span>
                <span className="text-xs text-accent font-medium">Admin</span>
              </div>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {ADMIN_NAV.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                  isActive
                    ? "bg-accent-subtle text-accent font-medium"
                    : "text-text-secondary hover:bg-surface-sunken hover:text-text"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  name={item.icon}
                  className={`text-lg shrink-0 ${isActive ? "text-accent" : ""}`}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Back to dashboard + collapse */}
        <div className="border-t border-border-subtle p-2 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-sunken transition-colors"
          >
            <Icon name="arrow_back" className="text-lg shrink-0" />
            {!collapsed && <span>Back to Dashboard</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-md text-text-muted hover:bg-surface-sunken transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon
              name={collapsed ? "chevron_right" : "chevron_left"}
              className="text-lg"
            />
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 shrink-0 bg-surface border-b border-border flex items-center justify-between px-6">
          <span className="text-xs font-medium text-accent bg-accent-subtle px-2 py-1 rounded">
            ADMIN MODE
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-error hover:bg-surface-sunken transition-colors"
            >
              <Icon name="logout" className="text-base" />
              Sign Out
            </button>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-on text-xs font-bold">
              SA
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
