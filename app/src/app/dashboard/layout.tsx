"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/shared";
import { DASHBOARD_NAV_ITEMS } from "@/data/mockData";

/* ================================================================
   DASHBOARD LAYOUT — Sidebar + TopBar + Content Area
   ================================================================ */

// --- Sidebar ---
function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-surface-container-lowest border-r border-white/10 flex flex-col z-40 transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/5">
        {!collapsed && (
          <Link href="/" className="text-lg font-bold tracking-tight text-on-surface">
            DropLinker
          </Link>
        )}
        <button
          onClick={onToggle}
          className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-white/5 transition-colors"
        >
          <Icon name={collapsed ? "menu_open" : "menu"} size="md" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-primary-container/15 text-primary border border-primary/20"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                name={item.icon}
                filled={isActive}
                className={isActive ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"}
                size="md"
              />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">
            A
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-medium text-on-surface">Ahmed</div>
              <div className="text-xs text-on-surface-variant">Merchant</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// --- Top Bar ---
function TopBar({ sidebarWidth }: { sidebarWidth: number }) {
  return (
    <header
      className="fixed top-0 right-0 h-16 bg-surface/80 backdrop-blur-md border-b border-white/10 z-30 flex items-center justify-between px-6"
      style={{ left: sidebarWidth }}
    >
      <div>
        <h1 className="text-lg font-semibold text-on-surface">Welcome back, Ahmed</h1>
      </div>
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2 border border-outline-variant/30 focus-within:border-secondary-container transition-colors">
          <Icon name="search" size="sm" className="text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-on-surface outline-none w-48 placeholder:text-on-surface-variant/50"
          />
        </div>
        {/* Notifications */}
        <button className="relative text-on-surface-variant hover:text-on-surface p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Icon name="notifications" size="md" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error" />
        </button>
        {/* Language Toggle */}
        <button className="text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-xs font-semibold border border-outline-variant/30">
          AR/EN
        </button>
      </div>
    </header>
  );
}

// --- Dashboard Layout ---
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <TopBar sidebarWidth={sidebarWidth} />
      <main
        className="pt-16 transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
