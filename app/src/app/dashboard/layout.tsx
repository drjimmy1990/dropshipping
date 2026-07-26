"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Icon, ThemeToggle } from "@/components/shared";
import { DASHBOARD_NAV_ITEMS } from "@/data/mockData";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userInitial, setUserInitial] = useState("M");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name =
          user.user_metadata?.business_name || user.email || "M";
        setUserInitial(name.charAt(0).toUpperCase());
      }
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-60"
        } shrink-0 bg-surface border-r border-border flex flex-col transition-all duration-200`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border-subtle">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <Image
              src="/tmtech-logo.png"
              alt="TMTECH"
              width={180}
              height={56}
              className={`${collapsed ? "h-10 w-10 object-contain" : "h-12 w-auto object-contain"} shrink-0`}
              priority
            />
            {!collapsed && (
              <span className="text-xl font-bold text-text truncate tracking-tight">
                TMTECH
              </span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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

        {/* Collapse toggle */}
        <div className="border-t border-border-subtle p-2">
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
          <div />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="p-2 rounded-md text-text-secondary hover:bg-surface-sunken transition-colors">
              <Icon name="notifications" className="text-lg" />
            </button>
            {/* User avatar + dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full bg-accent-subtle flex items-center justify-center text-accent text-sm font-medium hover:ring-2 hover:ring-accent/30 transition-all"
              >
                {userInitial}
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 w-44 bg-surface border border-border rounded-lg shadow-lg py-1 z-50">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-sunken transition-colors"
                  >
                    <Icon name="settings" className="text-base" />
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-surface-sunken transition-colors"
                  >
                    <Icon name="logout" className="text-base" />
                    Sign Out
                  </button>
                </div>
              )}
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
