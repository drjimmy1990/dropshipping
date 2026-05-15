"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [authState, setAuthState] = useState<"loading" | "authorized" | "unauthorized">("loading");

  // Auth guard — check if user is logged in AND has admin role
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/auth/login");
          return;
        }

        // Check if user has admin role
        const { data: merchant } = await supabase
          .from("merchants")
          .select("role")
          .eq("id", user.id)
          .single();

        if (merchant?.role !== "admin") {
          // Not an admin — redirect to merchant dashboard
          router.replace("/dashboard");
          return;
        }

        setAuthState("authorized");
      } catch (err) {
        console.error("Admin auth check failed:", err);
        router.replace("/auth/login");
      }
    }

    checkAuth();
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  // Show loading state while checking auth
  if (authState === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If unauthorized, useEffect already redirected — render nothing
  if (authState !== "authorized") {
    return null;
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
        <div className="h-14 flex items-center px-4 border-b border-border-subtle">
          <Link href="/admin" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-accent-on text-xs font-bold shrink-0">
              SA
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-text truncate">
                  DropLinker
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
        <header className="h-14 shrink-0 bg-surface border-b border-border flex items-center justify-between px-6">
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
